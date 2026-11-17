import type { Metadata } from "next";
import type { BlogPost, Faq, Location, SeoFields, Service, SiteSettings } from "@/types";
import { servicePath } from "./utils";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const absoluteUrl = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

interface PageMetaInput {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
  /**
   * Use the title verbatim instead of appending " | Brand". Record-driven pages (services, locations,
   * posts) use this: their `seo.metaTitle` is the complete title, edited with a 60-char counter in the admin.
   */
  absoluteTitle?: boolean;
  /** CMS overrides */
  canonicalUrl?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
}

/** Spreads CMS SEO overrides (canonical, robots, OG) into pageMetadata(). */
export const seoOverrides = (seo: SeoFields) => ({
  canonicalUrl: seo.canonicalUrl,
  robots: seo.robots,
  ogTitle: seo.ogTitle,
  ogDescription: seo.ogDescription,
  ogImage: seo.ogImage,
  noIndex: seo.noIndex,
});

/** Custom JSON-LD entered in the CMS, with a default @context. */
export const customSchema = (seo: SeoFields) => (seo.schemaJson ? { "@context": "https://schema.org", ...seo.schemaJson } : null);

function robotsMeta(i: PageMetaInput): Metadata["robots"] {
  if (i.robots) {
    const [index, follow] = i.robots.split(",");
    return { index: index !== "noindex", follow: follow !== "nofollow" };
  }
  return i.noIndex ? { index: false, follow: true } : undefined;
}

/** Builds consistent metadata: canonical, Open Graph and Twitter/X cards. */
export function pageMetadata(i: PageMetaInput): Metadata {
  // Setting `openGraph` on a page replaces the inherited object, so always pass an image —
  // falling back to the site-wide generated /opengraph-image.
  const images = [{ url: i.ogImage ?? "/opengraph-image", width: 1200, height: 630 }];
  return {
    title: i.absoluteTitle ? { absolute: i.title } : i.title,
    description: i.description,
    alternates: { canonical: i.canonicalUrl || i.path },
    robots: robotsMeta(i),
    openGraph: {
      title: i.ogTitle || i.title,
      description: i.ogDescription || i.description,
      url: i.path,
      type: i.type ?? "website",
      images,
      ...(i.publishedTime ? { publishedTime: i.publishedTime, modifiedTime: i.modifiedTime ?? i.publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: i.ogTitle || i.title,
      description: i.ogDescription || i.description,
      images: images.map((im) => im.url),
    },
  };
}

/* ───────────────────────── JSON-LD builders ───────────────────────── */

const DAY_MAP: Record<string, string> = {
  Monday: "https://schema.org/Monday",
  Tuesday: "https://schema.org/Tuesday",
  Wednesday: "https://schema.org/Wednesday",
  Thursday: "https://schema.org/Thursday",
  Friday: "https://schema.org/Friday",
  Saturday: "https://schema.org/Saturday",
  Sunday: "https://schema.org/Sunday",
};

export const businessId = () => `${SITE_URL}/#business`;

/** Plumber is a schema.org subtype of LocalBusiness / HomeAndConstructionBusiness. */
export function plumberSchema(s: SiteSettings, areaServed: string[] = []) {
  return {
    "@context": "https://schema.org",
    "@type": "Plumber",
    "@id": businessId(),
    name: s.businessName,
    legalName: s.legalName,
    description: s.shortDescription,
    url: SITE_URL,
    telephone: s.phone.e164,
    email: s.email,
    priceRange: s.priceRange,
    image: absoluteUrl("/opengraph-image"),
    address: {
      "@type": "PostalAddress",
      streetAddress: s.address.street,
      addressLocality: s.address.city,
      addressRegion: s.address.region,
      postalCode: s.address.postalCode,
      addressCountry: s.address.country,
    },
    openingHoursSpecification: [
      ...s.openingHours.map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: h.days.map((d) => DAY_MAP[d] ?? d),
        opens: h.opens,
        closes: h.closes,
      })),
    ],
    ...(areaServed.length ? { areaServed: areaServed.map((name) => ({ "@type": "City", name })) } : {}),
    sameAs: s.social.map((x) => x.url),
  };
}

export function serviceSchema(service: Service, s: SiteSettings, areaServed: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    serviceType: service.name,
    description: service.seo.metaDescription,
    url: absoluteUrl(servicePath(service)),
    provider: { "@id": businessId(), "@type": "Plumber", name: s.businessName, telephone: s.phone.e164 },
    areaServed: areaServed.map((name) => ({ "@type": "City", name })),
  };
}

export function faqSchema(faqs: Faq[]) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") },
    })),
  };
}

export function articleSchema(post: BlogPost, authorName: string, s: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo.metaDescription,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    image: post.featuredImage ? absoluteUrl(post.featuredImage.src) : absoluteUrl(`/blog/${post.slug}/opengraph-image`),
    author: { "@type": "Organization", name: authorName, url: SITE_URL },
    publisher: { "@type": "Organization", "@id": businessId(), name: s.businessName, url: SITE_URL },
    keywords: [post.seo.primaryKeyword, ...post.seo.secondaryKeywords].join(", "),
  };
}

export function breadcrumbSchema(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.href),
    })),
  };
}

export function locationAreaNames(l: Pick<Location, "city" | "nearbyAreas">) {
  return [l.city, ...l.nearbyAreas];
}
