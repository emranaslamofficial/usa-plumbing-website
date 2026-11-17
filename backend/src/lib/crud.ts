import { Router, type Request } from "express";
import { z, type ZodObject, type ZodRawShape } from "zod";
import { prisma } from "../db";
import { requirePermission } from "../auth/session";
import type { PermissionKey } from "../auth/permissions";
import { created, notFound, ok, pageMeta } from "./http";
import { body, idParam, pagination, parse, slugify } from "./validate";
import { audit, diff } from "./audit";
import { assertSlugFree, revalidateSite } from "./content";

/**
 * Generic, permission-checked CRUD router for simple lookup tables
 * (categories, tags, FAQs, testimonials, redirects, phones, social links, navigation...).
 * Resources with workflows (services, posts, leads...) have dedicated routers.
 */
interface CrudOptions<S extends ZodRawShape> {
  model: string; // prisma delegate name
  entity: string; // audit label
  schema: ZodObject<S>;
  read: PermissionKey;
  write: PermissionKey;
  /** Fields matched by ?q= */
  searchFields?: string[];
  /** Query-string filters allowed for exact match, e.g. ["location", "group"] */
  filters?: string[];
  orderBy?: Record<string, "asc" | "desc">[];
  include?: Record<string, unknown>;
  /** If set, a missing slug is generated from this field and uniqueness is enforced. */
  slugFrom?: string;
  /** Called before create/update to enforce extra rules. */
  beforeSave?: (data: Record<string, unknown>, req: Request, id?: string) => Promise<void> | void;
  affectsSite?: boolean;
}

export function crudRouter<S extends ZodRawShape>(o: CrudOptions<S>) {
  const r = Router();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = (prisma as any)[o.model];
  const after = () => o.affectsSite !== false && revalidateSite();

  r.get("/", requirePermission(o.read), async (req, res) => {
    const q = parse(pagination.extend({ q: z.string().max(100).optional(), pageSize: z.coerce.number().int().min(1).max(500).default(100) }), req.query);
    const where: Record<string, unknown> = {};
    if (q.q && o.searchFields?.length) where.OR = o.searchFields.map((f) => ({ [f]: { contains: q.q, mode: "insensitive" } }));
    for (const f of o.filters ?? []) {
      const v = req.query[f];
      if (typeof v === "string" && v !== "") where[f] = v === "null" ? null : v === "true" ? true : v === "false" ? false : v;
    }
    const [items, total] = await Promise.all([
      db.findMany({ where, orderBy: o.orderBy ?? [{ createdAt: "desc" }], include: o.include, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
      db.count({ where }),
    ]);
    ok(res, items, pageMeta(q, total));
  });

  r.get("/:id", requirePermission(o.read), async (req, res) => {
    const { id } = parse(idParam, req.params);
    const item = await db.findUnique({ where: { id }, include: o.include });
    if (!item) throw notFound(o.entity);
    ok(res, item);
  });

  r.post("/", requirePermission(o.write), async (req, res) => {
    const data = body(req, o.schema) as Record<string, unknown>;
    if (o.slugFrom) {
      data.slug = (data.slug as string) || slugify(String(data[o.slugFrom] ?? ""));
      await assertSlugFree(o.model as never, data.slug as string);
    }
    await o.beforeSave?.(data, req);
    const item = await db.create({ data, include: o.include });
    await audit(req, "create", o.entity, item.id, { diff: diff(null, item) });
    after();
    created(res, item);
  });

  r.patch("/:id", requirePermission(o.write), async (req, res) => {
    const { id } = parse(idParam, req.params);
    const before = await db.findUnique({ where: { id } });
    if (!before) throw notFound(o.entity);
    const parsed = body(req, o.schema.partial()) as Record<string, unknown>;
    // .partial() still fills .default() values — keep only the keys the client actually sent
    const sent = new Set(Object.keys((req.body ?? {}) as object));
    const data = Object.fromEntries(Object.entries(parsed).filter(([k]) => sent.has(k)));
    if (o.slugFrom && typeof data.slug === "string") await assertSlugFree(o.model as never, data.slug, id);
    await o.beforeSave?.(data, req, id);
    const item = await db.update({ where: { id }, data, include: o.include });
    await audit(req, "update", o.entity, id, { diff: diff(before, item) });
    after();
    ok(res, item);
  });

  r.delete("/:id", requirePermission(o.write), async (req, res) => {
    const { id } = parse(idParam, req.params);
    const before = await db.findUnique({ where: { id } });
    if (!before) throw notFound(o.entity);
    await db.delete({ where: { id } });
    await audit(req, "delete", o.entity, id, { diff: diff(before, null) });
    after();
    ok(res, { deleted: true });
  });

  /** PUT /reorder { ids: [...] } — sets sortOrder by position */
  r.put("/reorder", requirePermission(o.write), async (req, res) => {
    const { ids } = body(req, z.object({ ids: z.array(z.string().max(40)).max(500) }));
    await prisma.$transaction(ids.map((id, i) => db.update({ where: { id }, data: { sortOrder: i } })));
    await audit(req, "reorder", o.entity, null);
    after();
    ok(res, { reordered: ids.length });
  });

  return r;
}
