import { Router } from "express";
import { z } from "zod";
import { prisma, ContentStatus, type Prisma } from "../db.js";
import { requirePermission, can } from "../auth/session.js";
import { body, cleanText, idParam, parse, slugSchema } from "../lib/validate.js";
import { badRequest, created, forbidden, notFound, ok } from "../lib/http.js";
import { audit } from "../lib/audit.js";
import { assertSlugFree, blocksSchema, faqInputSchema, normalizeBlocks, replaceFaqs, revalidateSite, seoSchema, seoWrite, statusSchema, uniqueSlug } from "../lib/content.js";

/** Reserved paths already owned by the website's routes. */
const RESERVED = new Set(["services", "service-areas", "blog", "emergency-plumbing", "request-service", "contact", "about", "api", "admin", "media", "sitemap.xml", "robots.txt", "opengraph-image", "icon.svg"]);

export const pagesRouter = Router();

const pageSchema = z.object({
  title: cleanText(160).pipe(z.string().min(2)),
  slug: slugSchema.optional(),
  intro: cleanText(2000).default(""),
  body: blocksSchema.default([]),
  status: statusSchema.default(ContentStatus.DRAFT),
  faqs: z.array(faqInputSchema).max(30).default([]),
  seo: seoSchema,
});

const include = { seo: { include: { ogImage: true } }, faqs: { orderBy: { sortOrder: "asc" as const } } };

pagesRouter.get("/", requirePermission("content:read"), async (req, res) => {
  ok(res, await prisma.page.findMany({ where: { deletedAt: req.query.deleted === "true" ? { not: null } : null }, orderBy: { title: "asc" }, include: { seo: true } }));
});

pagesRouter.get("/:id", requirePermission("content:read"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const item = await prisma.page.findUnique({ where: { id }, include });
  if (!item) throw notFound("Page");
  ok(res, item);
});

async function save(req: Parameters<typeof can>[0], id?: string) {
  const d = body(req, pageSchema);
  const before = id ? await prisma.page.findUnique({ where: { id } }) : null;
  if (id && !before) throw notFound("Page");
  if (d.status !== (before?.status ?? ContentStatus.DRAFT) && !can(req, "content:publish")) throw forbidden("You need publish permission to change the status");
  // System pages keep their slug (the website links to them).
  const slug = before?.isSystem ? before.slug : (d.slug ?? before?.slug ?? (await uniqueSlug("page", d.title)));
  if (RESERVED.has(slug)) throw badRequest(`"${slug}" is reserved by the website`, { slug: "Reserved" });
  await assertSlugFree("page", slug, id);
  const { seo, faqs, ...rest } = d;
  const data = { ...rest, slug, body: normalizeBlocks(d.body) as Prisma.InputJsonValue };
  return prisma.$transaction(async (tx) => {
    let page;
    if (id && before) {
      await tx.seoMeta.update({ where: { id: before.seoId }, data: seoWrite(seo) });
      page = await tx.page.update({ where: { id }, data });
    } else {
      const seoRow = await tx.seoMeta.create({ data: seoWrite(seo) });
      page = await tx.page.create({ data: { ...data, seoId: seoRow.id } });
    }
    await replaceFaqs(tx, { pageId: page.id }, faqs);
    return tx.page.findUniqueOrThrow({ where: { id: page.id }, include });
  });
}

pagesRouter.post("/", requirePermission("content:write"), async (req, res) => {
  const item = await save(req);
  await audit(req, "create", "Page", item.id, { summary: item.title });
  revalidateSite();
  created(res, item);
});

pagesRouter.put("/:id", requirePermission("content:write"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const item = await save(req, id);
  await audit(req, "update", "Page", id, { summary: item.title });
  revalidateSite();
  ok(res, item);
});

pagesRouter.delete("/:id", requirePermission("content:delete"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) throw notFound("Page");
  if (page.isSystem) throw badRequest("System pages can be unpublished but not deleted");
  await prisma.page.update({ where: { id }, data: { deletedAt: new Date(), status: ContentStatus.ARCHIVED } });
  await audit(req, "delete", "Page", id, { summary: page.title });
  revalidateSite();
  ok(res, { deleted: true });
});

pagesRouter.post("/:id/restore", requirePermission("content:delete"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const item = await prisma.page.update({ where: { id }, data: { deletedAt: null, status: ContentStatus.DRAFT } });
  await audit(req, "restore", "Page", id, { summary: item.title });
  ok(res, item);
});
