import type { Request } from "express";
import { z, type ZodType } from "zod";
import { unprocessable, zodDetails } from "./http.js";

/** Parse + validate untrusted input. Throws a 422 with field errors on failure. */
export function parse<T extends ZodType>(schema: T, input: unknown): z.infer<T> {
  const r = schema.safeParse(input);
  if (!r.success) throw unprocessable("Please correct the highlighted fields.", zodDetails(r.error));
  return r.data;
}

export const body = <T extends ZodType>(req: Request, schema: T) => parse(schema, req.body);
export const query = <T extends ZodType>(req: Request, schema: T) => parse(schema, req.query);

// ── Reusable field schemas ──

/** Strips control chars and any HTML tags; content is always rendered as text by the frontend. */
export const cleanText = (max = 5000) =>
  z
    .string()
    .max(max)
    .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/<[^>]*>/g, "").trim());

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

/** Root-relative path or absolute http(s) URL. Blocks javascript:/data: URLs. */
export const safeHref = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v.startsWith("/") ? !v.startsWith("//") : /^https?:\/\//i.test(v) || /^(tel|mailto):/i.test(v), "Must be a /path, http(s) URL, tel: or mailto: link");

export const optionalUrl = z.string().trim().url().max(500).optional().nullable().or(z.literal("").transform(() => null));

export const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParam = z.object({ id: z.string().min(1).max(40) });

export const stringArray = (maxItems = 50, maxLen = 1000) => z.array(cleanText(maxLen)).max(maxItems);

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}
