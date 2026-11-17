import "server-only";
import type { BlogPost, BlogPostSummary, Service, ServiceSummary } from "@/types";
import type { ContentApi, PostQuery } from "../types";
import { readingMinutes } from "@/lib/utils";
import { siteSettings, homeFaqs } from "./data/site";
import { services } from "./data/services";
import { locations } from "./data/locations";
import { authors, blogCategories, blogPosts } from "./data/blog";

/**
 * MOCK PROVIDER — in-memory data used until the Phase 2 backend exists.
 * Keep this file free of UI concerns; it should behave like the real API would.
 */

const byDateDesc = (a: BlogPost, b: BlogPost) => b.publishedAt.localeCompare(a.publishedAt);

function toServiceSummary(s: Service): ServiceSummary {
  const { id, slug, name, category, icon, shortDescription, path, isEmergency, isFeatured, sortOrder } = s;
  return { id, slug, name, category, icon, shortDescription, path, isEmergency, isFeatured, sortOrder };
}

function toPostSummary(p: BlogPost): BlogPostSummary {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    categorySlug: p.categorySlug,
    publishedAt: p.publishedAt,
    featuredImage: p.featuredImage,
    isFeatured: p.isFeatured,
    isPopular: p.isPopular,
    readingMinutes: readingMinutes(p),
    authorName: authors.find((a) => a.id === p.authorId)?.name ?? "",
  };
}

export const mockApi: ContentApi = {
  async getSiteSettings() {
    return siteSettings;
  },

  async listServices() {
    return [...services].sort((a, b) => a.sortOrder - b.sortOrder).map(toServiceSummary);
  },
  async getService(slug) {
    return services.find((s) => s.slug === slug) ?? null;
  },

  async listLocations() {
    return locations
      .filter((l) => l.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ id, slug, city, stateCode, stateName, nearbyAreas }) => ({ id, slug, city, stateCode, stateName, nearbyAreas }));
  },
  async getLocation(slug) {
    return locations.find((l) => l.slug === slug && l.isActive) ?? null;
  },

  async listPosts({ page = 1, pageSize = 6, category, q }: PostQuery = {}) {
    let items = [...blogPosts].sort(byDateDesc);
    if (category) items = items.filter((p) => p.categorySlug === category);
    if (q) {
      const needle = q.trim().toLowerCase();
      items = items.filter((p) =>
        [p.title, p.excerpt, p.intro, ...p.tags, p.seo.primaryKeyword].some((t) => t.toLowerCase().includes(needle)),
      );
    }
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(Math.max(1, page), totalPages);
    return {
      items: items.slice((current - 1) * pageSize, current * pageSize).map(toPostSummary),
      page: current,
      pageSize,
      total,
      totalPages,
    };
  },
  async listAllPostSlugs() {
    return blogPosts.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt ?? p.publishedAt }));
  },
  async getPost(slug) {
    const post = blogPosts.find((p) => p.slug === slug);
    return post ? { ...post, readingMinutes: readingMinutes(post) } : null;
  },
  async getPostsBySlugs(slugs) {
    return slugs.map((s) => blogPosts.find((p) => p.slug === s)).filter((p): p is BlogPost => Boolean(p)).map(toPostSummary);
  },
  async listFeaturedPosts() {
    return blogPosts.filter((p) => p.isFeatured).sort(byDateDesc).map(toPostSummary);
  },
  async listPopularPosts(limit = 4) {
    return blogPosts.filter((p) => p.isPopular).sort(byDateDesc).slice(0, limit).map(toPostSummary);
  },
  async listRelatedPosts(slug, limit = 3) {
    const post = blogPosts.find((p) => p.slug === slug);
    if (!post) return [];
    const score = (p: BlogPost) =>
      (p.categorySlug === post.categorySlug ? 2 : 0) +
      p.relatedServiceSlugs.filter((s) => post.relatedServiceSlugs.includes(s)).length;
    return blogPosts
      .filter((p) => p.slug !== slug)
      .sort((a, b) => score(b) - score(a) || byDateDesc(a, b))
      .slice(0, limit)
      .map(toPostSummary);
  },
  async listCategories() {
    return blogCategories;
  },
  async getAuthor(id) {
    return authors.find((a) => a.id === id) ?? null;
  },

  // CMS pages live in the database (Phase 2). In mock mode the website renders its built-in templates.
  async getPage() {
    return null;
  },
  async listPageSlugs() {
    return [];
  },
  async listFaqs(group) {
    return group === "home" ? homeFaqs : [];
  },
  // No testimonials in mock mode — never ship fake reviews.
  async listTestimonials() {
    return [];
  },
  async listRedirects() {
    return [];
  },
  async getRobots() {
    return { allowIndexing: true, disallow: ["/api/"] };
  },
};
