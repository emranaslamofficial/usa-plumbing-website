import type { Response } from "express";
import { ZodError } from "zod";

/**
 * Consistent response envelope:
 *   success → { success: true, data, meta? }
 *   failure → { success: false, error: { code, message, details? } }
 */

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (message = "Bad request", details?: unknown) => new AppError(400, "BAD_REQUEST", message, details);
export const unauthorized = (message = "Authentication required") => new AppError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "You do not have permission to perform this action") => new AppError(403, "FORBIDDEN", message);
export const notFound = (what = "Resource") => new AppError(404, "NOT_FOUND", `${what} not found`);
export const conflict = (message: string, details?: unknown) => new AppError(409, "CONFLICT", message, details);
export const unprocessable = (message: string, details?: unknown) => new AppError(422, "VALIDATION_ERROR", message, details);

export function ok<T>(res: Response, data: T, meta?: Record<string, unknown>, status = 200) {
  return res.status(status).json(meta ? { success: true, data, meta } : { success: true, data });
}

export const created = <T>(res: Response, data: T) => ok(res, data, undefined, 201);

export const noContent = (res: Response) => res.status(204).end();

/** Flattens zod issues to { field: message } for forms. */
export function zodDetails(err: ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const key = i.path.join(".") || "_";
    if (!out[key]) out[key] = i.message;
  }
  return out;
}

export interface PageQuery {
  page: number;
  pageSize: number;
}

export function pageMeta(q: PageQuery, total: number) {
  return { page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)) };
}
