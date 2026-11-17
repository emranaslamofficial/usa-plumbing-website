import { prisma, type Prisma } from "../db.js";
import { liveWhere, livePostWhere } from "../lib/content.js";

/** Converts DB rows into the JSON shapes defined in the website's src/types/index.ts. */

type SeoRow = Prisma.SeoMetaGetPayload<{ include: { ogImage: true } }>;
type KeywordRow = { keyword: string; role: string | null };

export function seoOut(seo: SeoRow | null, keywords: KeywordRow[], fallback: { title: string; description: string }) {
  return {
    metaTitle: seo?.metaTitle || fallback.title,
    metaDescription: seo?.metaDescription || fallback.description,
    primaryKeyword: keywords.find((k) => k.role === "PRIMARY")?.keyword ?? "",
    secondaryKeywords: keywords.filter((k) => k.role !== "PRIMARY").map((k) => k.keyword),
    ogImage: seo?.ogImage?.url ?? undefined,
    noIndex: seo?.robots?.startsWith("noindex") ?? false,
    robots: seo?.robots ?? "index,follow",
    canonicalUrl: seo?.canonicalUrl ?? undefined,
    ogTitle: seo?.ogTitle ?? undefined,
    ogDescription: seo?.ogDescription ?? undefined,
    schemaJson: (seo?.schemaJson as Record<string, unknown> | null) ?? undefined,
  };
}

const imageOut = (m: { url: string; alt: string; width: number | null; height: number | null } | null | undefined) =>
  m ? { src: m.url, alt: m.alt, width: m.width ?? undefined, height: m.height ?? undefined } : undefined;

const faqOut = (f: { question: string; answer: string }) => ({ question: f.question, answer: f.answer });

// ───────────── Settings ─────────────

const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const fmt = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export function hoursOut(rows: { dayOfWeek: number; isClosed: boolean; opensAt: string | null; closesAt: string | null; note: string | null }[]) {
  const order = [1, 2, 3, 4, 5, 6, 0].map((d) => rows.find((r) => r.dayOfWeek === d)).filter((r) => r !== undefined);
  const value = (r: (typeof order)[number]) => (r.isClosed || !r.opensAt || !r.closesAt ? (r.note ?? "Closed") : `${fmt(r.opensAt)} – ${fmt(r.closesAt)}${r.note ? ` (${r.note})` : ""}`);
  const groups: { days: number[]; value: string }[] = [];
  for (const r of order) {
    const v = value(r);
    const last = groups.at(-1);
    if (last && last.value === v) last.days.push(r.dayOfWeek);
    else groups.push({ days: [r.dayOfWeek], value: v });
  }
  const hours = groups.map((g) => ({ label: g.days.length > 1 ? `${SHORT[g.days[0]]} – ${SHORT[g.days.at(-1)!]}` : DAY[g.days[0]], value: g.value }));
  const spec = new Map<string, string[]>();
  for (const r of order) if (!r.isClosed && r.opensAt && r.closesAt) spec.set(`${r.opensAt}|${r.closesAt}`, [...(spec.get(`${r.opensAt}|${r.closesAt}`) ?? []), DAY[r.dayOfWeek]]);
  const openingHours = [...spec].map(([k, days]) => ({ days, opens: k.split("|")[0], closes: k.split("|")[1] }));
  return { hours, openingHours };
}

export async function settingsOut() {
  const [b, phones, hours, badges, social, nav, footer, sys] = await Promise.all([
    prisma.businessInfo.findUnique({ where: { id: "default" }, include: { logo: true, favicon: true } }),
    prisma.phoneNumber.findMany({ where: { isActive: true }, orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] }),
    prisma.businessHours.findMany(),
    prisma.trustBadge.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.socialLink.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.navigationItem.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.footerSettings.findUnique({ where: { id: "default" } }),
    prisma.systemSetting.findMany({ where: { key: { in: ["callTracking", "analytics"] } } }),
  ]);
  if (!b) throw new Error("Business information has not been configured (run the seed)");
  const primary = phones[0];
  const { hours: h, openingHours } = hoursOut(hours);
  const navFor = (loc: string) => nav.filter((n) => n.location === loc && !n.parentId).map((n) => ({ label: n.label, href: n.href }));
  const sysMap = Object.fromEntries(sys.map((s) => [s.key, s.value])) as Record<string, Record<string, unknown>>;
  return {
    businessName: b.businessName,
    legalName: b.legalName,
    tagline: b.tagline,
    shortDescription: b.shortDescription,
    phone: primary ? { display: primary.display, e164: primary.e164 } : { display: "", e164: "" },
    phones: phones.map((p) => ({ label: p.label, display: p.display, e164: p.e164, type: p.type })),
    email: b.email,
    address: { street: b.street, city: b.city, region: b.region, postalCode: b.postalCode, country: b.country },
    serviceAreaLabel: b.serviceAreaLabel,
    hours: h,
    openingHours,
    emergency: { available: b.emergencyAvailable, label: b.emergencyLabel, shortLabel: b.emergencyShortLabel },
    licenseNumber: b.licenseNumber ?? undefined,
    trustBadges: badges.map((t) => ({ id: t.id, label: t.label, description: t.description, icon: t.icon, requiresFootnote: t.requiresFootnote })),
    trustFootnote: b.trustFootnote,
    social: social.map((s) => ({ platform: s.platform, label: s.label, url: s.url })),
    priceRange: b.priceRange ?? undefined,
    logo: b.logo?.url,
    favicon: b.favicon?.url,
    navigation: { header: navFor("HEADER"), quickLinks: navFor("FOOTER_QUICK_LINKS"), legal: navFor("FOOTER_LEGAL") },
    footer: {
      description: footer?.description ?? b.shortDescription,
      showServices: footer?.showServices ?? true,
      servicesLimit: footer?.servicesLimit ?? 10,
      showServiceAreas: footer?.showServiceAreas ?? true,
      showHours: footer?.showHours ?? true,
      copyrightText: footer?.copyrightText ?? undefined,
    },
    callTracking: sysMap.callTracking?.scriptUrl ? { scriptUrl: sysMap.callTracking.scriptUrl as string } : undefined,
    analytics: sysMap.analytics ?? undefined,
  };
}

// ───────────── Services ─────────────

export const serviceSummarySelect = {
  id: true,
  slug: true,
  name: true,
  icon: true,
  shortDescription: true,
  pathOverride: true,
  isEmergency: true,
  isFeatured: true,
  sortOrder: true,
  category: { select: { slug: true } },
} as const;

export const serviceSummaryOut = (s: Prisma.ServiceGetPayload<{ select: typeof serviceSummarySelect }>) => ({
  id: s.id,
  slug: s.slug,
  name: s.name,
  category: s.category.slug,
  icon: s.icon,
  shortDescription: s.shortDescription,
  path: s.pathOverride ?? undefined,
  isEmergency: s.isEmergency,
  isFeatured: s.isFeatured,
  sortOrder: s.sortOrder,
});

export async function serviceOut(slug: string) {
  const s = await prisma.service.findFirst({
    where: { slug, ...liveWhere() },
    include: {
      category: true,
      featuredImage: true,
      seo: { include: { ogImage: true } },
      faqs: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      relatedTo: { orderBy: { sortOrder: "asc" }, include: { related: { select: { slug: true, status: true, deletedAt: true } } } },
      posts: { orderBy: { sortOrder: "asc" }, include: { post: { select: { slug: true, status: true, publishedAt: true, deletedAt: true } } } },
      keywords: { select: { keyword: true, role: true } },
    },
  });
  if (!s) return null;
  const now = Date.now();
  const postLive = (p: { status: string; publishedAt: Date | null; deletedAt: Date | null }) =>
    !p.deletedAt && (p.status === "PUBLISHED" || (p.status === "SCHEDULED" && (p.publishedAt?.getTime() ?? Infinity) <= now));
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    category: s.category.slug,
    icon: s.icon,
    shortDescription: s.shortDescription,
    h1: s.h1,
    intro: s.intro as string[],
    signsTitle: s.signsTitle,
    signs: s.signs as string[],
    featuresTitle: s.featuresTitle,
    features: s.features as { title: string; description: string }[],
    faqs: s.faqs.map(faqOut),
    relatedServiceSlugs: s.relatedTo.filter((r) => r.related.status === "PUBLISHED" && !r.related.deletedAt).map((r) => r.related.slug),
    relatedPostSlugs: s.posts.filter((p) => postLive(p.post)).map((p) => p.post.slug),
    path: s.pathOverride ?? undefined,
    image: imageOut(s.featuredImage),
    ctaHeading: s.ctaHeading ?? undefined,
    ctaText: s.ctaText ?? undefined,
    isFeatured: s.isFeatured,
    isEmergency: s.isEmergency,
    sortOrder: s.sortOrder,
    seo: seoOut(s.seo, s.keywords, { title: s.name, description: s.shortDescription }),
  };
}

// ───────────── Locations ─────────────

export async function locationOut(slug: string) {
  const a = await prisma.serviceArea.findFirst({
    where: { slug, ...liveWhere() },
    include: {
      city: { include: { state: true } },
      seo: { include: { ogImage: true } },
      faqs: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      services: { orderBy: { sortOrder: "asc" }, include: { service: { select: { slug: true, status: true, deletedAt: true } } } },
      keywords: { select: { keyword: true, role: true } },
    },
  });
  if (!a) return null;
  const linked = a.services.filter((s) => s.service.status === "PUBLISHED" && !s.service.deletedAt);
  const place = `${a.city.name}, ${a.city.state.code}`;
  return {
    id: a.id,
    slug: a.slug,
    city: a.city.name,
    stateCode: a.city.state.code,
    stateName: a.city.state.name,
    description: a.description,
    intro: a.intro as string[],
    localConsiderations: a.localConsiderations as { title: string; description: string }[],
    nearbyAreas: a.nearbyAreas,
    zipCodes: a.zipCodes,
    featuredServiceSlugs: linked.filter((s) => s.isFeatured).map((s) => s.service.slug),
    serviceSlugs: linked.map((s) => s.service.slug),
    faqs: a.faqs.map(faqOut),
    geo: a.city.lat != null && a.city.lng != null ? { lat: a.city.lat, lng: a.city.lng } : undefined,
    isActive: true,
    sortOrder: a.sortOrder,
    seo: seoOut(a.seo, a.keywords, { title: `Plumber in ${place}`, description: a.description || `Plumbing services in ${place}.` }),
  };
}

// ───────────── Blog ─────────────

type Block = { type: string; text?: string; items?: string[]; title?: string; headers?: string[]; rows?: string[][]; caption?: string; cite?: string };

export function readingMinutes(intro: string, body: unknown, faqs: { question: string; answer: string }[]) {
  const blocks = (Array.isArray(body) ? body : []) as Block[];
  const text = [intro, ...blocks.map((b) => [b.text, b.title, b.caption, b.cite, ...(b.items ?? []), ...(b.headers ?? []), ...(b.rows ?? []).flat()].filter(Boolean).join(" ")), ...faqs.map((f) => `${f.question} ${f.answer}`)].join(" ");
  return Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 225));
}

export const postSummaryInclude = {
  author: { select: { name: true } },
  category: { select: { slug: true } },
  featuredImage: true,
  faqs: { select: { question: true, answer: true } },
} as const;

export function postSummaryOut(p: Prisma.PostGetPayload<{ include: typeof postSummaryInclude }>) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    categorySlug: p.category.slug,
    publishedAt: (p.publishedAt ?? p.createdAt).toISOString().slice(0, 10),
    featuredImage: imageOut(p.featuredImage),
    isFeatured: p.isFeatured,
    isPopular: p.isPopular,
    readingMinutes: readingMinutes(p.intro, p.body, p.faqs),
    authorName: p.author.name,
  };
}

export async function postOut(slug: string) {
  const p = await prisma.post.findFirst({
    where: { slug, ...livePostWhere() },
    include: {
      ...postSummaryInclude,
      faqs: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { question: true, answer: true } },
      seo: { include: { ogImage: true } },
      tags: { include: { tag: true } },
      services: { orderBy: { sortOrder: "asc" }, include: { service: { select: { slug: true, status: true, deletedAt: true } } } },
      keywords: { select: { keyword: true, role: true } },
    },
  });
  if (!p) return null;
  return {
    ...postSummaryOut(p),
    authorId: p.authorId,
    // Only surface "Updated" when edited on a later day than publication
    updatedAt: p.publishedAt && p.updatedAt.toISOString().slice(0, 10) > p.publishedAt.toISOString().slice(0, 10) ? p.updatedAt.toISOString().slice(0, 10) : undefined,
    intro: p.intro,
    body: p.body,
    faqs: p.faqs.map(faqOut),
    relatedServiceSlugs: p.services.filter((s) => s.service.status === "PUBLISHED" && !s.service.deletedAt).map((s) => s.service.slug),
    tags: p.tags.map((t) => t.tag.name),
    seo: seoOut(p.seo, p.keywords, { title: p.title, description: p.excerpt }),
  };
}
