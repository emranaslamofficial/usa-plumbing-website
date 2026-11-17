import type {
  CmsPage,
  Faq,
  RedirectRule,
  RobotsConfig,
  Testimonial,
  BlogCategory,
  BlogPost,
  BlogPostSummary,
  Author,
  Location,
  LocationSummary,
  Paginated,
  Service,
  ServiceSummary,
  SiteSettings,
} from "@/types";

export interface PostQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  q?: string;
}

/**
 * The contract every content provider (mock or real backend) must satisfy.
 * UI code depends ONLY on this interface — never on a concrete provider.
 */
export interface ContentApi {
  getSiteSettings(): Promise<SiteSettings>;

  listServices(): Promise<ServiceSummary[]>;
  getService(slug: string): Promise<Service | null>;

  listLocations(): Promise<LocationSummary[]>;
  getLocation(slug: string): Promise<Location | null>;

  listPosts(query?: PostQuery): Promise<Paginated<BlogPostSummary>>;
  listAllPostSlugs(): Promise<{ slug: string; updatedAt: string }[]>;
  getPost(slug: string): Promise<(BlogPost & { readingMinutes: number }) | null>;
  getPostsBySlugs(slugs: string[]): Promise<BlogPostSummary[]>;
  listFeaturedPosts(): Promise<BlogPostSummary[]>;
  listPopularPosts(limit?: number): Promise<BlogPostSummary[]>;
  listRelatedPosts(slug: string, limit?: number): Promise<BlogPostSummary[]>;
  listCategories(): Promise<BlogCategory[]>;
  getAuthor(id: string): Promise<Author | null>;

  /** CMS pages (legal pages and custom pages). null → not published. */
  getPage(slug: string): Promise<CmsPage | null>;
  listPageSlugs(): Promise<{ slug: string; updatedAt: string }[]>;
  /** FAQs attached to a named group, e.g. "home". */
  listFaqs(group: string): Promise<Faq[]>;
  /** Published, staff-verified customer reviews only. */
  listTestimonials(): Promise<Testimonial[]>;
  listRedirects(): Promise<RedirectRule[]>;
  getRobots(): Promise<RobotsConfig>;
}
