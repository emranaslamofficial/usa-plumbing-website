import { z } from "zod";
import { prisma, LeadSource, PreferredTime, DeviceType } from "../db.js";
import { cleanText } from "../lib/validate.js";
import { hmac, randomToken } from "../lib/crypto.js";
import { sendMail } from "../lib/mailer.js";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { background } from "../lib/background.js";

const MIN_FILL_MS = 2500;
const DUPLICATE_WINDOW_MIN = 15;

const utm = cleanText(200).optional();

export const attributionSchema = z
  .object({
    landingPage: cleanText(500).optional(),
    sourcePath: cleanText(500).optional(),
    referrer: cleanText(500).optional(),
    utmSource: utm,
    utmMedium: utm,
    utmCampaign: utm,
    utmTerm: utm,
    utmContent: utm,
    deviceType: z.enum(["MOBILE", "TABLET", "DESKTOP", "UNKNOWN"]).default("UNKNOWN"),
  })
  .partial()
  .default({});

export const leadInputSchema = z.object({
  formType: z.enum(["service_request", "contact"]).default("service_request"),
  name: cleanText(100).pipe(z.string().min(2, "Please enter your name.")),
  phone: z
    .string()
    .max(30)
    .transform((p) => {
      const d = p.replace(/\D/g, "");
      return d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
    })
    .pipe(z.string().regex(/^[2-9]\d{9}$/, "Enter a valid 10-digit US phone number.")),
  email: z.string().trim().toLowerCase().max(200).email("Enter a valid email address.").optional().or(z.literal("").transform(() => undefined)),
  serviceSlug: z.string().trim().max(120).min(1, "Please choose the service you need."),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Enter a valid 5-digit ZIP code."),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("").transform(() => undefined))
    .refine((d) => !d || d >= new Date(Date.now() - 86400_000).toISOString().slice(0, 10), "Please choose today or a future date."),
  preferredTime: z.enum(["asap", "morning", "afternoon", "evening"]).optional().or(z.literal("").transform(() => undefined)),
  message: cleanText(2000).optional(),
  subject: cleanText(150).optional(),
  // Abuse protection
  company: z.string().max(200).optional(), // honeypot
  startedAt: z.number().int().optional(),
  submissionKey: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/).optional(),
  captchaToken: z.string().max(4000).optional(),
  attribution: attributionSchema,
});

export type LeadInput = z.infer<typeof leadInputSchema>;

export type LeadResult = { referenceId: string; duplicate?: boolean; discarded?: boolean };

const newReference = () => `SR-${randomToken(6).replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase().padEnd(6, "X")}`;

/** Creates a lead from a website form. Spam is silently discarded; duplicates return the original reference. */
export async function createLeadFromForm(input: LeadInput, meta: { ip: string; userAgent?: string }): Promise<LeadResult> {
  // 1) Bot traps → pretend success, store nothing
  const tooFast = typeof input.startedAt === "number" && Date.now() - input.startedAt < MIN_FILL_MS;
  if (input.company || tooFast) {
    logger.info({ reason: input.company ? "honeypot" : "too_fast" }, "lead discarded as spam");
    return { referenceId: newReference(), discarded: true };
  }

  // 2) Idempotency — the same form submit retried
  if (input.submissionKey) {
    const existing = await prisma.lead.findUnique({ where: { submissionKey: input.submissionKey }, select: { referenceId: true } });
    if (existing) return { referenceId: existing.referenceId, duplicate: true };
  }

  // 3) Near-duplicate (double clicks, re-submits from another tab)
  const dedupeHash = hmac(`${input.phone}|${input.serviceSlug}|${(input.message ?? "").toLowerCase().replace(/\s+/g, " ")}`);
  const recent = await prisma.lead.findFirst({
    where: { dedupeHash, createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MIN * 60_000) } },
    select: { referenceId: true },
  });
  if (recent) return { referenceId: recent.referenceId, duplicate: true };

  const service = input.serviceSlug === "other" ? null : await prisma.service.findFirst({ where: { slug: input.serviceSlug, deletedAt: null }, select: { id: true, name: true } });
  if (input.serviceSlug !== "other" && !service) {
    throw Object.assign(new Error("invalid service"), { field: "serviceSlug" });
  }

  const a = input.attribution;
  const source = input.formType === "contact" ? LeadSource.CONTACT_FORM : LeadSource.SERVICE_REQUEST_FORM;
  const lead = await prisma.lead.create({
    data: {
      referenceId: newReference(),
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      serviceId: service?.id ?? null,
      serviceLabel: service ? null : "Other / Not sure",
      zip: input.zip,
      preferredDate: input.preferredDate ? new Date(`${input.preferredDate}T00:00:00Z`) : null,
      preferredTime: input.preferredTime ? (input.preferredTime.toUpperCase() as PreferredTime) : null,
      message: input.message || null,
      source,
      landingPage: a.landingPage,
      sourcePath: a.sourcePath,
      referrer: a.referrer,
      utmSource: a.utmSource,
      utmMedium: a.utmMedium,
      utmCampaign: a.utmCampaign,
      utmTerm: a.utmTerm,
      utmContent: a.utmContent,
      deviceType: (a.deviceType ?? "UNKNOWN") as DeviceType,
      ipHash: hmac(meta.ip),
      userAgent: meta.userAgent?.slice(0, 300),
      submissionKey: input.submissionKey,
      dedupeHash,
      events: { create: { type: "CREATED", toStatus: "NEW", detail: source } },
      ...(source === LeadSource.CONTACT_FORM ? { contactMessage: { create: { subject: input.subject, message: input.message || "(no message)" } } } : {}),
    },
  });

  background(notifyNewLead(lead.referenceId, input, service?.name ?? "Other / Not sure"));
  return { referenceId: lead.referenceId };
}

async function notifyNewLead(ref: string, input: LeadInput, serviceName: string) {
  const setting = await prisma.systemSetting.findUnique({ where: { key: "leadNotifications" } });
  const configured = (setting?.value as { emails?: string[] } | null)?.emails ?? [];
  const to = [...configured, ...env.LEAD_NOTIFY_EMAILS.split(",").map((s) => s.trim())].filter(Boolean);
  if (!to.length) return;
  await sendMail(
    to,
    `New lead ${ref}: ${serviceName} (${input.zip})`,
    [`Reference: ${ref}`, `Name: ${input.name}`, `Phone: ${input.phone}`, `Email: ${input.email ?? "-"}`, `Service: ${serviceName}`, `ZIP: ${input.zip}`, `Preferred: ${input.preferredDate ?? "-"} ${input.preferredTime ?? ""}`, "", input.message ?? ""].join("\n"),
  );
}
