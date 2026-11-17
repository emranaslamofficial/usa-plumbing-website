import "server-only";
import type { ContentApi } from "./types";

/**
 * REAL BACKEND PROVIDER (Phase 2) — talks to backend/ (Express + PostgreSQL).
 * Activated automatically when BACKEND_API_URL is set. Runs on the server only,
 * so BACKEND_API_KEY is never shipped to the browser.
 *
 * Every response is the backend envelope { success, data } — this client unwraps `data`.
 * Endpoint reference: docs/BACKEND.md → "Public API".
 */

const BASE = process.env.BACKEND_API_URL?.replace(/\/$/, "") ?? "";
const KEY = process.env.BACKEND_API_KEY ?? "";
const REVALIDATE = Number(process.env.CONTENT_REVALIDATE_SECONDS ?? 300);

class BackendError extends Error {
  constructor(public status: number, path: string) {
    super(`Backend ${status} for ${path}`);
  }
}

async function get<T>(path: string, params?: Record<string, string | number | undefined>, tags: string[] = []): Promise<T> {
  const url = new URL(`${BASE}/api/v1/public${path}`);
  Object.entries(params ?? {}).forEach(([k, v]) => v !== undefined && v !== "" && url.searchParams.set(k, String(v)));
  const res = await fetch(url, {
    headers: { Accept: "application/json", Authorization: `Bearer ${KEY}` },
    // ISR: cached and revalidated; the admin panel purges the "content" tag via /api/revalidate after edits.
    next: { revalidate: REVALIDATE, tags: ["content", ...tags] },
  });
  if (!res.ok) throw new BackendError(res.status, url.pathname);
  const json = (await res.json()) as { success: boolean; data: T };
  return json.data;
}

/** Returns null on 404 instead of throwing — used for detail pages. */
async function getOrNull<T>(path: string, tags: string[] = []): Promise<T | null> {
  try {
    return await get<T>(path, undefined, tags);
  } catch (e) {
    if (e instanceof BackendError && e.status === 404) return null;
    throw e;
  }
}

const enc = encodeURIComponent;

export const httpApi: ContentApi = {
  getSiteSettings: () => get("/settings", undefined, ["settings"]),

  listServices: () => get("/services", undefined, ["services"]),
  getService: (slug) => getOrNull(`/services/${enc(slug)}`, ["services"]),

  listLocations: () => get("/locations", undefined, ["locations"]),
  getLocation: (slug) => getOrNull(`/locations/${enc(slug)}`, ["locations"]),

  listPosts: (q = {}) => get("/posts", { page: q.page, pageSize: q.pageSize, category: q.category, q: q.q }, ["posts"]),
  listAllPostSlugs: () => get("/posts/slugs", undefined, ["posts"]),
  getPost: (slug) => getOrNull(`/posts/${enc(slug)}`, ["posts"]),
  getPostsBySlugs: async (slugs) => (slugs.length ? (await get<{ items: never[] }>("/posts", { slugs: slugs.join(",") }, ["posts"])).items : []),
  listFeaturedPosts: () => get("/posts/featured", undefined, ["posts"]),
  listPopularPosts: (limit = 4) => get("/posts/popular", { limit }, ["posts"]),
  listRelatedPosts: (slug, limit = 3) => get(`/posts/${enc(slug)}/related`, { limit }, ["posts"]),
  listCategories: () => get("/blog-categories", undefined, ["posts"]),
  getAuthor: (id) => getOrNull(`/authors/${enc(id)}`, ["posts"]),

  getPage: (slug) => getOrNull(`/pages/${enc(slug)}`, ["pages"]),
  listPageSlugs: () => get("/pages", undefined, ["pages"]),
  listFaqs: (group) => get("/faqs", { group }, ["faqs"]),
  listTestimonials: () => get("/testimonials", undefined, ["testimonials"]),
  listRedirects: () => get("/redirects", undefined, ["redirects"]),
  getRobots: () => get("/robots", undefined, ["settings"]),
};

/** Server-to-server POST helper for leads & tracking (never cached). */
export async function backendPost<T>(path: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(`${BASE}/api/v1/public${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}`, ...headers },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: T; error?: { code: string; message: string; details?: Record<string, string> } };
  return { status: res.status, ...json };
}
