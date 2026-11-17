import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { prisma } from "../db";
import { env } from "../config/env";
import { requirePermission } from "../auth/session";
import { body, cleanText, idParam, pagination, parse } from "../lib/validate";
import { badRequest, created, notFound, ok, pageMeta, AppError } from "../lib/http";
import { audit } from "../lib/audit";
import { randomToken } from "../lib/crypto";
import { logger } from "../lib/logger";
import { put, del } from "@vercel/blob";

/**
 * Storage: Vercel Blob when BLOB_READ_WRITE_TOKEN is set (required on Vercel — function disks
 * are temporary), otherwise the local UPLOAD_DIR (served at /media). Returns the public URL.
 */
const useBlob = () => Boolean(env.BLOB_READ_WRITE_TOKEN);

async function storeFile(key: string, data: Buffer, contentType: string) {
  if (useBlob()) {
    const blob = await put(`media/${key}`, data, { access: "public", contentType, addRandomSuffix: false, cacheControlMaxAge: 31536000 });
    return blob.url;
  }
  const file = path.join(UPLOAD_ROOT, key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
  return `/media/${key}`;
}

async function removeFile(url: string) {
  if (/^https:\/\//.test(url)) await del(url).catch(() => undefined);
  else await unlink(path.join(UPLOAD_ROOT, url.replace(/^\/media\//, ""))).catch(() => undefined);
}

/**
 * Image uploads: JPEG, PNG, WebP, AVIF only. SVG is rejected (can carry scripts).
 * Every upload is checked by extension, declared MIME type AND magic bytes, then fully
 * decoded and re-encoded by sharp — which strips EXIF/GPS metadata and neutralizes
 * polyglot files. Responsive WebP variants are generated.
 */
export const mediaRouter = Router();

const ALLOWED = {
  "image/jpeg": { exts: [".jpg", ".jpeg"], format: "jpeg" },
  "image/png": { exts: [".png"], format: "png" },
  "image/webp": { exts: [".webp"], format: "webp" },
  "image/avif": { exts: [".avif"], format: "avif" },
} as const;
type Mime = keyof typeof ALLOWED;

const VARIANT_WIDTHS = [480, 960, 1600];
const MAX_PIXELS = 50_000_000;

export const UPLOAD_ROOT = path.resolve(env.UPLOAD_DIR);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.UPLOAD_MAX_MB * 1024 * 1024, files: 1, fields: 5 },
  fileFilter: (_req, file, cb) => {
    const allowed = ALLOWED[file.mimetype as Mime];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed || !(allowed.exts as readonly string[]).includes(ext)) {
      return cb(new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "Only JPEG, PNG, WebP and AVIF images are allowed"));
    }
    cb(null, true);
  },
});

/** Magic-byte sniffing — never trust the client's declared type. */
function sniff(buf: Buffer): Mime | null {
  if (buf.length < 16) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  const brand = buf.toString("ascii", 4, 12);
  if (brand === "ftypavif" || brand === "ftypavis") return "image/avif";
  return null;
}

mediaRouter.get("/", requirePermission("content:read"), async (req, res) => {
  const q = parse(pagination.extend({ q: z.string().max(100).optional(), pageSize: z.coerce.number().int().min(1).max(200).default(48) }), req.query);
  const where = { deletedAt: null, ...(q.q ? { OR: [{ originalName: { contains: q.q, mode: "insensitive" as const } }, { alt: { contains: q.q, mode: "insensitive" as const } }] } : {}) };
  const [items, total] = await Promise.all([
    prisma.media.findMany({ where, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    prisma.media.count({ where }),
  ]);
  ok(res, items, pageMeta(q, total));
});

mediaRouter.post("/", requirePermission("media:write"), upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) throw badRequest("No file uploaded (field name must be 'file')");
  const { alt } = parse(z.object({ alt: cleanText(250).default("") }), req.body);

  const detected = sniff(file.buffer);
  if (!detected || detected !== file.mimetype) throw new AppError(415, "UNSUPPORTED_MEDIA_TYPE", "File content does not match an allowed image type");

  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    meta = await sharp(file.buffer, { limitInputPixels: MAX_PIXELS }).metadata();
  } catch {
    throw new AppError(415, "INVALID_IMAGE", "The image could not be read. It may be corrupted.");
  }
  if (!meta.width || !meta.height) throw new AppError(415, "INVALID_IMAGE", "The image has no dimensions");

  const now = new Date();
  const dir = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const id = randomToken(12).replace(/[^A-Za-z0-9]/g, "").slice(0, 16);
  const format = ALLOWED[detected].format;

  const written: string[] = [];
  try {
    // Re-encode original (auto-rotate, strip metadata)
    const base = sharp(file.buffer, { limitInputPixels: MAX_PIXELS }).rotate();
    const mainName = `${id}.${format === "jpeg" ? "jpg" : format}`;
    const main = await base.clone().toFormat(format, { quality: 85 }).toBuffer({ resolveWithObject: true });
    const mainUrl = await storeFile(`${dir}/${mainName}`, main.data, detected);
    written.push(mainUrl);

    const variants: { width: number; height: number; url: string; format: string }[] = [];
    for (const w of VARIANT_WIDTHS.filter((w) => w < main.info.width)) {
      const v = await base.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
      const name = `${id}-${w}.webp`;
      const url = await storeFile(`${dir}/${name}`, v.data, "image/webp");
      written.push(url);
      variants.push({ width: v.info.width, height: v.info.height, url, format: "webp" });
    }

    const media = await prisma.media.create({
      data: {
        url: mainUrl,
        storageKey: `${dir}/${id}`,
        originalName: path.basename(file.originalname).replace(/[^\w.\- ]/g, "_").slice(0, 200),
        mimeType: detected,
        sizeBytes: main.data.length,
        width: main.info.width,
        height: main.info.height,
        alt,
        variants,
        uploadedById: req.user!.id,
      },
    });
    await audit(req, "upload", "Media", media.id, { summary: media.originalName });
    created(res, media);
  } catch (err) {
    await Promise.all(written.map(removeFile));
    logger.error({ err }, "media processing failed");
    throw err instanceof AppError ? err : new AppError(500, "UPLOAD_FAILED", "Image processing failed");
  }
});

mediaRouter.patch("/:id", requirePermission("media:write"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const d = body(req, z.object({ alt: cleanText(250).optional(), title: cleanText(200).nullish() }));
  const media = await prisma.media.update({ where: { id }, data: d });
  ok(res, media);
});

mediaRouter.delete("/:id", requirePermission("media:write"), async (req, res) => {
  const { id } = parse(idParam, req.params);
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw notFound("Media");
  // Soft delete: references are nulled by FK rules only on hard delete; keep files for safety.
  await prisma.media.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit(req, "delete", "Media", id, { summary: media.originalName });
  ok(res, { deleted: true });
});
