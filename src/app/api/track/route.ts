import { NextResponse } from "next/server";
import { backendPost } from "@/lib/api/http";
import { clientIp } from "@/lib/request";

/**
 * POST /api/track — receives CTA click beacons from the browser and forwards them
 * server-to-server (the backend key never reaches the browser). Fire-and-forget.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (raw.length > 4000) return new NextResponse(null, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (process.env.DATABASE_URL) {
    try {
      const pub = await import("../../../../backend/src/modules/public.service");
      await pub.recordCtaClick(body, { ip: clientIp(req), userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? undefined });
    } catch {
      /* tracking must never break the site */
    }
  } else if (process.env.BACKEND_API_URL) {
    try {
      await backendPost("/track/cta", body, { "X-Client-IP": clientIp(req), "X-Client-User-Agent": req.headers.get("user-agent")?.slice(0, 300) ?? "" });
    } catch {
      /* tracking must never break the site */
    }
  }
  return new NextResponse(null, { status: 204 });
}
