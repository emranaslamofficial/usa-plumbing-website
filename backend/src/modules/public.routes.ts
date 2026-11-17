import { Router, raw } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { z } from "zod";
import { prisma, type Prisma } from "../db.js";
import { clientIp, requirePublicKey } from "../auth/session.js";
import { cleanText, parse } from "../lib/validate.js";
import { AppError, badRequest, created, notFound, ok, unprocessable, unauthorized } from "../lib/http.js";
import { liveWhere, livePostWhere } from "../lib/content.js";
import { hmac, safeEqual } from "../lib/crypto.js";
import { env } from "../config/env.js";
import { createHmac } from "node:crypto";
import { leadInputSchema, createLeadFromForm, attributionSchema } from "./leads.service.js";
import { locationOut, postOut, postSummaryInclude, postSummaryOut, serviceOut, serviceSummaryOut, serviceSummarySelect, settingsOut } from "./public.serializers.js";

/**
 * Public API consumed server-to-server by the Next.js website.
 * Every route requires the PUBLIC_API_KEY bearer token; visitors never call it directly.
 */
export const publicRouter = Router();
publicRouter.use(requirePublicKey);

const limiter = (limit: number, windowMin: number) =>
  rateLimit({
    windowMs: windowMin * 60_000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(clientIp(req)),
    message: { success: false, error: { code: "RATE_LIMITED", message: "Too many submissions. Please call us instead." } },
  });

// ── Settings & navigation ──

publicRouter.get("/settings", async (_req, res) => ok(res, await settingsOut()));

// ── Services ──

publicRouter.get("/services", async (_req, res) => {
  const items = await prisma.service.findMany({ where: { ...liveWhere() }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: serviceSummarySelect });
  ok(res, items.map(serviceSummaryOut));
});

publicRouter.get("/services/:slug", async (req, res) => {
  const s = await serviceOut(String(req.params.slug));
  if (!s) throw notFound("Service");
  ok(res, s);
});

// ── Locations ──

publicRouter.get("/locations", async (_req, res) => {
  const items = await prisma.serviceArea.findMany({ where: liveWhere(), orderBy: [{ sortOrder: "asc" }, { slug: "asc" }], include: { city: { include: { state: true } } } });
  ok(res, items.map((a) => ({ id: a.id, slug: a.slug, city: a.city.name, stateCode: a.city.state.code, stateName: a.city.state.name, nearbyAreas: a.nearbyAreas })));
});

publicRouter.get("/locations/:slug", async (req, res) => {
  const l = await locationOut(String(req.params.slug));
  if (!l) throw notFound("Location");
  ok(res, l);
});

// ── Blog ──

publicRouter.get("/posts", async (req, res) => {
  const q = parse(
    z.object({
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(50).default(6),
      category: z.string().max(80).optional(),
      q: z.string().max(80).optional(),
      slugs: z.string().max(2000).optional(),
    }),
    req.query,
  );
  if (q.slugs) {
    const slugs = q.slugs.split(",").filter(Boolean).slice(0, 30);
    const rows = await prisma.post.findMany({ where: { slug: { in: slugs }, ...livePostWhere() }, include: postSummaryInclude });
    const bySlug = new Map(rows.map((r) => [r.slug, postSummaryOut(r)]));
    return ok(res, { items: slugs.map((s) => bySlug.get(s)).filter(Boolean) });
  }
  const where: Prisma.PostWhereInput = {
    AND: [
      livePostWhere(),
      q.category ? { category: { slug: q.category } } : {},
      q.q
        ? {
            OR: [
              { title: { contains: q.q, mode: "insensitive" } },
              { excerpt: { contains: q.q, mode: "insensitive" } },
              { intro: { contains: q.q, mode: "insensitive" } },
              { tags: { some: { tag: { name: { contains: q.q, mode: "insensitive" } } } } },
              { keywords: { some: { normalized: { contains: q.q.toLowerCase() } } } },
            ],
          }
        : {},
    ],
  };
  const total = await prisma.post.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / q.pageSize));
  const page = Math.min(q.page, totalPages);
  const rows = await prisma.post.findMany({ where, orderBy: { publishedAt: "desc" }, skip: (page - 1) * q.pageSize, take: q.pageSize, include: postSummaryInclude });
  ok(res, { items: rows.map(postSummaryOut), page, pageSize: q.pageSize, total, totalPages });
});

publicRouter.get("/posts/slugs", async (_req, res) => {
  const rows = await prisma.post.findMany({ where: livePostWhere(), select: { slug: true, updatedAt: true }, orderBy: { publishedAt: "desc" } });
  ok(res, rows.map((r) => ({ slug: r.slug, updatedAt: r.updatedAt.toISOString().slice(0, 10) })));
});

publicRouter.get("/posts/featured", async (_req, res) => {
  const rows = await prisma.post.findMany({ where: { ...livePostWhere(), isFeatured: true }, orderBy: { publishedAt: "desc" }, take: 5, include: postSummaryInclude });
  ok(res, rows.map(postSummaryOut));
});

publicRouter.get("/posts/popular", async (req, res) => {
  const { limit } = parse(z.object({ limit: z.coerce.number().int().min(1).max(20).default(4) }), req.query);
  const rows = await prisma.post.findMany({ where: { ...livePostWhere(), isPopular: true }, orderBy: { publishedAt: "desc" }, take: limit, include: postSummaryInclude });
  ok(res, rows.map(postSummaryOut));
});

publicRouter.get("/posts/:slug", async (req, res) => {
  const p = await postOut(String(req.params.slug));
  if (!p) throw notFound("Post");
  ok(res, p);
});

publicRouter.get("/posts/:slug/related", async (req, res) => {
  const { limit } = parse(z.object({ limit: z.coerce.number().int().min(1).max(12).default(3) }), req.query);
  const post = await prisma.post.findFirst({ where: { slug: String(req.params.slug), ...livePostWhere() }, include: { services: true } });
  if (!post) return ok(res, []);
  const serviceIds = post.services.map((s) => s.serviceId);
  const candidates = await prisma.post.findMany({ where: { ...livePostWhere(), NOT: { id: post.id } }, include: { ...postSummaryInclude, services: { select: { serviceId: true } } }, take: 200, orderBy: { publishedAt: "desc" } });
  const score = (c: (typeof candidates)[number]) => (c.categoryId === post.categoryId ? 2 : 0) + c.services.filter((s) => serviceIds.includes(s.serviceId)).length;
  ok(res, candidates.sort((a, b) => score(b) - score(a)).slice(0, limit).map(postSummaryOut));
});

publicRouter.get("/blog-categories", async (_req, res) => {
  ok(res, await prisma.blogCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true, description: true } }));
});

publicRouter.get("/authors/:id", async (req, res) => {
  const a = await prisma.author.findUnique({ where: { id: String(req.params.id) }, include: { avatar: true } });
  if (!a) throw notFound("Author");
  ok(res, { id: a.id, name: a.name, role: a.role, bio: a.bio, avatar: a.avatar?.url });
});

// ── Pages, FAQs, testimonials ──

publicRouter.get("/pages", async (_req, res) => {
  const rows = await prisma.page.findMany({ where: liveWhere(), select: { slug: true, updatedAt: true } });
  ok(res, rows.map((r) => ({ slug: r.slug, updatedAt: r.updatedAt.toISOString().slice(0, 10) })));
});

publicRouter.get("/pages/:slug", async (req, res) => {
  const p = await prisma.page.findFirst({
    where: { slug: String(req.params.slug), ...liveWhere() },
    include: { seo: { include: { ogImage: true } }, faqs: { where: { isActive: true }, orderBy: { sortOrder: "asc" } }, keywords: { select: { keyword: true, role: true } } },
  });
  if (!p) throw notFound("Page");
  const { seoOut } = await import("./public.serializers.js");
  // Fill {{tokens}} from Business Settings so legal pages never hardcode business details
  const s = await settingsOut();
  const tokens: Record<string, string> = {
    businessName: s.businessName,
    legalName: s.legalName,
    email: s.email,
    phone: s.phone.display,
    address: `${s.address.street}, ${s.address.city}, ${s.address.region} ${s.address.postalCode}`,
    trustFootnote: s.trustFootnote.replace(/^\*/, ""),
    serviceAreaLabel: s.serviceAreaLabel,
  };
  const fill = (v: unknown): unknown =>
    typeof v === "string" ? v.replace(/\{\{(\w+)\}\}/g, (m, k: string) => tokens[k] ?? m) : Array.isArray(v) ? v.map(fill) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)])) : v;
  ok(res, {
    slug: p.slug,
    title: p.title,
    intro: fill(p.intro),
    body: fill(p.body),
    faqs: p.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    updatedAt: p.updatedAt.toISOString().slice(0, 10),
    seo: seoOut(p.seo, p.keywords, { title: p.title, description: p.intro.slice(0, 155) }),
  });
});

publicRouter.get("/faqs", async (req, res) => {
  const { group } = parse(z.object({ group: z.string().regex(/^[a-z0-9-]+$/).max(40) }), req.query);
  const rows = await prisma.faq.findMany({ where: { group, isActive: true }, orderBy: { sortOrder: "asc" }, select: { question: true, answer: true } });
  ok(res, rows);
});

publicRouter.get("/testimonials", async (_req, res) => {
  const rows = await prisma.testimonial.findMany({ where: { isPublished: true, isVerified: true }, orderBy: { sortOrder: "asc" }, include: { service: { select: { name: true } } } });
  ok(res, rows.map((t) => ({ id: t.id, authorName: t.authorName, location: t.location, rating: t.rating, body: t.body, source: t.source, sourceUrl: t.sourceUrl, serviceName: t.service?.name })));
});

// ── SEO infrastructure ──

publicRouter.get("/redirects", async (_req, res) => {
  ok(res, await prisma.redirect.findMany({ where: { isActive: true }, select: { source: true, destination: true, statusCode: true } }));
});

/** Records a redirect hit (called by the website when it serves a redirect). */
publicRouter.post("/redirects/hit", async (req, res) => {
  const { source } = parse(z.object({ source: z.string().max(500) }), req.body);
  await prisma.redirect.updateMany({ where: { source }, data: { hits: { increment: 1 } } });
  ok(res, { recorded: true });
});

publicRouter.get("/robots", async (_req, res) => {
  const row = await prisma.systemSetting.findUnique({ where: { key: "robots" } });
  ok(res, (row?.value as object) ?? { allowIndexing: true, disallow: ["/api/"], extra: "" });
});

// ── Lead intake ──

publicRouter.post("/leads", limiter(5, 10), async (req, res) => {
  const input = parse(leadInputSchema, req.body);
  try {
    const result = await createLeadFromForm(input, { ip: clientIp(req), userAgent: req.get("x-client-user-agent") ?? req.get("user-agent") });
    created(res, { referenceId: result.referenceId, duplicate: Boolean(result.duplicate) });
  } catch (err) {
    if ((err as { field?: string }).field === "serviceSlug") throw unprocessable("Please choose a service from the list.", { serviceSlug: "Please choose a service from the list." });
    throw err;
  }
});

// ── Conversion tracking ──

const ctaSchema = z.object({
  type: z.enum(["CALL", "REQUEST_SERVICE", "SMS", "EMAIL"]),
  placement: cleanText(80).optional(),
  target: cleanText(200).optional(),
  pagePath: z.string().max(500).regex(/^\//),
  visitorId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/).optional(),
  attribution: attributionSchema,
});

/**
 * Records a CTA click. A CALL click means the visitor tapped a tel: link — it does
 * NOT mean a call connected. Confirmed calls only come from /webhooks/calls/:provider.
 */
publicRouter.post("/track/cta", limiter(60, 10), async (req, res) => {
  const d = parse(ctaSchema, req.body);
  const a = d.attribution;
  await prisma.ctaClickEvent.create({
    data: {
      type: d.type,
      placement: d.placement,
      target: d.target,
      pagePath: d.pagePath,
      visitorId: d.visitorId,
      deviceType: a.deviceType ?? "UNKNOWN",
      referrer: a.referrer,
      landingPage: a.landingPage,
      utmSource: a.utmSource,
      utmMedium: a.utmMedium,
      utmCampaign: a.utmCampaign,
      utmTerm: a.utmTerm,
      utmContent: a.utmContent,
      ipHash: hmac(clientIp(req)),
      userAgent: (req.get("x-client-user-agent") ?? "").slice(0, 300) || null,
    },
  });
  created(res, { recorded: true });
});

// ── Call-tracking provider webhook (not behind the public key; HMAC-verified instead) ──

export const webhooksRouter = Router();

const callSchema = z.object({
  providerCallId: z.string().min(1).max(200),
  trackingNumber: z.string().max(30).optional(),
  callerNumber: z.string().max(30).optional(),
  status: z.enum(["answered", "missed", "voicemail", "busy", "failed"]),
  durationSeconds: z.number().int().nonnegative().optional(),
  startedAt: z.coerce.date(),
  /** visitorId / click id passed through the provider's dynamic number insertion, if supported */
  clickId: z.string().max(64).optional(),
});

/**
 * POST /webhooks/calls/:provider
 * Header X-Signature: hex HMAC-SHA256 of the raw body using CALL_TRACKING_WEBHOOK_SECRET.
 * Provider-specific payloads should be mapped to `callSchema` in an adapter here.
 */
webhooksRouter.post("/calls/:provider", raw({ type: "application/json", limit: "100kb" }), async (req, res) => {
  const secret = env.CALL_TRACKING_WEBHOOK_SECRET;
  if (!secret) throw new AppError(503, "NOT_CONFIGURED", "Call tracking is not configured");
  const rawBody = req.body instanceof Buffer ? req.body : Buffer.from("");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!safeEqual(expected, String(req.get("x-signature") ?? ""))) throw unauthorized("Invalid signature");
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw badRequest("Invalid JSON");
  }
  const provider = z.string().regex(/^[a-z0-9-]{2,30}$/).parse(req.params.provider);
  const d = parse(callSchema, payload);
  const click = d.clickId ? await prisma.ctaClickEvent.findFirst({ where: { OR: [{ id: d.clickId }, { visitorId: d.clickId }] }, orderBy: { createdAt: "desc" } }) : null;
  await prisma.callEvent.upsert({
    where: { provider_providerCallId: { provider, providerCallId: d.providerCallId } },
    create: {
      provider,
      providerCallId: d.providerCallId,
      trackingNumber: d.trackingNumber,
      callerNumberHash: d.callerNumber ? hmac(d.callerNumber.replace(/\D/g, "")) : null,
      status: d.status,
      durationSeconds: d.durationSeconds,
      startedAt: d.startedAt,
      attributedClickId: click?.id,
      rawPayload: payload as Prisma.InputJsonValue,
    },
    update: { status: d.status, durationSeconds: d.durationSeconds },
  });
  ok(res, { received: true });
});
