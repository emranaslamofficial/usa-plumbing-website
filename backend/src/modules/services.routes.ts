import { Router } from "express";
import { z } from "zod";
import { prisma, ContentStatus } from "../db";
import { requirePermission, can } from "../auth/session";
import { body, cleanText, idParam, parse, slugSchema, stringArray } from "../lib/validate";
import { created, forbidden, notFound, ok } from "../lib/http";
import { audit, diff } from "../lib/audit";
import { assertSlugFree, faqInputSchema, featureSchema, replaceFaqs, revalidateSite, seoSchema, seoWrite, statusSchema, uniqueSlug } from "../lib/content";

export const servicesRouter = Router();

const serviceSchema = z.object({
  name: cleanText(120).pipe(z.string().min(2)),
  slug: slugSchema.optional(),
  categoryId: z.string().max(40),
  icon: z.string().max(30).default("wrench"),
  shortDescription: cleanText(300).pipe(z.string().min(10)),
  h1: cleanText(160).pipe(z.string().min(3)),
  intro: stringArray(20, 3000).default([]),
  signsTitle: cleanText(160).default(""),
  signs: stringArray(30, 300).default([]),
  featuresTitle: cleanText(160).default(""),
  features: z.array(featureSchema).max(30).default([]),
  ctaHeading: cleanText(160).nullish(),
  ctaText: cleanText(400).nullish(),
  pathOverride: z.string().regex(/^\/[a-z0-9/-]*$/).max(120).nullish(),
  featuredImageId: z.string().max(40).nullish(),
  isFeatured: z.boolean().default(false),
  isEmergency: z.boolean().default(false),
  status: statusSchema.default(ContentStatus.DRAFT),
  sortOrder: z.number().int().default(0),
  seo: seoSchema,
  faqs: z.array(faqInputSchema).max(50).optional(),
  relatedServiceIds: z.array(z.string().max(40)).max(20).optional(),
  serviceAreaIds: z.array(z.string().max(40)).max(500).optional(),
});

const include = {
  category: true,
  featuredImage: true,
  seo: { include: { ogImage: true } },
  faqs: { orderBy: { sortOrder: "asc" as const } },
  relatedTo: { orderBy: { sortOrder: "asc" as const }, select: { relatedServiceId: true } },
  areas: { select: { serviceAreaId: true } },
  keywords: { select: { id: true, keyword: true, role: true } },
};

servicesRouter.get("/", requirePermission("content:read"), async (req, res) => {
  const deleted = req.query.deleted === "true";
  const items = await prisma.service.findMany({
    where: { deletedAt: deleted ? { not: null } : null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { category: true, seo: true, _count: { select: { faqs: true, leads: true } } },
  });
  ok(res, items);
});

servicesRouter.get("/:id", requirePermission("content:read"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const item = await prisma.service.findUnique({ where: { id }, include });
  if (!item) throw notFound("Service");
  ok(res, item);
});

function checkPublish(req: Parameters<typeof can>[0], status: ContentStatus | undefined, previous?: ContentStatus) {
  if (status && status !== previous && status !== ContentStatus.DRAFT && !can(req, "content:publish")) {
    throw forbidden("You need publish permission to change the status");
  }
}

servicesRouter.post("/", requirePermission("content:write"), async (req, res) => {
  const d = body(req, serviceSchema);
  checkPublish(req, d.status);
  const slug = d.slug ?? (await uniqueSlug("service", d.name));
  await assertSlugFree("service", slug);
  const { seo, faqs, relatedServiceIds, serviceAreaIds, ...data } = d;
  const item = await prisma.$transaction(async (tx) => {
    const seoRow = await tx.seoMeta.create({ data: seoWrite(seo) });
    const s = await tx.service.create({ data: { ...data, slug, seoId: seoRow.id } });
    await replaceFaqs(tx, { serviceId: s.id }, faqs);
    if (relatedServiceIds?.length) await tx.serviceRelation.createMany({ data: relatedServiceIds.map((r, i) => ({ serviceId: s.id, relatedServiceId: r, sortOrder: i })) });
    if (serviceAreaIds?.length) await tx.serviceAreaService.createMany({ data: serviceAreaIds.map((a) => ({ serviceId: s.id, serviceAreaId: a })) });
    return tx.service.findUniqueOrThrow({ where: { id: s.id }, include });
  });
  await audit(req, "create", "Service", item.id, { summary: item.name });
  revalidateSite();
  created(res, item);
});

servicesRouter.put("/:id", requirePermission("content:write"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const before = await prisma.service.findUnique({ where: { id }, include: { seo: true } });
  if (!before) throw notFound("Service");
  const d = body(req, serviceSchema);
  checkPublish(req, d.status, before.status);
  const slug = d.slug ?? before.slug;
  await assertSlugFree("service", slug, id);
  const { seo, faqs, relatedServiceIds, serviceAreaIds, ...data } = d;
  const item = await prisma.$transaction(async (tx) => {
    await tx.seoMeta.update({ where: { id: before.seoId }, data: seoWrite(seo) });
    await tx.service.update({ where: { id }, data: { ...data, slug } });
    await replaceFaqs(tx, { serviceId: id }, faqs);
    if (relatedServiceIds) {
      await tx.serviceRelation.deleteMany({ where: { serviceId: id } });
      await tx.serviceRelation.createMany({ data: relatedServiceIds.filter((r) => r !== id).map((r, i) => ({ serviceId: id, relatedServiceId: r, sortOrder: i })) });
    }
    if (serviceAreaIds) {
      await tx.serviceAreaService.deleteMany({ where: { serviceId: id, serviceAreaId: { notIn: serviceAreaIds } } });
      for (const a of serviceAreaIds) {
        await tx.serviceAreaService.upsert({ where: { serviceAreaId_serviceId: { serviceAreaId: a, serviceId: id } }, create: { serviceAreaId: a, serviceId: id }, update: {} });
      }
    }
    return tx.service.findUniqueOrThrow({ where: { id }, include });
  });
  await audit(req, "update", "Service", id, { summary: item.name, diff: diff(before as never, item as never) });
  revalidateSite();
  ok(res, item);
});

servicesRouter.patch("/:id/status", requirePermission("content:publish"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const { status } = body(req, z.object({ status: statusSchema }));
  const item = await prisma.service.update({ where: { id }, data: { status } });
  await audit(req, status === "PUBLISHED" ? "publish" : "status_change", "Service", id, { summary: `${item.name} → ${status}` });
  revalidateSite();
  ok(res, item);
});

servicesRouter.delete("/:id", requirePermission("content:delete"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const item = await prisma.service.update({ where: { id }, data: { deletedAt: new Date(), status: ContentStatus.ARCHIVED } });
  await audit(req, "delete", "Service", id, { summary: item.name });
  revalidateSite();
  ok(res, { deleted: true });
});

servicesRouter.post("/:id/restore", requirePermission("content:delete"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const item = await prisma.service.update({ where: { id }, data: { deletedAt: null, status: ContentStatus.DRAFT } });
  await audit(req, "restore", "Service", id, { summary: item.name });
  ok(res, item);
});
