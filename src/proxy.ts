import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

/**
 * Applies redirects managed in Admin → Redirects before any page renders.
 * The rule list comes from the API — this same server's /api/v1, or a separately hosted
 * backend if BACKEND_API_URL is set — and is cached in memory for 60 seconds.
 * No database/backend configured → no-op.
 */

type Rule = { source: string; destination: string; statusCode: number };

const TTL_MS = 60_000;
let cache: { at: number; rules: Map<string, Rule> } | null = null;

const apiKey = () => process.env.BACKEND_API_KEY ?? process.env.PUBLIC_API_KEY ?? "";
/** The API lives on this same server unless a separate backend URL is configured. */
const apiBase = (req: NextRequest) => process.env.BACKEND_API_URL?.replace(/\/$/, "") || (process.env.DATABASE_URL ? req.nextUrl.origin : "");

async function rules(base: string): Promise<Map<string, Rule>> {
  if (!base) return new Map();
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rules;
  try {
    const res = await fetch(`${base}/api/v1/public/redirects`, {
      headers: { Authorization: `Bearer ${apiKey()}` },
      signal: AbortSignal.timeout(2000),
      cache: "no-store",
    });
    const json = (await res.json()) as { data?: Rule[] };
    const map = new Map((json.data ?? []).map((r) => [r.source.replace(/\/$/, "") || "/", r]));
    cache = { at: Date.now(), rules: map };
    return map;
  } catch {
    return cache?.rules ?? new Map(); // API unreachable → keep serving the site
  }
}

export async function proxy(req: NextRequest, event: NextFetchEvent) {
  const path = req.nextUrl.pathname.replace(/\/$/, "") || "/";
  const base = apiBase(req);
  const rule = (await rules(base)).get(path);
  if (!rule) return NextResponse.next();
  // Count the hit for Admin → Redirects (fire-and-forget; never delays the redirect)
  event.waitUntil(
    fetch(`${base}/api/v1/public/redirects/hit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey()}` },
      body: JSON.stringify({ source: rule.source }),
      signal: AbortSignal.timeout(2000),
    }).catch(() => undefined),
  );
  const dest = rule.destination.startsWith("/") ? new URL(rule.destination, req.url) : new URL(rule.destination);
  return NextResponse.redirect(dest, rule.statusCode);
}

export const config = {
  // Skip framework assets, API routes, the admin panel, media and files with extensions
  matcher: ["/((?!_next/|api/|admin|media/|.*\\.[a-zA-Z0-9]+$).*)"],
};
