import type { Request } from "express";
import { prisma } from "../db.js";
import { logger } from "./logger.js";

const SENSITIVE = new Set(["passwordHash", "password", "twoFactorSecret", "tokenHash"]);

function scrub(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(scrub);
  return Object.fromEntries(Object.entries(value).filter(([k]) => !SENSITIVE.has(k)).map(([k, v]) => [k, scrub(v)]));
}

/** Shallow before/after diff of changed keys. */
export function diff(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  if (!before || !after) return scrub(after ?? before);
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (SENSITIVE.has(k) || k === "updatedAt") continue;
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) out[k] = { from: before[k], to: after[k] };
  }
  return out;
}

/** Records an admin action. Never throws — auditing must not break the request. */
export async function audit(
  req: Request,
  action: string,
  entity: string,
  entityId?: string | null,
  opts: { summary?: string; diff?: unknown } = {},
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        summary: opts.summary?.slice(0, 300),
        diff: (opts.diff ?? undefined) as never,
        ip: req.ip?.slice(0, 64),
        userAgent: req.get("user-agent")?.slice(0, 300),
      },
    });
  } catch (err) {
    logger.error({ err }, "audit log write failed");
  }
}
