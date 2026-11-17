import { Router } from "express";
import { z } from "zod";
import { prisma, ContentStatus } from "../db.js";
import { requirePermission, can } from "../auth/session.js";
import { body, cleanText, idParam, parse, slugify, slugSchema, stringArray } from "../lib/validate.js";
import { created, forbidden, notFound, ok, unprocessable } from "../lib/http.js";
import { audit } from "../lib/audit.js";
import { assertSlugFree, faqInputSchema, featureSchema, replaceFaqs, revalidateSite, seoSchema, seoWrite, statusSchema } from "../lib/content.js";

/**
 * Service areas = location landing pages: State → City → ServiceArea.
 * To avoid thin "doorway" pages, publishing requires real local content.
 */
export const areasRouter = Router();

const MIN_INTRO = 2;
const MIN_LOCAL = 2;

const areaSchema = z.object({
  stateCode: z.string().trim().toUpperCase().length(2),
  stateName: cleanText(60).pipe(z.string().min(2)),
  cityName: cleanText(80).pipe(z.string().min(2)),
  lat: z.number().min(-90).max(90).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
  slug: slugSchema.optional(),
  description: cleanText(500).default(""),
  intro: stringArray(10, 3000).default([]),
  localConsiderations: z.array(featureSchema).max(20).default([]),
  nearbyAreas: stringArray(50, 80).default([]),
  zipCodes: z.array(z.string().regex(/^\d{5}$/, "ZIP codes must be 5 digits")).max(500).default([]),
  status: statusSchema.default(ContentStatus.DRAFT),
  sortOrder: z.number().int().default(0),
  seo: seoSchema,
  faqs: z.array(faqInputSchema).max(30).optional(),
  /** [{ serviceId, isFeatured }] */
  services: z.array(z.object({ serviceId: z.string().max(40), isFeatured: z.boolean().default(false) })).max(200).optional(),
});

type AreaInput = z.infer<typeof areaSchema>;

function assertNotThin(d: AreaInput) {
  if (d.status !== ContentStatus.PUBLISHED && d.status !== ContentStatus.SCHEDULED) return;
  const errors: Record<string, string> = {};
  if (d.intro.filter((p) => p.length >= 80).length < MIN_INTRO) errors.intro = `Add at least ${MIN_INTRO} intro paragraphs (80+ characters) written specifically for this area`;
  if (d.localConsiderations.length < MIN_LOCAL) errors.localConsiderations = `Add at least ${MIN_LOCAL} local plumbing considerations`;
  if (!d.seo.metaTitle || !d.seo.metaDescription) errors["seo.metaTitle"] = "SEO title and meta description are required to publish";
  if (Object.keys(errors).length) throw unprocessable("This location page needs more unique local content before it can be published.", errors);
}

async function upsertCity(d: AreaInput) {
  const state = await prisma.state.upsert({
    where: { code: d.stateCode },
    create: { code: d.stateCode, name: d.stateName, slug: slugify(d.stateName) },
    update: {},
  });
  const citySlug = slugify(d.cityName);
  return prisma.city.upsert({
    where: { stateId_slug: { stateId: state.id, slug: citySlug } },
    create: { name: d.cityName, slug: citySlug, stateId: state.id, lat: d.lat ?? null, lng: d.lng ?? null },
    update: { name: d.cityName, lat: d.lat ?? null, lng: d.lng ?? null },
  });
}

const include = {
  city: { include: { state: true } },
  seo: { include: { ogImage: true } },
  faqs: { orderBy: { sortOrder: "asc" as const } },
  services: { orderBy: { sortOrder: "asc" as const }, select: { serviceId: true, isFeatured: true } },
  keywords: { select: { id: true, keyword: true, role: true } },
};

areasRouter.get("/", requirePermission("content:read"), async (req, res) => {
  const items = await prisma.serviceArea.findMany({
    where: { deletedAt: req.query.deleted === "true" ? { not: null } : null },
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
    include: { city: { include: { state: true } }, seo: true, _count: { select: { services: true, faqs: true } } },
  });
  ok(res, items);
});

areasRouter.get("/states", requirePermission("content:read"), async (_req, res) => {
  ok(res, await prisma.state.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { cities: true } } } }));
});

areasRouter.get("/:id", requirePermission("content:read"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const item = await prisma.serviceArea.findUnique({ where: { id }, include });
  if (!item) throw notFound("Service area");
  ok(res, item);
});

async function save(req: Parameters<typeof can>[0], id?: string) {
  const d = body(req, areaSchema);
  const before = id ? await prisma.serviceArea.findUnique({ where: { id } }) : null;
  if (id && !before) throw notFound("Service area");
  if (d.status !== before?.status && d.status !== ContentStatus.DRAFT && !can(req, "content:publish")) throw forbidden("You need publish permission to change the status");
  assertNotThin(d);
  const city = await upsertCity(d);
  const slug = d.slug ?? before?.slug ?? slugify(`${d.cityName}-${d.stateCode}`);
  await assertSlugFree("serviceArea", slug, id);
  const clash = await prisma.serviceArea.findUnique({ where: { cityId: city.id } });
  if (clash && clash.id !== id) throw unprocessable("A service area for this city already exists", { cityName: "Already exists" });

  const data = {
    slug,
    cityId: city.id,
    description: d.description,
    intro: d.intro,
    localConsiderations: d.localConsiderations,
    nearbyAreas: d.nearbyAreas,
    zipCodes: d.zipCodes,
    status: d.status,
    sortOrder: d.sortOrder,
  };
  return prisma.$transaction(async (tx) => {
    let area;
    if (id && before) {
      await tx.seoMeta.update({ where: { id: before.seoId }, data: seoWrite(d.seo) });
      area = await tx.serviceArea.update({ where: { id }, data });
    } else {
      const seoRow = await tx.seoMeta.create({ data: seoWrite(d.seo) });
      area = await tx.serviceArea.create({ data: { ...data, seoId: seoRow.id } });
    }
    await replaceFaqs(tx, { serviceAreaId: area.id }, d.faqs);
    if (d.services) {
      await tx.serviceAreaService.deleteMany({ where: { serviceAreaId: area.id } });
      await tx.serviceAreaService.createMany({ data: d.services.map((s, i) => ({ ...s, serviceAreaId: area.id, sortOrder: i })) });
    }
    return tx.serviceArea.findUniqueOrThrow({ where: { id: area.id }, include });
  });
}

areasRouter.post("/", requirePermission("content:write"), async (req, res) => {
  const item = await save(req);
  await audit(req, "create", "ServiceArea", item.id, { summary: item.slug });
  revalidateSite();
  created(res, item);
});

areasRouter.put("/:id", requirePermission("content:write"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const item = await save(req, id);
  await audit(req, "update", "ServiceArea", id, { summary: item.slug });
  revalidateSite();
  ok(res, item);
});

areasRouter.delete("/:id", requirePermission("content:delete"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const item = await prisma.serviceArea.update({ where: { id }, data: { deletedAt: new Date(), status: ContentStatus.ARCHIVED } });
  await audit(req, "delete", "ServiceArea", id, { summary: item.slug });
  revalidateSite();
  ok(res, { deleted: true });
});

areasRouter.post("/:id/restore", requirePermission("content:delete"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const item = await prisma.serviceArea.update({ where: { id }, data: { deletedAt: null, status: ContentStatus.DRAFT } });
  await audit(req, "restore", "ServiceArea", id, { summary: item.slug });
  ok(res, item);
});
