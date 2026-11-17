import { Router } from "express";
import { z } from "zod";
import { prisma, LeadStatus, LeadSource, type Prisma } from "../db.js";
import { requirePermission } from "../auth/session.js";
import { body, cleanText, idParam, pagination, parse } from "../lib/validate.js";
import { created, notFound, ok, pageMeta } from "../lib/http.js";
import { audit } from "../lib/audit.js";

export const leadsRouter = Router();
export const contactMessagesRouter = Router();

const listQuery = pagination.extend({
  q: z.string().trim().max(100).optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  source: z.nativeEnum(LeadSource).optional(),
  serviceId: z.string().max(40).optional(),
  assignedToId: z.string().max(40).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z.enum(["createdAt", "name", "status", "zip"]).default("createdAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
});

function whereFrom(q: z.infer<typeof listQuery>): Prisma.LeadWhereInput {
  const digits = q.q?.replace(/\D/g, "");
  return {
    deletedAt: null,
    ...(q.status ? { status: q.status } : {}),
    ...(q.source ? { source: q.source } : {}),
    ...(q.serviceId ? { serviceId: q.serviceId } : {}),
    ...(q.assignedToId ? { assignedToId: q.assignedToId === "none" ? null : q.assignedToId } : {}),
    ...(q.from || q.to ? { createdAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } } : {}),
    ...(q.q
      ? {
          OR: [
            { name: { contains: q.q, mode: "insensitive" } },
            { email: { contains: q.q, mode: "insensitive" } },
            { referenceId: { contains: q.q, mode: "insensitive" } },
            { zip: { startsWith: q.q } },
            ...(digits && digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
          ],
        }
      : {}),
  };
}

leadsRouter.get("/", requirePermission("leads:read"), async (req, res) => {
  const q = parse(listQuery, req.query);
  const where = whereFrom(q);
  const [items, total, counts] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { [q.sort]: q.dir },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      include: { service: { select: { name: true } }, assignedTo: { select: { id: true, name: true } } },
    }),
    prisma.lead.count({ where }),
    prisma.lead.groupBy({ by: ["status"], where: { deletedAt: null }, _count: true }),
  ]);
  ok(res, items, { ...pageMeta(q, total), statusCounts: Object.fromEntries(counts.map((c) => [c.status, c._count])) });
});

/** CSV export with the same filters as the list. */
leadsRouter.get("/export", requirePermission("leads:export"), async (req, res) => {
  const q = parse(listQuery, req.query);
  const items = await prisma.lead.findMany({ where: whereFrom(q), orderBy: { createdAt: "desc" }, take: 10000, include: { service: { select: { name: true } }, assignedTo: { select: { name: true } } } });
  const cols = ["referenceId", "createdAt", "status", "name", "phone", "email", "service", "zip", "preferredDate", "preferredTime", "message", "source", "landingPage", "referrer", "utmSource", "utmMedium", "utmCampaign", "utmTerm", "utmContent", "deviceType", "assignedTo"] as const;
  // Escape quotes and neutralize spreadsheet formula injection (=, +, -, @)
  const cell = (v: unknown) => {
    let s = v instanceof Date ? v.toISOString() : v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const rows = items.map((l) =>
    cols.map((c) => cell(c === "service" ? (l.service?.name ?? l.serviceLabel) : c === "assignedTo" ? l.assignedTo?.name : (l as Record<string, unknown>)[c])).join(","),
  );
  await audit(req, "export", "Lead", null, { summary: `${items.length} leads` });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send([cols.join(","), ...rows].join("\r\n"));
});

leadsRouter.get("/:id", requirePermission("leads:read"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const lead = await prisma.lead.findFirst({
    where: { id, deletedAt: null },
    include: {
      service: { select: { id: true, name: true, slug: true } },
      assignedTo: { select: { id: true, name: true } },
      contactMessage: true,
      notes: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
      events: { orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } },
    },
  });
  if (!lead) throw notFound("Lead");
  if (lead.contactMessage && !lead.contactMessage.isRead) await prisma.contactMessage.update({ where: { id: lead.contactMessage.id }, data: { isRead: true } });
  const { ipHash: _ip, dedupeHash: _d, submissionKey: _s, ...safe } = lead;
  ok(res, safe);
});

leadsRouter.patch("/:id", requirePermission("leads:write"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const d = body(req, z.object({ status: z.nativeEnum(LeadStatus).optional(), assignedToId: z.string().max(40).nullable().optional() }));
  const before = await prisma.lead.findFirst({ where: { id, deletedAt: null } });
  if (!before) throw notFound("Lead");
  const events: Prisma.LeadEventCreateManyLeadInput[] = [];
  if (d.status && d.status !== before.status) events.push({ type: "STATUS_CHANGED", fromStatus: before.status, toStatus: d.status, actorId: req.user!.id });
  if (d.assignedToId !== undefined && d.assignedToId !== before.assignedToId) {
    const assignee = d.assignedToId ? await prisma.user.findUnique({ where: { id: d.assignedToId }, select: { name: true } }) : null;
    events.push({ type: "ASSIGNED", detail: assignee?.name ?? "Unassigned", actorId: req.user!.id });
  }
  const lead = await prisma.lead.update({ where: { id }, data: { ...d, events: { createMany: { data: events } } } });
  await audit(req, "update", "Lead", id, { summary: `${lead.referenceId} ${events.map((e) => e.type).join(", ")}` });
  ok(res, lead);
});

leadsRouter.post("/:id/notes", requirePermission("leads:write"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const { body: text } = body(req, z.object({ body: cleanText(4000).pipe(z.string().min(1)) }));
  const note = await prisma.leadNote.create({ data: { leadId: id, authorId: req.user!.id, body: text }, include: { author: { select: { name: true } } } });
  await prisma.leadEvent.create({ data: { leadId: id, type: "NOTE_ADDED", actorId: req.user!.id } });
  created(res, note);
});

leadsRouter.delete("/:id", requirePermission("leads:delete"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const lead = await prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit(req, "delete", "Lead", id, { summary: lead.referenceId });
  ok(res, { deleted: true });
});

/** Manual lead entry (e.g. a phone call that was actually answered by staff). */
leadsRouter.post("/", requirePermission("leads:write"), async (req, res) => {
  const d = body(
    req,
    z.object({
      name: cleanText(100).pipe(z.string().min(2)),
      phone: z.string().transform((p) => p.replace(/\D/g, "").slice(-10)).pipe(z.string().length(10)),
      email: z.string().email().optional(),
      serviceId: z.string().max(40).optional(),
      zip: z.string().regex(/^\d{5}$/),
      message: cleanText(2000).optional(),
      source: z.enum(["PHONE", "MANUAL"]).default("PHONE"),
    }),
  );
  const { randomToken, hmac } = await import("../lib/crypto.js");
  const lead = await prisma.lead.create({
    data: {
      ...d,
      referenceId: `SR-${randomToken(6).replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase()}`,
      dedupeHash: hmac(`${d.phone}|manual|${Date.now()}`),
      events: { create: { type: "CREATED", toStatus: "NEW", detail: d.source, actorId: req.user!.id } },
    },
  });
  await audit(req, "create", "Lead", lead.id, { summary: lead.referenceId });
  created(res, lead);
});

// ── Contact messages (each one is linked to a lead) ──

contactMessagesRouter.get("/", requirePermission("leads:read"), async (req, res) => {
  const q = parse(pagination.extend({ unread: z.enum(["true", "false"]).optional() }), req.query);
  const where = { lead: { deletedAt: null }, ...(q.unread === "true" ? { isRead: false } : {}) };
  const [items, total] = await Promise.all([
    prisma.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize, include: { lead: { select: { id: true, referenceId: true, name: true, phone: true, email: true, status: true } } } }),
    prisma.contactMessage.count({ where }),
  ]);
  ok(res, items, pageMeta(q, total));
});
