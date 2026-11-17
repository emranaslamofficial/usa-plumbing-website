import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

/**
 * Applies redirects managed in Admin → Redirects before any page renders.
 * The rule list is fetched from the backend and cached in memory for 60 seconds.
 * No backend configured → no-op.
 */

type Rule = { source: string; destination: string; statusCode: number };

const TTL_MS = 60_000;
let cache: { at: number; rules: Map<string, Rule> } | null = null;

async function rules(): Promise<Map<string, Rule>> {
  const base = process.env.BACKEND_API_URL?.replace(/\/$/, "");
  if (!base) return new Map();
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rules;
  try {
    const res = await fetch(`${base}/api/v1/public/redirects`, {
      headers: { Authorization: `Bearer ${process.env.BACKEND_API_KEY ?? ""}` },
      signal: AbortSignal.timeout(2000),
      cache: "no-store",
    });
    const json = (await res.json()) as { data?: Rule[] };
    const map = new Map((json.data ?? []).map((r) => [r.source.replace(/\/$/, "") || "/", r]));
    cache = { at: Date.now(), rules: map };
    return map;
  } catch {
    return cache?.rules ?? new Map(); // backend down → keep serving the site
  }
}

export async function proxy(req: NextRequest, event: NextFetchEvent) {
  const path = req.nextUrl.pathname.replace(/\/$/, "") || "/";
  const rule = (await rules()).get(path);
  if (!rule) return NextResponse.next();
  // Count the hit for Admin → Redirects (fire-and-forget; never delays the redirect)
  event.waitUntil(fetch(`${process.env.BACKEND_API_URL?.replace(/\/$/, "")}/api/v1/public/redirects/hit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.BACKEND_API_KEY ?? ""}` },
    body: JSON.stringify({ source: rule.source }),
    signal: AbortSignal.timeout(2000),
  }).catch(() => undefined));
  const dest = rule.destination.startsWith("/") ? new URL(rule.destination, req.url) : new URL(rule.destination);
  return NextResponse.redirect(dest, rule.statusCode);
}

export const config = {
  // Skip framework assets, API routes, media and files with extensions
  matcher: ["/((?!_next/|api/|media/|.*\\.[a-zA-Z0-9]+$).*)"],
};
