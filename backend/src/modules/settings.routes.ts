import { Router } from "express";
import { z } from "zod";
import { prisma, PhoneType, NavLocation } from "../db";
import { requirePermission } from "../auth/session";
import { body, cleanText, parse, safeHref } from "../lib/validate";
import { ok, badRequest } from "../lib/http";
import { audit, diff } from "../lib/audit";
import { crudRouter } from "../lib/crud";
import { revalidateSite } from "../lib/content";

export const settingsRouter = Router();

// ── Business information (singleton) ──

const businessSchema = z.object({
  businessName: cleanText(120).pipe(z.string().min(2)),
  legalName: cleanText(160).pipe(z.string().min(2)),
  tagline: cleanText(200).default(""),
  shortDescription: cleanText(400).default(""),
  email: z.string().trim().email().max(200),
  street: cleanText(200),
  city: cleanText(100),
  region: cleanText(50),
  postalCode: z.string().trim().regex(/^\d{5}(-\d{4})?$/),
  country: z.string().trim().length(2).default("US"),
  serviceAreaLabel: cleanText(150).pipe(z.string().min(2)),
  licenseNumber: cleanText(100).nullish(),
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"]).nullish(),
  emergencyAvailable: z.boolean(),
  emergencyLabel: cleanText(80),
  emergencyShortLabel: cleanText(40),
  trustFootnote: cleanText(500).default(""),
  logoId: z.string().max(40).nullish(),
  faviconId: z.string().max(40).nullish(),
});

settingsRouter.get("/business", requirePermission("settings:write"), async (_req, res) => {
  ok(res, await prisma.businessInfo.findUnique({ where: { id: "default" }, include: { logo: true, favicon: true } }));
});

settingsRouter.put("/business", requirePermission("settings:write"), async (req, res) => {
  const d = body(req, businessSchema);
  const before = await prisma.businessInfo.findUnique({ where: { id: "default" } });
  const item = await prisma.businessInfo.upsert({ where: { id: "default" }, create: { id: "default", ...d }, update: d, include: { logo: true, favicon: true } });
  await audit(req, "update", "BusinessInfo", "default", { diff: diff(before as never, item as never) });
  revalidateSite();
  ok(res, item);
});

// ── Business hours: PUT the whole week ──

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)");
settingsRouter.get("/hours", requirePermission("settings:write"), async (_req, res) => {
  ok(res, await prisma.businessHours.findMany({ orderBy: { dayOfWeek: "asc" } }));
});
settingsRouter.put("/hours", requirePermission("settings:write"), async (req, res) => {
  const { days } = body(
    req,
    z.object({
      days: z
        .array(z.object({ dayOfWeek: z.number().int().min(0).max(6), isClosed: z.boolean(), opensAt: time.nullish(), closesAt: time.nullish(), note: cleanText(80).nullish() }))
        .length(7),
    }),
  );
  for (const d of days) if (!d.isClosed && (!d.opensAt || !d.closesAt || d.opensAt >= d.closesAt)) throw badRequest("Open days need an opening time before the closing time", { [`days.${d.dayOfWeek}`]: "Invalid times" });
  await prisma.$transaction(
    days.map((d) =>
      prisma.businessHours.upsert({
        where: { dayOfWeek: d.dayOfWeek },
        create: { ...d, opensAt: d.isClosed ? null : d.opensAt, closesAt: d.isClosed ? null : d.closesAt },
        update: { ...d, opensAt: d.isClosed ? null : d.opensAt, closesAt: d.isClosed ? null : d.closesAt },
      }),
    ),
  );
  await audit(req, "update", "BusinessHours", null);
  revalidateSite();
  ok(res, await prisma.businessHours.findMany({ orderBy: { dayOfWeek: "asc" } }));
});

// ── Footer (singleton) ──

settingsRouter.get("/footer", requirePermission("settings:write"), async (_req, res) => {
  ok(res, await prisma.footerSettings.upsert({ where: { id: "default" }, create: { id: "default" }, update: {} }));
});
settingsRouter.put("/footer", requirePermission("settings:write"), async (req, res) => {
  const d = body(
    req,
    z.object({
      description: cleanText(500).nullish(),
      showServices: z.boolean(),
      servicesLimit: z.number().int().min(1).max(30),
      showServiceAreas: z.boolean(),
      showHours: z.boolean(),
      copyrightText: cleanText(200).nullish(),
    }),
  );
  const item = await prisma.footerSettings.upsert({ where: { id: "default" }, create: { id: "default", ...d }, update: d });
  await audit(req, "update", "FooterSettings", "default");
  revalidateSite();
  ok(res, item);
});

// ── System settings (key/value, validated per key) ──

const SYSTEM_KEYS = {
  robots: z.object({
    allowIndexing: z.boolean(),
    disallow: z.array(z.string().regex(/^\/[^\s]*$/)).max(50),
    extra: cleanText(2000).default(""),
  }),
  leadNotifications: z.object({ emails: z.array(z.string().email()).max(20) }),
  callTracking: z.object({
    provider: z.enum(["none", "callrail", "ctm", "twilio", "other"]),
    /** Optional dynamic number insertion script URL from the provider (loaded by the site) */
    scriptUrl: z.string().url().startsWith("https://").nullish(),
  }),
  analytics: z.object({ ga4MeasurementId: z.string().regex(/^G-[A-Z0-9]+$/).nullish(), gtmId: z.string().regex(/^GTM-[A-Z0-9]+$/).nullish() }),
} as const;

settingsRouter.get("/system", requirePermission("system:write"), async (_req, res) => {
  const rows = await prisma.systemSetting.findMany();
  ok(res, Object.fromEntries(rows.map((r) => [r.key, r.value])));
});
settingsRouter.put("/system/:key", requirePermission("system:write"), async (req, res) => {
  const key = req.params.key as keyof typeof SYSTEM_KEYS;
  const schema = SYSTEM_KEYS[key];
  if (!schema) throw badRequest("Unknown setting");
  const value = parse(schema, req.body);
  const row = await prisma.systemSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
  await audit(req, "update", "SystemSetting", key, { diff: value });
  revalidateSite();
  ok(res, row);
});

// ── Simple lists ──

settingsRouter.use(
  "/phones",
  crudRouter({
    model: "phoneNumber",
    entity: "PhoneNumber",
    read: "settings:write",
    write: "settings:write",
    orderBy: [{ sortOrder: "asc" }],
    schema: z.object({
      label: cleanText(60).pipe(z.string().min(1)),
      display: cleanText(30).pipe(z.string().min(7)),
      e164: z.string().regex(/^\+1[2-9]\d{9}$/, "Use E.164 format, e.g. +15555550123"),
      type: z.nativeEnum(PhoneType).default("MAIN"),
      isPrimary: z.boolean().default(false),
      isActive: z.boolean().default(true),
      sortOrder: z.number().int().default(0),
    }),
    // Exactly one primary number drives every "Call Now" button
    beforeSave: async (data, _req, id) => {
      if (data.isPrimary === true) await prisma.phoneNumber.updateMany({ where: { isPrimary: true, ...(id ? { NOT: { id } } : {}) }, data: { isPrimary: false } });
    },
  }),
);

settingsRouter.use(
  "/trust-badges",
  crudRouter({
    model: "trustBadge",
    entity: "TrustBadge",
    read: "settings:write",
    write: "settings:write",
    orderBy: [{ sortOrder: "asc" }],
    schema: z.object({
      label: cleanText(60).pipe(z.string().min(1)),
      description: cleanText(200),
      icon: z.string().max(30),
      requiresFootnote: z.boolean().default(false),
      isActive: z.boolean().default(true),
      sortOrder: z.number().int().default(0),
    }),
  }),
);

settingsRouter.use(
  "/social-links",
  crudRouter({
    model: "socialLink",
    entity: "SocialLink",
    read: "settings:write",
    write: "settings:write",
    orderBy: [{ sortOrder: "asc" }],
    schema: z.object({
      platform: z.enum(["facebook", "instagram", "google", "yelp", "nextdoor", "linkedin", "youtube", "x", "tiktok", "bbb"]),
      label: cleanText(40).pipe(z.string().min(1)),
      url: z.string().url().startsWith("https://"),
      isActive: z.boolean().default(true),
      sortOrder: z.number().int().default(0),
    }),
  }),
);

settingsRouter.use(
  "/navigation",
  crudRouter({
    model: "navigationItem",
    entity: "NavigationItem",
    read: "settings:write",
    write: "settings:write",
    filters: ["location"],
    orderBy: [{ location: "asc" }, { sortOrder: "asc" }],
    schema: z.object({
      location: z.nativeEnum(NavLocation),
      label: cleanText(60).pipe(z.string().min(1)),
      href: safeHref,
      isActive: z.boolean().default(true),
      sortOrder: z.number().int().default(0),
      parentId: z.string().max(40).nullish(),
    }),
  }),
);
