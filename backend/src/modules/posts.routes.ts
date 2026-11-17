import { Router } from "express";
import { z } from "zod";
import { prisma, ContentStatus, type Prisma } from "../db";
import { requirePermission, can } from "../auth/session";
import { body, cleanText, idParam, pagination, parse, slugify, slugSchema } from "../lib/validate";
import { badRequest, created, forbidden, notFound, ok, pageMeta } from "../lib/http";
import { audit } from "../lib/audit";
import { assertSlugFree, blocksSchema, faqInputSchema, normalizeBlocks, replaceFaqs, revalidateSite, seoSchema, seoWrite, statusSchema, uniqueSlug } from "../lib/content";

export const postsRouter = Router();

const postSchema = z.object({
  title: cleanText(160).pipe(z.string().min(3)),
  slug: slugSchema.optional(),
  excerpt: cleanText(400).default(""),
  intro: cleanText(3000).default(""),
  body: blocksSchema.default([]),
  categoryId: z.string().max(40),
  authorId: z.string().max(40),
  status: statusSchema.default(ContentStatus.DRAFT),
  /** Required when status = SCHEDULED; defaults to now when publishing. */
  publishedAt: z.coerce.date().nullish(),
  featuredImageId: z.string().max(40).nullish(),
  isFeatured: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  tags: z.array(cleanText(50).pipe(z.string().min(1))).max(20).default([]),
  relatedServiceIds: z.array(z.string().max(40)).max(10).default([]),
  faqs: z.array(faqInputSchema).max(30).default([]),
  seo: seoSchema,
});

const include = {
  category: true,
  author: true,
  featuredImage: true,
  seo: { include: { ogImage: true } },
  tags: { include: { tag: true } },
  services: { orderBy: { sortOrder: "asc" as const }, select: { serviceId: true } },
  faqs: { orderBy: { sortOrder: "asc" as const } },
  keywords: { select: { id: true, keyword: true, role: true } },
};

function resolvePublishDate(status: ContentStatus, publishedAt: Date | null | undefined, previous?: Date | null) {
  if (status === ContentStatus.SCHEDULED) {
    if (!publishedAt) throw badRequest("Choose a publish date for scheduled posts", { publishedAt: "Required for scheduling" });
    if (publishedAt.getTime() < Date.now() - 60_000) throw badRequest("Scheduled date must be in the future", { publishedAt: "Must be in the future" });
    return publishedAt;
  }
  if (status === ContentStatus.PUBLISHED) {
    const now = new Date();
    if (publishedAt) return publishedAt > now ? now : publishedAt;
    return previous && previous <= now ? previous : now;
  }
  return publishedAt ?? previous ?? null;
}

async function tagConnect(tx: Prisma.TransactionClient, postId: string, names: string[]) {
  await tx.postTag.deleteMany({ where: { postId } });
  for (const name of [...new Set(names.map((n) => n.trim()).filter(Boolean))]) {
    const slug = slugify(name);
    if (!slug) continue;
    const tag = await tx.tag.upsert({ where: { slug }, create: { slug, name }, update: {} });
    await tx.postTag.create({ data: { postId, tagId: tag.id } });
  }
}

postsRouter.get("/", requirePermission("content:read"), async (req, res) => {
  const q = parse(
    pagination.extend({
      q: z.string().max(100).optional(),
      status: statusSchema.optional(),
      categoryId: z.string().max(40).optional(),
      deleted: z.enum(["true", "false"]).optional(),
    }),
    req.query,
  );
  const where: Prisma.PostWhereInput = {
    deletedAt: q.deleted === "true" ? { not: null } : null,
    ...(q.status ? { status: q.status } : {}),
    ...(q.categoryId ? { categoryId: q.categoryId } : {}),
    ...(q.q ? { OR: [{ title: { contains: q.q, mode: "insensitive" } }, { slug: { contains: q.q, mode: "insensitive" } }] } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      select: { id: true, slug: true, title: true, status: true, publishedAt: true, updatedAt: true, deletedAt: true, isFeatured: true, category: { select: { name: true } }, author: { select: { name: true } } },
    }),
    prisma.post.count({ where }),
  ]);
  ok(res, items, pageMeta(q, total));
});

/** GET /posts/slug-check?slug=&id= → { available, suggestion } */
postsRouter.get("/slug-check", requirePermission("content:read"), async (req, res) => {
  const { slug, id, title } = parse(z.object({ slug: z.string().max(120).optional(), id: z.string().max(40).optional(), title: z.string().max(200).optional() }), req.query);
  const candidate = slug ? slugify(slug) : slugify(title ?? "");
  const existing = candidate ? await prisma.post.findUnique({ where: { slug: candidate }, select: { id: true } }) : null;
  const available = Boolean(candidate) && (!existing || existing.id === id);
  ok(res, { slug: candidate, available, suggestion: available ? candidate : await uniqueSlug("post", candidate || "post", id) });
});

postsRouter.get("/:id", requirePermission("content:read"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const item = await prisma.post.findUnique({ where: { id }, include });
  if (!item) throw notFound("Post");
  ok(res, item);
});

async function save(req: Parameters<typeof can>[0], id?: string) {
  const d = body(req, postSchema);
  const before = id ? await prisma.post.findUnique({ where: { id } }) : null;
  if (id && !before) throw notFound("Post");
  if (d.status !== (before?.status ?? ContentStatus.DRAFT) && !can(req, "content:publish")) throw forbidden("You need publish permission to change the status");
  const slug = d.slug ?? before?.slug ?? (await uniqueSlug("post", d.title));
  await assertSlugFree("post", slug, id);
  const publishedAt = resolvePublishDate(d.status, d.publishedAt, before?.publishedAt);
  const { seo, tags, relatedServiceIds, faqs, ...rest } = d;
  const data = { ...rest, slug, publishedAt, body: normalizeBlocks(d.body) as Prisma.InputJsonValue };

  return prisma.$transaction(async (tx) => {
    let post;
    if (id && before) {
      await tx.seoMeta.update({ where: { id: before.seoId }, data: seoWrite(seo) });
      post = await tx.post.update({ where: { id }, data });
    } else {
      const seoRow = await tx.seoMeta.create({ data: seoWrite(seo) });
      post = await tx.post.create({ data: { ...data, seoId: seoRow.id } });
    }
    await tagConnect(tx, post.id, tags);
    await tx.postService.deleteMany({ where: { postId: post.id } });
    if (relatedServiceIds.length) await tx.postService.createMany({ data: relatedServiceIds.map((serviceId, i) => ({ postId: post.id, serviceId, sortOrder: i })) });
    await replaceFaqs(tx, { postId: post.id }, faqs);
    return tx.post.findUniqueOrThrow({ where: { id: post.id }, include });
  });
}

postsRouter.post("/", requirePermission("content:write"), async (req, res) => {
  const item = await save(req);
  await audit(req, "create", "Post", item.id, { summary: item.title });
  revalidateSite();
  created(res, item);
});

postsRouter.put("/:id", requirePermission("content:write"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const item = await save(req, id);
  await audit(req, "update", "Post", id, { summary: item.title });
  revalidateSite();
  ok(res, item);
});

/** PATCH /posts/:id/status { status, publishedAt? } — publish / unpublish / schedule */
postsRouter.patch("/:id/status", requirePermission("content:publish"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const { status, publishedAt } = body(req, z.object({ status: statusSchema, publishedAt: z.coerce.date().nullish() }));
  const before = await prisma.post.findUnique({ where: { id } });
  if (!before || before.deletedAt) throw notFound("Post");
  const item = await prisma.post.update({ where: { id }, data: { status, publishedAt: resolvePublishDate(status, publishedAt, before.publishedAt) } });
  const action = status === "PUBLISHED" ? "publish" : status === "SCHEDULED" ? "schedule" : "unpublish";
  await audit(req, action, "Post", id, { summary: `${item.title} → ${status}` });
  revalidateSite();
  ok(res, item);
});

postsRouter.delete("/:id", requirePermission("content:delete"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const item = await prisma.post.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit(req, "delete", "Post", id, { summary: item.title });
  revalidateSite();
  ok(res, { deleted: true });
});

postsRouter.post("/:id/restore", requirePermission("content:delete"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const item = await prisma.post.update({ where: { id }, data: { deletedAt: null, status: ContentStatus.DRAFT } });
  await audit(req, "restore", "Post", id, { summary: item.title });
  ok(res, item);
});

/** Permanently removes a post that is already in the trash. */
postsRouter.delete("/:id/permanent", requirePermission("content:delete"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const item = await prisma.post.findUnique({ where: { id } });
  if (!item) throw notFound("Post");
  if (!item.deletedAt) throw badRequest("Move the post to trash before deleting it permanently");
  await prisma.$transaction([prisma.post.delete({ where: { id } }), prisma.seoMeta.delete({ where: { id: item.seoId } })]);
  await audit(req, "delete_permanent", "Post", id, { summary: item.title });
  ok(res, { deleted: true });
});
