import { z } from "zod";
import { prisma, type Prisma } from "../db";
import { cleanText } from "../lib/validate";
import { liveWhere, livePostWhere } from "../lib/content";
import { hmac } from "../lib/crypto";
import { attributionSchema, createLeadFromForm, leadInputSchema } from "./leads.service";
import { locationOut, postOut, postSummaryInclude, postSummaryOut, seoOut, serviceOut, serviceSummaryOut, serviceSummarySelect, settingsOut } from "./public.serializers";

/**
 * Public website content + visitor actions. Used in two ways:
 *  - by the REST API (public.routes.ts → /api/v1/public/*)
 *  - directly in-process by the Next.js website (src/lib/api/direct.ts), so pages
 *    read the database without an HTTP round trip and can be built without a running API.
 * Every function returns only published/live data.
 */

export const getSettings = () => settingsOut();

export async function listServices() {
  const items = await prisma.service.findMany({ where: liveWhere(), orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: serviceSummarySelect });
  return items.map(serviceSummaryOut);
}

export const getService = (slug: string) => serviceOut(slug);

export async function listLocations() {
  const items = await prisma.serviceArea.findMany({ where: liveWhere(), orderBy: [{ sortOrder: "asc" }, { slug: "asc" }], include: { city: { include: { state: true } } } });
  return items.map((a) => ({ id: a.id, slug: a.slug, city: a.city.name, stateCode: a.city.state.code, stateName: a.city.state.name, nearbyAreas: a.nearbyAreas }));
}

export const getLocation = (slug: string) => locationOut(slug);

export const postQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(6),
  category: z.string().max(80).optional(),
  q: z.string().max(80).optional(),
});

export async function listPosts(input: z.input<typeof postQuerySchema> = {}) {
  const q = postQuerySchema.parse(input);
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
  return { items: rows.map(postSummaryOut), page, pageSize: q.pageSize, total, totalPages };
}

export async function getPostsBySlugs(slugs: string[]) {
  const list = slugs.filter(Boolean).slice(0, 30);
  if (!list.length) return [];
  const rows = await prisma.post.findMany({ where: { slug: { in: list }, ...livePostWhere() }, include: postSummaryInclude });
  const bySlug = new Map(rows.map((r) => [r.slug, postSummaryOut(r)]));
  return list.map((s) => bySlug.get(s)).filter((p) => p !== undefined);
}

export async function listPostSlugs() {
  const rows = await prisma.post.findMany({ where: livePostWhere(), select: { slug: true, updatedAt: true }, orderBy: { publishedAt: "desc" } });
  return rows.map((r) => ({ slug: r.slug, updatedAt: r.updatedAt.toISOString().slice(0, 10) }));
}

export async function listFeaturedPosts() {
  const rows = await prisma.post.findMany({ where: { ...livePostWhere(), isFeatured: true }, orderBy: { publishedAt: "desc" }, take: 5, include: postSummaryInclude });
  return rows.map(postSummaryOut);
}

export async function listPopularPosts(limit = 4) {
  const rows = await prisma.post.findMany({ where: { ...livePostWhere(), isPopular: true }, orderBy: { publishedAt: "desc" }, take: Math.min(Math.max(limit, 1), 20), include: postSummaryInclude });
  return rows.map(postSummaryOut);
}

export const getPost = (slug: string) => postOut(slug);

export async function listRelatedPosts(slug: string, limit = 3) {
  const post = await prisma.post.findFirst({ where: { slug, ...livePostWhere() }, include: { services: true } });
  if (!post) return [];
  const serviceIds = post.services.map((s) => s.serviceId);
  const candidates = await prisma.post.findMany({ where: { ...livePostWhere(), NOT: { id: post.id } }, include: { ...postSummaryInclude, services: { select: { serviceId: true } } }, take: 200, orderBy: { publishedAt: "desc" } });
  const score = (c: (typeof candidates)[number]) => (c.categoryId === post.categoryId ? 2 : 0) + c.services.filter((s) => serviceIds.includes(s.serviceId)).length;
  return candidates.sort((a, b) => score(b) - score(a)).slice(0, Math.min(Math.max(limit, 1), 12)).map(postSummaryOut);
}

export const listBlogCategories = () => prisma.blogCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true, description: true } });

export async function getAuthor(id: string) {
  const a = await prisma.author.findUnique({ where: { id }, include: { avatar: true } });
  return a ? { id: a.id, name: a.name, role: a.role, bio: a.bio, avatar: a.avatar?.url } : null;
}

export async function listPageSlugs() {
  const rows = await prisma.page.findMany({ where: liveWhere(), select: { slug: true, updatedAt: true } });
  return rows.map((r) => ({ slug: r.slug, updatedAt: r.updatedAt.toISOString().slice(0, 10) }));
}

export async function getPage(slug: string) {
  const p = await prisma.page.findFirst({
    where: { slug, ...liveWhere() },
    include: { seo: { include: { ogImage: true } }, faqs: { where: { isActive: true }, orderBy: { sortOrder: "asc" } }, keywords: { select: { keyword: true, role: true } } },
  });
  if (!p) return null;
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
    typeof v === "string"
      ? v.replace(/\{\{(\w+)\}\}/g, (m, k: string) => tokens[k] ?? m)
      : Array.isArray(v)
        ? v.map(fill)
        : v && typeof v === "object"
          ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fill(x)]))
          : v;
  return {
    slug: p.slug,
    title: p.title,
    intro: fill(p.intro) as string,
    body: fill(p.body) as unknown[],
    faqs: p.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    updatedAt: p.updatedAt.toISOString().slice(0, 10),
    seo: seoOut(p.seo, p.keywords, { title: p.title, description: p.intro.slice(0, 155) }),
  };
}

export const listFaqs = (group: string) =>
  prisma.faq.findMany({ where: { group, isActive: true }, orderBy: { sortOrder: "asc" }, select: { question: true, answer: true } });

export async function listTestimonials() {
  const rows = await prisma.testimonial.findMany({ where: { isPublished: true, isVerified: true }, orderBy: { sortOrder: "asc" }, include: { service: { select: { name: true } } } });
  return rows.map((t) => ({ id: t.id, authorName: t.authorName, location: t.location, rating: t.rating, body: t.body, source: t.source, sourceUrl: t.sourceUrl, serviceName: t.service?.name }));
}

export const listRedirects = () => prisma.redirect.findMany({ where: { isActive: true }, select: { source: true, destination: true, statusCode: true } });

export async function recordRedirectHit(source: string) {
  await prisma.redirect.updateMany({ where: { source: source.slice(0, 500) }, data: { hits: { increment: 1 } } });
}

export async function getRobots() {
  const row = await prisma.systemSetting.findUnique({ where: { key: "robots" } });
  return (row?.value as { allowIndexing: boolean; disallow: string[]; extra?: string } | null) ?? { allowIndexing: true, disallow: ["/api/"], extra: "" };
}

// ───────────── Visitor actions ─────────────

/**
 * Simple per-IP sliding-window limiter (per server instance) for calls that don't go through
 * Express. On Vercel each instance keeps its own counters; add Upstash Redis for global limits.
 */
const buckets = new Map<string, number[]>();
export function allowRequest(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 10_000) buckets.clear(); // memory guard
  return true;
}

export class PublicInputError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string>,
  ) {
    super(message);
  }
}

function zodToDetails(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) out[i.path.join(".") || "_"] ??= i.message;
  return out;
}

/** Validates and stores a website form submission (service request or contact). */
export async function submitLead(body: unknown, meta: { ip: string; userAgent?: string }) {
  if (!allowRequest(`lead:${meta.ip}`, 5, 10 * 60_000)) throw new PublicInputError(429, "Too many submissions. Please call us instead.");
  const parsed = leadInputSchema.safeParse(body);
  if (!parsed.success) throw new PublicInputError(422, "Please correct the highlighted fields.", zodToDetails(parsed.error));
  try {
    const r = await createLeadFromForm(parsed.data, meta);
    return { referenceId: r.referenceId, duplicate: Boolean(r.duplicate) };
  } catch (err) {
    if ((err as { field?: string }).field === "serviceSlug") throw new PublicInputError(422, "Please choose a service from the list.", { serviceSlug: "Please choose a service from the list." });
    throw err;
  }
}

export const ctaSchema = z.object({
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
export async function recordCtaClick(body: unknown, meta: { ip: string; userAgent?: string }) {
  if (!allowRequest(`cta:${meta.ip}`, 60, 10 * 60_000)) throw new PublicInputError(429, "Too many requests");
  const parsed = ctaSchema.safeParse(body);
  if (!parsed.success) throw new PublicInputError(422, "Invalid event", zodToDetails(parsed.error));
  const d = parsed.data;
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
      ipHash: hmac(meta.ip),
      userAgent: meta.userAgent?.slice(0, 300) || null,
    },
  });
}
