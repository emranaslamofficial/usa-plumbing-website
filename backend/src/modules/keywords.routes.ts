import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { z } from "zod";
import { prisma, KeywordIntent, KeywordPriority, KeywordRole, KeywordStatus, type Prisma } from "../db";
import { requirePermission } from "../auth/session";
import { body, cleanText, idParam, pagination, parse } from "../lib/validate";
import { AppError, badRequest, conflict, created, notFound, ok, pageMeta } from "../lib/http";
import { audit } from "../lib/audit";
import { importKeywords, intentSignature, normalizeKeyword, parseKeywordFile } from "./keywords.service";
import { revalidateSite } from "../lib/content";

export const keywordsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (![".csv", ".xlsx"].includes(ext)) return cb(new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "Upload a .csv or .xlsx file"));
    cb(null, true);
  },
});

const targetInclude = {
  service: { select: { id: true, name: true, slug: true } },
  serviceArea: { select: { id: true, slug: true } },
  post: { select: { id: true, title: true, slug: true } },
  page: { select: { id: true, title: true, slug: true } },
};

const VIEWS: Record<string, Prisma.KeywordWhereInput> = {
  all: {},
  unused: { status: KeywordStatus.UNASSIGNED },
  assigned: { status: KeywordStatus.ASSIGNED },
  ignored: { status: KeywordStatus.IGNORED },
  home: { isHome: true },
  service: { OR: [{ serviceId: { not: null } }, { status: KeywordStatus.UNASSIGNED, targetHint: { contains: "service", mode: "insensitive" } }] },
  location: { OR: [{ serviceAreaId: { not: null } }, { category: { equals: "City", mode: "insensitive" } }, { targetHint: { contains: "location", mode: "insensitive" } }] },
  blog: { OR: [{ postId: { not: null } }, { intent: KeywordIntent.INFORMATIONAL }, { category: { equals: "Blog", mode: "insensitive" } }] },
};

keywordsRouter.get("/", requirePermission("content:read"), async (req, res) => {
  const q = parse(
    pagination.extend({
      view: z.enum(Object.keys(VIEWS) as [string, ...string[]]).default("all"),
      q: z.string().max(100).optional(),
      priority: z.nativeEnum(KeywordPriority).optional(),
      category: z.string().max(60).optional(),
      sort: z.enum(["monthlyVolume", "keyword", "difficulty", "cpc", "priority"]).default("monthlyVolume"),
      dir: z.enum(["asc", "desc"]).default("desc"),
      pageSize: z.coerce.number().int().min(1).max(500).default(50),
    }),
    req.query,
  );
  const where: Prisma.KeywordWhereInput = {
    AND: [VIEWS[q.view], q.q ? { normalized: { contains: q.q.toLowerCase() } } : {}, q.priority ? { priority: q.priority } : {}, q.category ? { category: q.category } : {}],
  };
  const [items, total, counts, categories] = await Promise.all([
    prisma.keyword.findMany({ where, include: targetInclude, orderBy: [{ [q.sort]: { sort: q.dir, nulls: "last" } }, { keyword: "asc" }], skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    prisma.keyword.count({ where }),
    Promise.all(Object.entries(VIEWS).map(async ([k, w]) => [k, await prisma.keyword.count({ where: w })] as const)),
    prisma.keyword.groupBy({ by: ["category"], _count: true, orderBy: { category: "asc" } }),
  ]);
  ok(res, items, { ...pageMeta(q, total), viewCounts: Object.fromEntries(counts), categories: categories.map((c) => c.category).filter(Boolean) });
});

/** POST /keywords/import (multipart "file") — CSV or XLSX, multi-sheet/multi-section aware */
keywordsRouter.post("/import", requirePermission("keywords:write"), upload.single("file"), async (req, res) => {
  if (!req.file) throw badRequest("No file uploaded");
  let records;
  try {
    records = await parseKeywordFile(req.file.buffer, req.file.originalname);
  } catch {
    throw new AppError(422, "INVALID_FILE", "The file could not be parsed. Make sure it is a valid CSV or XLSX.");
  }
  if (!records.length) throw new AppError(422, "NO_KEYWORDS", "No keyword rows found. The sheet needs a header row with a 'Keyword' column.");
  const result = await importKeywords(records, path.basename(req.file.originalname).slice(0, 200), req.user!.id);
  await audit(req, "import", "Keyword", result.id, { summary: `${result.createdCount} new, ${result.updatedCount} updated, ${result.skippedCount} skipped` });
  created(res, result);
});

keywordsRouter.get("/imports", requirePermission("content:read"), async (_req, res) => {
  ok(res, await prisma.keywordImport.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { createdBy: { select: { name: true } } } }));
});

/** Pages a keyword can be assigned to. */
keywordsRouter.get("/targets", requirePermission("content:read"), async (_req, res) => {
  const [services, areas, posts, pages] = await Promise.all([
    prisma.service.findMany({ where: { deletedAt: null }, select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } }),
    prisma.serviceArea.findMany({ where: { deletedAt: null }, select: { id: true, slug: true, city: { select: { name: true, state: { select: { code: true } } } } }, orderBy: { slug: "asc" } }),
    prisma.post.findMany({ where: { deletedAt: null }, select: { id: true, title: true, slug: true }, orderBy: { title: "asc" } }),
    prisma.page.findMany({ where: { deletedAt: null }, select: { id: true, title: true, slug: true }, orderBy: { title: "asc" } }),
  ]);
  ok(res, {
    home: [{ id: "home", label: "Homepage", path: "/" }],
    service: services.map((s) => ({ id: s.id, label: s.name, path: `/services/${s.slug}` })),
    serviceArea: areas.map((a) => ({ id: a.id, label: `${a.city.name}, ${a.city.state.code}`, path: `/service-areas/${a.slug}` })),
    post: posts.map((p) => ({ id: p.id, label: p.title, path: `/blog/${p.slug}` })),
    page: pages.map((p) => ({ id: p.id, label: p.title, path: `/${p.slug}` })),
  });
});

const TARGET_FIELD = { service: "serviceId", serviceArea: "serviceAreaId", post: "postId", page: "pageId" } as const;
type TargetType = keyof typeof TARGET_FIELD | "home";

function targetWhere(type: TargetType, id: string): Prisma.KeywordWhereInput {
  return type === "home" ? { isHome: true } : { [TARGET_FIELD[type]]: id };
}

function targetOf(k: { isHome: boolean; serviceId: string | null; serviceAreaId: string | null; postId: string | null; pageId: string | null }) {
  if (k.isHome) return "home";
  return k.serviceId ?? k.serviceAreaId ?? k.postId ?? k.pageId ?? null;
}

/**
 * Cannibalization guard for PRIMARY keywords:
 *  - a page may have only one primary keyword
 *  - another page may not already target the same search intent (same intent signature)
 */
async function checkCannibalization(keywordId: string, keyword: string, type: TargetType, id: string) {
  const samePage = await prisma.keyword.findFirst({ where: { ...targetWhere(type, id), role: KeywordRole.PRIMARY, NOT: { id: keywordId } } });
  if (samePage) return { reason: "PAGE_HAS_PRIMARY", message: `This page already has the primary keyword "${samePage.keyword}". Make this one secondary or replace it.`, conflictKeyword: samePage };

  const sig = intentSignature(keyword);
  const primaries = await prisma.keyword.findMany({ where: { role: KeywordRole.PRIMARY, NOT: { id: keywordId } }, include: targetInclude });
  const clash = primaries.find((p) => intentSignature(p.keyword) === sig && targetOf(p) !== (type === "home" ? "home" : id));
  if (clash) {
    const where = clash.service?.name ?? clash.post?.title ?? clash.page?.title ?? clash.serviceArea?.slug ?? "Homepage";
    return { reason: "SAME_INTENT_ELSEWHERE", message: `"${clash.keyword}" on ${where} targets the same search intent. Two pages competing for one intent split rankings.`, conflictKeyword: clash };
  }
  return null;
}

const updateSchema = z.object({
  target: z.object({ type: z.enum(["home", "service", "serviceArea", "post", "page"]), id: z.string().max(40) }).nullable().optional(),
  role: z.nativeEnum(KeywordRole).nullable().optional(),
  status: z.nativeEnum(KeywordStatus).optional(),
  priority: z.nativeEnum(KeywordPriority).optional(),
  intent: z.nativeEnum(KeywordIntent).nullable().optional(),
  category: cleanText(60).nullable().optional(),
  notes: cleanText(1000).nullable().optional(),
  /** Acknowledge a cannibalization warning and save anyway (e.g. demote the other keyword later). */
  force: z.boolean().default(false),
});

keywordsRouter.patch("/:id", requirePermission("keywords:write"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const d = body(req, updateSchema);
  const kw = await prisma.keyword.findUnique({ where: { id } });
  if (!kw) throw notFound("Keyword");

  const data: Prisma.KeywordUncheckedUpdateInput = {
    ...(d.priority ? { priority: d.priority } : {}),
    ...(d.intent !== undefined ? { intent: d.intent } : {}),
    ...(d.category !== undefined ? { category: d.category } : {}),
    ...(d.notes !== undefined ? { notes: d.notes } : {}),
  };

  if (d.target !== undefined) {
    Object.assign(data, { isHome: false, serviceId: null, serviceAreaId: null, postId: null, pageId: null });
    if (d.target) {
      if (d.target.type === "home") data.isHome = true;
      else data[TARGET_FIELD[d.target.type]] = d.target.id;
      data.status = KeywordStatus.ASSIGNED;
      data.role = d.role ?? kw.role ?? KeywordRole.SECONDARY;
    } else {
      data.status = KeywordStatus.UNASSIGNED;
      data.role = null;
    }
  } else if (d.role !== undefined) data.role = d.role;
  if (d.status) data.status = d.status;

  const finalRole = (data.role ?? kw.role) as KeywordRole | null;
  const finalTarget: { type: TargetType; id: string } | null =
    d.target !== undefined ? d.target : kw.isHome ? { type: "home", id: "home" } : kw.serviceId ? { type: "service", id: kw.serviceId } : kw.serviceAreaId ? { type: "serviceArea", id: kw.serviceAreaId } : kw.postId ? { type: "post", id: kw.postId } : kw.pageId ? { type: "page", id: kw.pageId } : null;

  if (finalRole === KeywordRole.PRIMARY && finalTarget && !d.force) {
    const clash = await checkCannibalization(kw.id, kw.keyword, finalTarget.type, finalTarget.id);
    if (clash) throw conflict(clash.message, { reason: clash.reason, conflictKeywordId: clash.conflictKeyword.id, conflictKeyword: clash.conflictKeyword.keyword });
  }

  const item = await prisma.keyword.update({ where: { id }, data, include: targetInclude });
  await audit(req, "update", "Keyword", id, { summary: `${kw.keyword}${d.target !== undefined ? ` → ${d.target ? `${d.target.type}:${d.target.id}` : "unassigned"}` : ""}${d.force ? " (forced)" : ""}` });
  revalidateSite();
  ok(res, item);
});

keywordsRouter.post("/", requirePermission("keywords:write"), async (req, res) => {
  const d = body(req, z.object({ keyword: cleanText(150).pipe(z.string().min(2)), monthlyVolume: z.number().int().nonnegative().nullish(), intent: z.nativeEnum(KeywordIntent).nullish(), category: cleanText(60).nullish(), priority: z.nativeEnum(KeywordPriority).default("MEDIUM"), notes: cleanText(1000).nullish() }));
  const normalized = normalizeKeyword(d.keyword);
  if (await prisma.keyword.findUnique({ where: { normalized } })) throw conflict("That keyword already exists");
  const item = await prisma.keyword.create({ data: { ...d, normalized, source: "manual" } });
  await audit(req, "create", "Keyword", item.id, { summary: item.keyword });
  created(res, item);
});

keywordsRouter.delete("/:id", requirePermission("keywords:write"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const kw = await prisma.keyword.delete({ where: { id } });
  await audit(req, "delete", "Keyword", id, { summary: kw.keyword });
  ok(res, { deleted: true });
});

/** Cannibalization & coverage report. */
keywordsRouter.get("/report/conflicts", requirePermission("content:read"), async (_req, res) => {
  const assigned = await prisma.keyword.findMany({ where: { status: KeywordStatus.ASSIGNED }, include: targetInclude });
  const bySig = new Map<string, typeof assigned>();
  for (const k of assigned.filter((k) => k.role === KeywordRole.PRIMARY)) {
    const s = intentSignature(k.keyword);
    bySig.set(s, [...(bySig.get(s) ?? []), k]);
  }
  const competing = [...bySig.values()].filter((group) => new Set(group.map(targetOf)).size > 1);

  const [services, areas, posts] = await Promise.all([
    prisma.service.findMany({ where: { deletedAt: null, status: "PUBLISHED" }, select: { id: true, name: true, keywords: { where: { role: "PRIMARY" }, select: { id: true } } } }),
    prisma.serviceArea.findMany({ where: { deletedAt: null, status: "PUBLISHED" }, select: { id: true, slug: true, keywords: { where: { role: "PRIMARY" }, select: { id: true } } } }),
    prisma.post.findMany({ where: { deletedAt: null, status: { in: ["PUBLISHED", "SCHEDULED"] } }, select: { id: true, title: true, keywords: { where: { role: "PRIMARY" }, select: { id: true } } } }),
  ]);
  const missingPrimary = [
    ...services.filter((s) => !s.keywords.length).map((s) => ({ type: "service", id: s.id, label: s.name })),
    ...areas.filter((s) => !s.keywords.length).map((s) => ({ type: "serviceArea", id: s.id, label: s.slug })),
    ...posts.filter((s) => !s.keywords.length).map((s) => ({ type: "post", id: s.id, label: s.title })),
  ];
  ok(res, { competing, missingPrimary });
});
