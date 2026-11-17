import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requirePermission } from "../auth/session";
import { crudRouter } from "../lib/crud";
import { cleanText, pagination, parse, slugSchema } from "../lib/validate";
import { badRequest, ok, pageMeta } from "../lib/http";

const slugOpt = slugSchema.optional();

export const serviceCategoriesRouter = crudRouter({
  model: "serviceCategory",
  entity: "ServiceCategory",
  read: "content:read",
  write: "content:write",
  slugFrom: "name",
  orderBy: [{ sortOrder: "asc" }],
  include: { _count: { select: { services: true } } },
  schema: z.object({ name: cleanText(80).pipe(z.string().min(2)), slug: slugOpt, description: cleanText(300).nullish(), sortOrder: z.number().int().default(0) }),
});

export const blogCategoriesRouter = crudRouter({
  model: "blogCategory",
  entity: "BlogCategory",
  read: "content:read",
  write: "content:write",
  slugFrom: "name",
  orderBy: [{ sortOrder: "asc" }],
  include: { _count: { select: { posts: true } } },
  schema: z.object({ name: cleanText(80).pipe(z.string().min(2)), slug: slugOpt, description: cleanText(300).default(""), sortOrder: z.number().int().default(0) }),
});

export const tagsRouter = crudRouter({
  model: "tag",
  entity: "Tag",
  read: "content:read",
  write: "content:write",
  slugFrom: "name",
  searchFields: ["name"],
  orderBy: [{ name: "asc" }],
  include: { _count: { select: { posts: true } } },
  schema: z.object({ name: cleanText(50).pipe(z.string().min(1)), slug: slugOpt }),
});

export const authorsRouter = crudRouter({
  model: "author",
  entity: "Author",
  read: "content:read",
  write: "content:write",
  slugFrom: "name",
  orderBy: [{ name: "asc" }],
  include: { avatar: true, _count: { select: { posts: true } } },
  schema: z.object({
    name: cleanText(100).pipe(z.string().min(2)),
    slug: slugOpt,
    role: cleanText(100).default(""),
    bio: cleanText(1000).default(""),
    avatarId: z.string().max(40).nullish(),
    userId: z.string().max(40).nullish(),
  }),
});

export const faqsRouter = crudRouter({
  model: "faq",
  entity: "Faq",
  read: "content:read",
  write: "content:write",
  searchFields: ["question", "answer"],
  filters: ["group", "serviceId", "serviceAreaId", "postId", "pageId"],
  orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
  include: { service: { select: { name: true } }, serviceArea: { select: { slug: true } }, post: { select: { title: true } }, page: { select: { title: true } } },
  schema: z.object({
    question: cleanText(300).pipe(z.string().min(3)),
    answer: cleanText(3000).pipe(z.string().min(1)),
    group: z.string().regex(/^[a-z0-9-]+$/).max(40).nullish(),
    serviceId: z.string().max(40).nullish(),
    serviceAreaId: z.string().max(40).nullish(),
    postId: z.string().max(40).nullish(),
    pageId: z.string().max(40).nullish(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  }),
  beforeSave: (d) => {
    const owners = ["group", "serviceId", "serviceAreaId", "postId", "pageId"].filter((k) => d[k]);
    if (owners.length > 1) throw badRequest("A FAQ belongs to exactly one page or group");
  },
});

export const testimonialsRouter = crudRouter({
  model: "testimonial",
  entity: "Testimonial",
  read: "content:read",
  write: "content:write",
  searchFields: ["authorName", "body"],
  orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  include: { service: { select: { name: true } } },
  schema: z.object({
    authorName: cleanText(100).pipe(z.string().min(2)),
    location: cleanText(100).nullish(),
    rating: z.number().int().min(1).max(5).nullish(),
    body: cleanText(2000).pipe(z.string().min(10)),
    source: cleanText(50).nullish(),
    sourceUrl: z.string().url().startsWith("https://").nullish(),
    serviceId: z.string().max(40).nullish(),
    isVerified: z.boolean().default(false),
    isPublished: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
    receivedAt: z.coerce.date().nullish(),
  }),
  // Only genuine reviews: publishing requires staff verification
  beforeSave: (d) => {
    if (d.isPublished === true && d.isVerified !== true) throw badRequest("Mark the review as verified (a real customer review) before publishing it", { isVerified: "Required to publish" });
  },
});

const path = z.string().trim().max(500).regex(/^\/[^\s?#]*$/, "Must be a root-relative path like /old-page");
export const redirectsRouter = crudRouter({
  model: "redirect",
  entity: "Redirect",
  read: "seo:write",
  write: "seo:write",
  searchFields: ["source", "destination"],
  orderBy: [{ createdAt: "desc" }],
  schema: z.object({
    source: path,
    destination: z.string().trim().max(500).refine((v) => (v.startsWith("/") && !v.startsWith("//")) || /^https:\/\//.test(v), "Use a /path or https:// URL"),
    statusCode: z.union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)]).default(301),
    isActive: z.boolean().default(true),
    note: cleanText(200).nullish(),
  }),
  beforeSave: async (d, _req, id) => {
    if (d.source && d.source === d.destination) throw badRequest("Source and destination are the same");
    // Block simple loops A→B while B→A exists
    if (d.source && d.destination) {
      const loop = await prisma.redirect.findFirst({ where: { source: d.destination as string, destination: d.source as string, ...(id ? { NOT: { id } } : {}) } });
      if (loop) throw badRequest("This would create a redirect loop");
    }
  },
});

export const statesRouter = crudRouter({
  model: "state",
  entity: "State",
  read: "content:read",
  write: "content:write",
  slugFrom: "name",
  orderBy: [{ name: "asc" }],
  schema: z.object({ code: z.string().trim().toUpperCase().length(2), name: cleanText(60).pipe(z.string().min(2)), slug: slugOpt }),
});

// ── Audit logs ──

export const auditRouter = Router();
auditRouter.get("/", requirePermission("audit:read"), async (req, res) => {
  const q = parse(pagination.extend({ entity: z.string().max(40).optional(), userId: z.string().max(40).optional(), action: z.string().max(40).optional(), pageSize: z.coerce.number().int().min(1).max(200).default(50) }), req.query);
  const where = { ...(q.entity ? { entity: q.entity } : {}), ...(q.userId ? { userId: q.userId } : {}), ...(q.action ? { action: q.action } : {}) };
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize, include: { user: { select: { name: true, email: true } } } }),
    prisma.auditLog.count({ where }),
  ]);
  ok(res, items, pageMeta(q, total));
});

// ── Dashboard & analytics ──

export const dashboardRouter = Router();

dashboardRouter.get("/", requirePermission("dashboard:view"), async (_req, res) => {
  const since30 = new Date(Date.now() - 30 * 86400_000);
  const live = { deletedAt: null };
  const [totalLeads, newLeads, leads30, contactRequests, unreadMessages, posts, published, drafts, scheduled, services, areas, recentLeads, recentActivity, clicks30] = await Promise.all([
    prisma.lead.count({ where: live }),
    prisma.lead.count({ where: { ...live, status: "NEW" } }),
    prisma.lead.count({ where: { ...live, createdAt: { gte: since30 } } }),
    prisma.contactMessage.count({ where: { lead: live } }),
    prisma.contactMessage.count({ where: { isRead: false, lead: live } }),
    prisma.post.count({ where: live }),
    prisma.post.count({ where: { ...live, status: "PUBLISHED" } }),
    prisma.post.count({ where: { ...live, status: "DRAFT" } }),
    prisma.post.count({ where: { ...live, status: "SCHEDULED" } }),
    prisma.service.count({ where: live }),
    prisma.serviceArea.count({ where: live }),
    prisma.lead.findMany({ where: live, orderBy: { createdAt: "desc" }, take: 8, select: { id: true, referenceId: true, name: true, zip: true, status: true, createdAt: true, source: true, service: { select: { name: true } }, serviceLabel: true } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10, select: { id: true, action: true, entity: true, summary: true, createdAt: true, user: { select: { name: true } } } }),
    prisma.ctaClickEvent.count({ where: { type: "CALL", createdAt: { gte: since30 } } }),
  ]);
  ok(res, {
    stats: { totalLeads, newLeads, leads30, contactRequests, unreadMessages, posts, published, drafts, scheduled, services, areas, callClicks30: clicks30 },
    recentLeads,
    recentActivity,
  });
});

export const analyticsRouter = Router();

/** CTA clicks + lead attribution. Click counts are intent signals, NOT completed calls. */
analyticsRouter.get("/", requirePermission("dashboard:view"), async (req, res) => {
  const { days } = parse(z.object({ days: z.coerce.number().int().min(1).max(365).default(30) }), req.query);
  const since = new Date(Date.now() - days * 86400_000);
  const where = { createdAt: { gte: since } };
  const [byType, byPage, byDevice, byPlacement, bySource, leadsBySource, leadsByUtm, daily, confirmedCalls] = await Promise.all([
    prisma.ctaClickEvent.groupBy({ by: ["type"], where, _count: true }),
    prisma.ctaClickEvent.groupBy({ by: ["pagePath"], where: { ...where, type: "CALL" }, _count: true, orderBy: { _count: { pagePath: "desc" } }, take: 15 }),
    prisma.ctaClickEvent.groupBy({ by: ["deviceType"], where: { ...where, type: "CALL" }, _count: true }),
    prisma.ctaClickEvent.groupBy({ by: ["placement"], where: { ...where, type: "CALL" }, _count: true, orderBy: { _count: { placement: "desc" } }, take: 15 }),
    prisma.ctaClickEvent.groupBy({ by: ["utmSource"], where: { ...where, type: "CALL" }, _count: true, orderBy: { _count: { utmSource: "desc" } }, take: 10 }),
    prisma.lead.groupBy({ by: ["source"], where: { ...where, deletedAt: null }, _count: true }),
    prisma.lead.groupBy({ by: ["utmSource", "utmMedium", "utmCampaign"], where: { ...where, deletedAt: null }, _count: true, orderBy: { _count: { utmSource: "desc" } }, take: 15 }),
    prisma.$queryRaw<{ day: Date; calls: bigint; leads: bigint }[]>`
      SELECT d::date AS day,
        (SELECT COUNT(*) FROM "CtaClickEvent" c WHERE c.type = 'CALL' AND c."createdAt"::date = d::date) AS calls,
        (SELECT COUNT(*) FROM "Lead" l WHERE l."deletedAt" IS NULL AND l."createdAt"::date = d::date) AS leads
      FROM generate_series(${since}::date, now()::date, interval '1 day') d ORDER BY d`,
    prisma.callEvent.count({ where: { startedAt: { gte: since } } }),
  ]);
  ok(res, {
    days,
    clicksByType: Object.fromEntries(byType.map((r) => [r.type, r._count])),
    callClicksByPage: byPage.map((r) => ({ page: r.pagePath, count: r._count })),
    callClicksByDevice: byDevice.map((r) => ({ device: r.deviceType, count: r._count })),
    callClicksByPlacement: byPlacement.map((r) => ({ placement: r.placement ?? "(unknown)", count: r._count })),
    callClicksBySource: bySource.map((r) => ({ source: r.utmSource ?? "(direct / organic)", count: r._count })),
    leadsBySource: leadsBySource.map((r) => ({ source: r.source, count: r._count })),
    leadsByUtm: leadsByUtm.map((r) => ({ source: r.utmSource ?? "(none)", medium: r.utmMedium ?? "", campaign: r.utmCampaign ?? "", count: r._count })),
    daily: daily.map((d) => ({ day: d.day.toISOString().slice(0, 10), calls: Number(d.calls), leads: Number(d.leads) })),
    /** Only populated by a call-tracking provider webhook */
    confirmedCalls,
  });
});

// ── SEO overview: every indexable entity with its metadata health ──

export const seoRouter = Router();

seoRouter.get("/overview", requirePermission("content:read"), async (_req, res) => {
  const [services, areas, posts, pages] = await Promise.all([
    prisma.service.findMany({ where: { deletedAt: null }, select: { id: true, name: true, slug: true, pathOverride: true, status: true, seo: true } }),
    prisma.serviceArea.findMany({ where: { deletedAt: null }, select: { id: true, slug: true, status: true, seo: true } }),
    prisma.post.findMany({ where: { deletedAt: null }, select: { id: true, title: true, slug: true, status: true, seo: true } }),
    prisma.page.findMany({ where: { deletedAt: null }, select: { id: true, title: true, slug: true, status: true, seo: true } }),
  ]);
  type Row = { type: string; id: string; label: string; path: string; status: string; seo: { metaTitle: string | null; metaDescription: string | null; robots: string; canonicalUrl: string | null } };
  const rows: Row[] = [
    ...services.map((s) => ({ type: "service", id: s.id, label: s.name, path: s.pathOverride ?? `/services/${s.slug}`, status: s.status, seo: s.seo })),
    ...areas.map((a) => ({ type: "serviceArea", id: a.id, label: a.slug, path: `/service-areas/${a.slug}`, status: a.status, seo: a.seo })),
    ...posts.map((p) => ({ type: "post", id: p.id, label: p.title, path: `/blog/${p.slug}`, status: p.status, seo: p.seo })),
    ...pages.map((p) => ({ type: "page", id: p.id, label: p.title, path: `/${p.slug}`, status: p.status, seo: p.seo })),
  ];
  const titles = new Map<string, number>();
  rows.forEach((r) => r.seo.metaTitle && titles.set(r.seo.metaTitle.toLowerCase(), (titles.get(r.seo.metaTitle.toLowerCase()) ?? 0) + 1));
  ok(
    res,
    rows.map((r) => {
      const issues: string[] = [];
      const t = r.seo.metaTitle ?? "";
      const d = r.seo.metaDescription ?? "";
      if (!t) issues.push("Missing SEO title");
      else if (t.length > 60) issues.push(`Title is ${t.length} chars (aim ≤ 60)`);
      if (t && (titles.get(t.toLowerCase()) ?? 0) > 1) issues.push("Duplicate SEO title");
      if (!d) issues.push("Missing meta description");
      else if (d.length > 160 || d.length < 70) issues.push(`Description is ${d.length} chars (aim 70–160)`);
      if (r.seo.robots.startsWith("noindex") && r.status === "PUBLISHED") issues.push("Published but noindex");
      return { ...r, issues };
    }),
  );
});
