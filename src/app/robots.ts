import type { MetadataRoute } from "next";
import { api } from "@/lib/api";
import { absoluteUrl, SITE_URL } from "@/lib/seo";

/** robots.txt — indexing switch and disallowed paths are managed in Admin → System. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  // Never index preview/staging deployments, whatever the CMS says.
  const isProd = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : process.env.NODE_ENV === "production";
  const cfg = await api.getRobots().catch(() => ({ allowIndexing: true, disallow: ["/api/"] }));
  if (!isProd || !cfg.allowIndexing) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...new Set(["/api/", "/blog?q=", ...cfg.disallow])] },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
