import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { pageMetadata, seoOverrides } from "@/lib/seo";
import { CmsPageView } from "@/components/sections/CmsPageView";

/**
 * Custom pages created in Admin → Pages are served at /{slug}.
 * Built-in routes (/services, /blog, /contact, legal pages…) always take precedence.
 */
type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = true;

export async function generateStaticParams() {
  const builtIn = new Set(["privacy-policy", "terms-and-conditions", "disclaimer", "about"]);
  return (await api.listPageSlugs()).filter((p) => !builtIn.has(p.slug)).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = await api.getPage(slug);
  if (!page) return {};
  return pageMetadata({ title: page.seo.metaTitle, description: page.seo.metaDescription, path: `/${slug}`, ...seoOverrides(page.seo) });
}

export default async function CmsRoute({ params }: Params) {
  const { slug } = await params;
  const page = await api.getPage(slug);
  if (!page) notFound();
  return <CmsPageView page={page} path={`/${slug}`} />;
}
