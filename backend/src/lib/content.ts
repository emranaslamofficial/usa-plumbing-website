import { z } from "zod";
import { prisma, ContentStatus, type Prisma } from "../db.js";
import { env } from "../config/env.js";
import { logger } from "./logger.js";
import { background } from "./background.js";
import { cleanText, optionalUrl, safeHref, slugify } from "./validate.js";
import { conflict } from "./http.js";

// ───────────── Publish state ─────────────

/** Services, service areas and pages are live when PUBLISHED and not deleted. */
export const liveWhere = () => ({ deletedAt: null, status: ContentStatus.PUBLISHED });

/** Posts support scheduling: live when PUBLISHED, or SCHEDULED with publishedAt in the past. */
export const livePostWhere = () => ({
  deletedAt: null,
  OR: [{ status: ContentStatus.PUBLISHED }, { status: ContentStatus.SCHEDULED, publishedAt: { lte: new Date() } }],
});

export const statusSchema = z.nativeEnum(ContentStatus);

// ───────────── SEO ─────────────

export const seoSchema = z
  .object({
    metaTitle: cleanText(70).nullish(),
    metaDescription: cleanText(170).nullish(),
    canonicalUrl: optionalUrl,
    robots: z.enum(["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"]).default("index,follow"),
    ogTitle: cleanText(95).nullish(),
    ogDescription: cleanText(200).nullish(),
    ogImageId: z.string().max(40).nullish(),
    schemaJson: z.record(z.string(), z.unknown()).nullish(),
  })
  .partial()
  .default({ robots: "index,follow" });

export type SeoInput = z.infer<typeof seoSchema>;

export function seoWrite(seo: SeoInput) {
  const { schemaJson, ...rest } = seo;
  return { ...rest, ...(schemaJson !== undefined ? { schemaJson: (schemaJson ?? undefined) as Prisma.InputJsonValue } : {}) };
}

export const seoInclude = { include: { ogImage: true } } as const;

// ───────────── Content blocks (blog posts & pages) ─────────────

const headingId = z.string().max(80).regex(/^[a-z0-9-]*$/).default("");

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("h2"), id: headingId, text: cleanText(200) }),
  z.object({ type: z.literal("h3"), id: headingId, text: cleanText(200) }),
  z.object({ type: z.literal("p"), text: cleanText(5000) }),
  z.object({ type: z.literal("ul"), items: z.array(cleanText(1000)).min(1).max(100) }),
  z.object({ type: z.literal("ol"), items: z.array(cleanText(1000)).min(1).max(100) }),
  z.object({ type: z.literal("callout"), variant: z.enum(["tip", "warning", "info"]), title: cleanText(120).optional(), text: cleanText(2000) }),
  z.object({ type: z.literal("quote"), text: cleanText(2000), cite: cleanText(200).optional() }),
  z.object({
    type: z.literal("table"),
    caption: cleanText(200).optional(),
    headers: z.array(cleanText(200)).max(10),
    rows: z.array(z.array(cleanText(500)).max(10)).max(100),
  }),
  z.object({
    type: z.literal("image"),
    mediaId: z.string().max(40).optional(),
    src: safeHref,
    alt: cleanText(250),
    width: z.number().int().positive().max(10000).optional(),
    height: z.number().int().positive().max(10000).optional(),
    caption: cleanText(300).optional(),
  }),
]);

export const blocksSchema = z.array(blockSchema).max(400);
export type ContentBlock = z.infer<typeof blockSchema>;

/** Fills missing heading anchors and makes them unique. */
export function normalizeBlocks(blocks: ContentBlock[]) {
  const seen = new Map<string, number>();
  return blocks.map((b) => {
    if (b.type !== "h2" && b.type !== "h3") return b;
    const base = b.id || slugify(b.text) || "section";
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return { ...b, id: n ? `${base}-${n + 1}` : base };
  });
}

export const featureSchema = z.object({ title: cleanText(150), description: cleanText(600) });
export const faqInputSchema = z.object({ question: cleanText(300).pipe(z.string().min(3)), answer: cleanText(3000).pipe(z.string().min(1)) });

/** Replaces all FAQs of an owner in one go (editor sends the full ordered list). */
export async function replaceFaqs(
  tx: Prisma.TransactionClient,
  owner: { serviceId?: string; serviceAreaId?: string; postId?: string; pageId?: string },
  faqs: z.infer<typeof faqInputSchema>[] | undefined,
) {
  if (!faqs) return;
  await tx.faq.deleteMany({ where: owner });
  if (faqs.length) await tx.faq.createMany({ data: faqs.map((f, i) => ({ ...f, ...owner, sortOrder: i })) });
}

// ───────────── Slugs ─────────────

type SlugModel = "service" | "serviceArea" | "post" | "page" | "serviceCategory" | "blogCategory" | "tag" | "author";

/** Throws 409 if the slug is taken by another record. */
export async function assertSlugFree(model: SlugModel, slug: string, exceptId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const delegate = (prisma as any)[model];
  const existing = await delegate.findUnique({ where: { slug }, select: { id: true } });
  if (existing && existing.id !== exceptId) throw conflict(`The URL slug "${slug}" is already in use`, { slug: "Slug already in use" });
}

/** Suggests the next free slug: "drain-cleaning", "drain-cleaning-2", ... */
export async function uniqueSlug(model: SlugModel, source: string, exceptId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const delegate = (prisma as any)[model];
  const base = slugify(source) || "item";
  for (let i = 1; i < 500; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    const existing = await delegate.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === exceptId) return candidate;
  }
  return `${base}-${Date.now()}`;
}

// ───────────── Website cache revalidation ─────────────

/** Tells the Next.js site to purge cached content. Runs after the response; never throws. */
export function revalidateSite() {
  if (!env.SITE_REVALIDATE_URL || !env.SITE_REVALIDATE_SECRET) return;
  background(
    (async () => {
    try {
      const res = await fetch(env.SITE_REVALIDATE_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.SITE_REVALIDATE_SECRET}` },
        body: JSON.stringify({ tags: ["content"] }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) logger.warn({ status: res.status }, "site revalidation failed");
    } catch (err) {
      logger.warn({ err }, "site revalidation unreachable");
    }
    })(),
  );
}

export const linkSchema = z.object({ label: cleanText(80).pipe(z.string().min(1)), href: safeHref });
