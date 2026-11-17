/**
 * Domain types shared by the UI, the mock data layer and the Phase 2 HTTP client.
 * The backend API should return JSON matching these shapes (see docs/BACKEND-API.md).
 */

export type IconName =
  | "siren"
  | "drain"
  | "sewer"
  | "jet"
  | "flame"
  | "heater"
  | "tankless"
  | "search"
  | "pipe"
  | "slab"
  | "toilet"
  | "faucet"
  | "disposal"
  | "gas"
  | "softener"
  | "bath"
  | "building"
  | "home"
  | "shield"
  | "clock"
  | "users"
  | "receipt"
  | "wrench";

export interface SeoFields {
  /** <title> — keep under ~60 characters. */
  metaTitle: string;
  /** Meta description — keep under ~155 characters. */
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  /** Optional absolute or root-relative OG image override. */
  ogImage?: string;
  /** Set to true to emit noindex for this page. */
  noIndex?: boolean;
  /** Full robots directive from the CMS, e.g. "noindex,follow". */
  robots?: string;
  /** Absolute canonical URL override. */
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  /** Extra JSON-LD merged into the page's structured data. */
  schemaJson?: Record<string, unknown>;
}

export interface Faq {
  question: string;
  answer: string;
}

/** Category slug — categories are managed in the admin panel. */
export type ServiceCategory = string;

export interface ServiceFeature {
  title: string;
  description: string;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  category: ServiceCategory;
  icon: IconName;
  /** One–two sentence summary used on cards. */
  shortDescription: string;
  h1: string;
  /** Intro paragraphs at the top of the service page. */
  intro: string[];
  signsTitle: string;
  signs: string[];
  featuresTitle: string;
  features: ServiceFeature[];
  faqs: Faq[];
  relatedServiceSlugs: string[];
  relatedPostSlugs: string[];
  /** Override the canonical path (e.g. emergency plumbing lives at /emergency-plumbing). */
  path?: string;
  image?: { src: string; alt: string; width?: number; height?: number };
  ctaHeading?: string;
  ctaText?: string;
  isFeatured: boolean;
  isEmergency?: boolean;
  sortOrder: number;
  seo: SeoFields;
}

export type ServiceSummary = Pick<
  Service,
  "id" | "slug" | "name" | "category" | "icon" | "shortDescription" | "path" | "isEmergency" | "isFeatured" | "sortOrder"
>;

export interface Location {
  id: string;
  slug: string;
  city: string;
  stateCode: string;
  stateName: string;
  /** Unique, locally relevant copy — required to avoid thin "doorway" pages. */
  intro: string[];
  localConsiderations: ServiceFeature[];
  nearbyAreas: string[];
  zipCodes: string[];
  featuredServiceSlugs: string[];
  /** Services offered in this area (empty = all services). */
  serviceSlugs?: string[];
  description?: string;
  faqs: Faq[];
  geo?: { lat: number; lng: number };
  isActive: boolean;
  sortOrder: number;
  seo: SeoFields;
}

export type LocationSummary = Pick<Location, "id" | "slug" | "city" | "stateCode" | "stateName" | "nearbyAreas">;

export interface Author {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar?: string;
}

export interface BlogCategory {
  slug: string;
  name: string;
  description: string;
}

/** Structured article body. A CMS can map rich text to these blocks. Inline `[text](/url)` links are supported in text. */
export type ContentBlock =
  | { type: "h2"; id: string; text: string }
  | { type: "h3"; id: string; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "callout"; variant: "tip" | "warning" | "info"; title?: string; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "table"; caption?: string; headers: string[]; rows: string[][] }
  | { type: "image"; mediaId?: string; src: string; alt: string; width?: number; height?: number; caption?: string };

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  categorySlug: string;
  authorId: string;
  publishedAt: string; // ISO date
  updatedAt?: string; // ISO date
  featuredImage?: { src: string; alt: string; width?: number; height?: number };
  intro: string;
  body: ContentBlock[];
  faqs: Faq[];
  relatedServiceSlugs: string[];
  tags: string[];
  isFeatured: boolean;
  /** Editorial flag managed in the admin panel (not a fabricated view count). */
  isPopular: boolean;
  seo: SeoFields;
}

export type BlogPostSummary = Pick<
  BlogPost,
  "id" | "slug" | "title" | "excerpt" | "categorySlug" | "publishedAt" | "featuredImage" | "isFeatured" | "isPopular"
> & { readingMinutes: number; authorName: string };

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TrustBadge {
  id: string;
  label: string;
  description: string;
  icon: IconName | string;
  /** Shows an asterisk linking to the trust footnote — use for anything requiring verification. */
  requiresFootnote: boolean;
}

export interface SocialLink {
  platform: string;
  label: string;
  url: string;
}

export interface SiteSettings {
  businessName: string;
  legalName: string;
  tagline: string;
  shortDescription: string;
  phone: { display: string; e164: string };
  email: string;
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  /** Human label used in copy, e.g. "Houston, Dallas & Austin". */
  serviceAreaLabel: string;
  hours: { label: string; value: string }[];
  /** Machine-readable hours for schema.org. */
  openingHours: { days: string[]; opens: string; closes: string }[];
  emergency: { available: boolean; label: string; shortLabel: string };
  licenseNumber?: string;
  trustBadges: TrustBadge[];
  trustFootnote: string;
  social: SocialLink[];
  priceRange?: string;
  logo?: string;
  favicon?: string;
  phones?: { label: string; display: string; e164: string; type: string }[];
  navigation: { header: NavLink[]; quickLinks: NavLink[]; legal: NavLink[] };
  footer: {
    description?: string;
    showServices: boolean;
    servicesLimit: number;
    showServiceAreas: boolean;
    showHours: boolean;
    copyrightText?: string;
  };
  /** Call-tracking provider's dynamic number insertion script (optional). */
  callTracking?: { scriptUrl: string };
  analytics?: { ga4MeasurementId?: string | null; gtmId?: string | null };
}

export interface NavLink {
  label: string;
  href: string;
}

/** CMS page (legal pages, custom pages at /{slug}). Text may contain inline [links](/path). */
export interface CmsPage {
  slug: string;
  title: string;
  intro: string;
  body: ContentBlock[];
  faqs: Faq[];
  updatedAt: string;
  seo: SeoFields;
}

/** Real, staff-verified customer review. */
export interface Testimonial {
  id: string;
  authorName: string;
  location?: string | null;
  rating?: number | null;
  body: string;
  source?: string | null;
  sourceUrl?: string | null;
  serviceName?: string;
}

export interface RedirectRule {
  source: string;
  destination: string;
  statusCode: number;
}

export interface RobotsConfig {
  allowIndexing: boolean;
  disallow: string[];
  extra?: string;
}

/** First-touch marketing attribution captured in the browser. */
export interface Attribution {
  landingPage?: string;
  sourcePath?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  deviceType?: "MOBILE" | "TABLET" | "DESKTOP" | "UNKNOWN";
}

export type PreferredTime = "asap" | "morning" | "afternoon" | "evening";

export interface ServiceRequestInput {
  name: string;
  phone: string;
  email: string;
  serviceSlug: string;
  zip: string;
  preferredDate: string;
  preferredTime: PreferredTime | "";
  message: string;
  /** Honeypot — must be empty. */
  company?: string;
  /** Epoch ms when the form was rendered — used for a minimum fill-time check. */
  startedAt?: number;
  /** Captcha token placeholder (Turnstile / reCAPTCHA) for Phase 2. */
  captchaToken?: string;
  sourcePath?: string;
  /** "contact" submissions also create a contact message in the CMS. */
  formType?: "service_request" | "contact";
  /** Random per-render key — retries of the same submit are de-duplicated server-side. */
  submissionKey?: string;
  attribution?: Attribution;
}

export interface ServiceRequestResult {
  ok: boolean;
  referenceId?: string;
  message: string;
  fieldErrors?: Partial<Record<keyof ServiceRequestInput, string>>;
}
