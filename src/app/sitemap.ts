import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { absoluteUrl } from "@/lib/seo";
import { servicePath } from "@/lib/utils";

/** XML sitemap at /sitemap.xml — generated from live content so new admin entries appear automatically. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, locations, posts, categories, pages] = await Promise.all([
    api.listServices(),
    api.listLocations(),
    api.listAllPostSlugs(),
    api.listCategories(),
    api.listPageSlugs(),
  ]);
  const builtIn = new Set(["privacy-policy", "terms-and-conditions", "disclaimer", "about"]);
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/emergency-plumbing"), changeFrequency: "monthly", priority: 0.95 },
    { url: absoluteUrl("/services"), changeFrequency: "monthly", priority: 0.9 },
    { url: absoluteUrl("/service-areas"), changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/request-service"), changeFrequency: "yearly", priority: 0.7 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.6 },
    { url: absoluteUrl("/about"), changeFrequency: "yearly", priority: 0.5 },
    { url: absoluteUrl("/blog"), changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/privacy-policy"), changeFrequency: "yearly", priority: 0.1 },
    { url: absoluteUrl("/terms-and-conditions"), changeFrequency: "yearly", priority: 0.1 },
    { url: absoluteUrl("/disclaimer"), changeFrequency: "yearly", priority: 0.1 },
  ].map((e) => ({ ...e, lastModified: now }) as MetadataRoute.Sitemap[number]);

  return [
    ...staticPages,
    ...services.filter((s) => !s.path).map((s) => ({ url: absoluteUrl(servicePath(s)), lastModified: now, changeFrequency: "monthly" as const, priority: 0.9 })),
    ...locations.map((l) => ({ url: absoluteUrl(`/service-areas/${l.slug}`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...categories.map((c) => ({ url: absoluteUrl(`/blog?category=${c.slug}`), lastModified: now, changeFrequency: "weekly" as const, priority: 0.4 })),
    ...pages.filter((p) => !builtIn.has(p.slug)).map((p) => ({ url: absoluteUrl(`/${p.slug}`), lastModified: new Date(p.updatedAt), changeFrequency: "yearly" as const, priority: 0.3 })),
    ...posts.map((p) => ({ url: absoluteUrl(`/blog/${p.slug}`), lastModified: new Date(p.updatedAt), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
