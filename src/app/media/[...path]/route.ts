import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Serves images uploaded in the admin when they're stored on local disk (development /
 * self-hosting without Vercel Blob). On Vercel, uploads go to Blob storage and never hit this route.
 */
const TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif" };

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const root = path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.UPLOAD_DIR ?? "backend/uploads");
  const file = path.resolve(root, ...parts);
  const type = TYPES[path.extname(file).toLowerCase()];
  // Block path traversal and anything that isn't an image we produced
  if (!file.startsWith(root + path.sep) || !type) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(file);
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
