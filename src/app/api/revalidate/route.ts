import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";

/**
 * POST /api/revalidate — called by the Phase 2 admin panel after content changes
 * so edits appear immediately instead of waiting for the ISR window.
 *
 * Headers:  Authorization: Bearer <REVALIDATE_SECRET>
 * Body:     { "tags": ["services", "service:drain-cleaning"] }  or  { "paths": ["/services/drain-cleaning"] }
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { tags?: string[]; paths?: string[] };
  // expire: 0 → the next request renders fresh content immediately
  body.tags?.forEach((t) => revalidateTag(t, { expire: 0 }));
  body.paths?.forEach((p) => revalidatePath(p));
  return NextResponse.json({ ok: true, revalidated: { tags: body.tags ?? [], paths: body.paths ?? [] } });
}
