import "server-only";
import { unstable_cache } from "next/cache";
import * as pub from "../../../backend/src/modules/public.service";
import type { ContentApi } from "./types";

/**
 * DIRECT PROVIDER — the website reads the database in-process through the backend's
 * public service (same code the REST API uses). No HTTP hop, no API key, and pages can be
 * built without a running API. Used whenever DATABASE_URL is set.
 *
 * Results are cached (ISR) under the "content" tag; the backend purges it via
 * /api/revalidate after every admin edit, so changes show up immediately.
 */

const REVALIDATE = Number(process.env.CONTENT_REVALIDATE_SECONDS ?? 300);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cached<A extends any[], R>(name: string, fn: (...args: A) => Promise<R>) {
  return (...args: A) => unstable_cache(() => fn(...args), ["content", name, JSON.stringify(args)], { tags: ["content"], revalidate: REVALIDATE })();
}

export const directApi = {
  getSiteSettings: cached("settings", pub.getSettings),
  listServices: cached("services", pub.listServices),
  getService: cached("service", pub.getService),
  listLocations: cached("locations", pub.listLocations),
  getLocation: cached("location", pub.getLocation),
  listPosts: cached("posts", (q = {}) => pub.listPosts(q)),
  listAllPostSlugs: cached("post-slugs", pub.listPostSlugs),
  getPost: cached("post", pub.getPost),
  getPostsBySlugs: cached("posts-by-slug", pub.getPostsBySlugs),
  listFeaturedPosts: cached("featured", pub.listFeaturedPosts),
  listPopularPosts: cached("popular", (limit = 4) => pub.listPopularPosts(limit)),
  listRelatedPosts: cached("related", (slug: string, limit = 3) => pub.listRelatedPosts(slug, limit)),
  listCategories: cached("categories", pub.listBlogCategories),
  getAuthor: cached("author", pub.getAuthor),
  getPage: cached("page", pub.getPage),
  listPageSlugs: cached("page-slugs", pub.listPageSlugs),
  listFaqs: cached("faqs", pub.listFaqs),
  listTestimonials: cached("testimonials", pub.listTestimonials),
  listRedirects: cached("redirects", pub.listRedirects),
  getRobots: cached("robots", pub.getRobots),
} as unknown as ContentApi;
