# USA Plumbing Services Website (Phase 1: Frontend)

A lead-generation website for a US plumbing company, built with **Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 and Motion** (the current Framer Motion package). Every page reads from a typed API layer. Today that layer serves mock data; in Phase 2 it switches to a real backend through one environment variable.

> ⚠️ **All business details are placeholders.** That includes the name "ClearFlow Plumbing", the phone number `(555) 555-0123`, the address, license number, hours, service areas, the 24/7 claim and the trust badges. Replace them with real, verified information before launch (see the [pre-launch checklist](#pre-launch-checklist)).

---

## Going live (GitHub + Vercel)

Step-by-step guide: **[docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md)**. The website and the admin panel each get their own Vercel project, backed by a Neon database and Vercel Blob for images.

## Easiest way to run it (Windows, nothing to install)

1. Double-click **`START WEBSITE.bat`** in this folder.
2. Wait for "Everything is running" (about 20 seconds; the first run takes longer).
3. Open the website at **http://localhost:3000** and the admin panel at **http://localhost:4000/admin**.

Keep that window open while you use the site. To stop everything, press **Ctrl+C** in it or double-click **`STOP WEBSITE.bat`**.

It uses the Node.js bundled in `tools/node` and a built-in PostgreSQL database stored in `backend/.pgdata`. Logs are saved to `tools/logs/run.log`.

## Quick start (developers)

Requires **Node.js 20.9+** (LTS recommended): <https://nodejs.org>

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev
```

Open <http://localhost:3000>.

Production build:

```bash
npm run build
```

```bash
npm start
```

Type-check only:

```bash
npm run typecheck
```

## Environment variables

See [`.env.example`](.env.example).

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | public | Canonical domain used for canonical tags, sitemap, Open Graph and schema |
| `BACKEND_API_URL` | server | Empty = mock data. Set it to switch to the Phase 2 backend |
| `BACKEND_API_KEY` | server | Bearer token for backend calls. Never reaches the browser |
| `CONTENT_REVALIDATE_SECONDS` | server | How long backend content is cached (ISR) |
| `REVALIDATE_SECRET` | server | Shared secret for `POST /api/revalidate` (the admin panel purges the cache after edits) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | public / server | Spam-protection placeholders |

## Folder structure

```
├─ docs/
│  ├─ KEYWORD-MAP.md        keyword analysis, categories, keyword→page map, cannibalization notes
│  └─ BACKEND-API.md        API contract, database entities, admin panel spec, Phase 2 steps
├─ src/
│  ├─ app/                                  routes (App Router)
│  │  ├─ page.tsx                           Home
│  │  ├─ services/page.tsx                  Services hub
│  │  ├─ services/[slug]/page.tsx           Service detail pages (dynamic, from API)
│  │  ├─ emergency-plumbing/page.tsx        Emergency landing page
│  │  ├─ service-areas/page.tsx             Service-area hub (grouped by state)
│  │  ├─ service-areas/[slug]/page.tsx      Location pages (dynamic)
│  │  ├─ blog/page.tsx                      Listing: featured, categories, search, pagination, popular
│  │  ├─ blog/[slug]/page.tsx               Article: TOC, FAQ, related services/articles, CTAs
│  │  ├─ blog/[slug]/opengraph-image.tsx    Per-article social image
│  │  ├─ about | contact | request-service
│  │  ├─ privacy-policy | terms-and-conditions | disclaimer
│  │  ├─ not-found.tsx                      404
│  │  ├─ api/service-request/route.ts       Lead intake (server validation, spam checks, backend forward)
│  │  ├─ api/revalidate/route.ts            Cache purge for the admin panel
│  │  ├─ sitemap.ts | robots.ts | opengraph-image.tsx | icon.svg
│  │  ├─ layout.tsx                         Fonts, header, footer, mobile CTA bar, metadata defaults
│  │  └─ globals.css                        Tailwind theme tokens and article typography
│  ├─ components/
│  │  ├─ layout/      Header (mega menu + animated mobile menu), TopBar, Footer, MobileCtaBar, Breadcrumbs, Logo
│  │  ├─ sections/    HomeHero, TrustBar, ServiceCard/Grid, EmergencyBanner, HowItWorks, ServiceAreasSection,
│  │  │               FaqList, CtaBand, PageHero, ContactCard, LegalPage
│  │  ├─ blog/        ArticleBody, RichText, TableOfContents, PostCard, PostCover, BlogSearch, Pagination
│  │  ├─ forms/       ServiceRequestForm
│  │  ├─ motion/      MotionProvider (LazyMotion + reduced motion), Reveal/RevealGroup
│  │  ├─ seo/         JsonLd
│  │  ├─ ui/          Button / CallButton, Icon, SectionHeading
│  │  └─ illustrations/HeroIllustration (inline SVG, so no image request)
│  ├─ lib/
│  │  ├─ api/
│  │  │  ├─ types.ts        ContentApi interface (the contract)
│  │  │  ├─ index.ts        picks the provider: mock or http
│  │  │  ├─ http.ts         REAL backend client (Phase 2), ISR and cache tags
│  │  │  └─ mock/           MOCK provider and data (services, locations, blog, settings)
│  │  ├─ seo.ts         metadata builder and JSON-LD builders (Plumber, Service, FAQPage, BlogPosting, BreadcrumbList)
│  │  ├─ validation.ts  form validation shared by browser and server
│  │  └─ utils.ts
│  └─ types/index.ts    domain types shared with the backend
├─ next.config.ts       image formats, security headers, redirects
└─ .env.example
```

## Architecture notes

- **Mock and real data are kept apart.** Pages import only `api` from `@/lib/api`. The mock provider (`lib/api/mock`) and the real one (`lib/api/http.ts`) both implement `ContentApi`. Every API module imports `server-only`, so data access and secrets can't leak into client bundles.
- **Dynamic content.** Services, locations and posts render from the API with `generateStaticParams` plus `dynamicParams = true`. New records added in the admin panel render on demand without a rebuild.
- **Forms.** The browser posts to `/api/service-request` on the same origin. That route re-validates the data, applies a honeypot and a minimum fill-time check, then forwards the lead to the backend with the server-side key.
- **Performance.** Pages are statically prerendered. The hero uses a CSS-only entrance and an inline SVG, so the LCP doesn't wait on JavaScript or an image request. Fonts are self-hosted through `next/font`. Motion loads through `LazyMotion` (the small bundle). Images go through `next/image` (AVIF/WebP, lazy). The only client components are the header, form and reveal wrappers.
- **Accessibility.** Semantic landmarks, a skip link, visible focus rings, labelled form fields with `aria-invalid` and `aria-describedby` errors, and focus moved to the first invalid field. FAQs use native `<details>`. Escape closes menus and focus returns to the trigger. `prefers-reduced-motion` is respected in both CSS and Motion.

## SEO and content architecture

| Feature | Where |
|---|---|
| Clean URLs | `/services/drain-cleaning`, `/service-areas/houston-tx`, `/blog/how-to-fix-a-running-toilet` |
| Dynamic metadata, canonical, Open Graph, Twitter/X | `pageMetadata()` in `src/lib/seo.ts`, used by every route |
| XML sitemap | `/sitemap.xml`, generated from live content |
| robots.txt | `/robots.txt`. Disallows everything outside production; production blocks `/api/` and search results |
| Breadcrumbs and BreadcrumbList schema | `components/layout/Breadcrumbs.tsx` |
| Plumber (LocalBusiness) schema | home, contact, location pages |
| Service schema | service pages and the emergency page |
| FAQPage schema | home, services, locations, articles |
| BlogPosting schema | articles |
| Social images | `opengraph-image.tsx` (site-wide and per article) |
| One intent per URL | see [`docs/KEYWORD-MAP.md`](docs/KEYWORD-MAP.md) |
| Thin-page protection | search results are `noindex`. Location pages require unique local content |

Internal linking: service pages link to related services, articles and service areas. Articles link inline to their service page and end with "Related services". Location pages link to featured services and all services.

## Backend, CMS & admin panel (Phase 2 — built)

Everything on the site (business info, phones, hours, services, service areas, blog, pages, FAQs, testimonials,
navigation, footer, SEO, redirects, robots) is managed in the admin panel and stored in PostgreSQL.

- `backend/` — Express + Prisma API, auth, leads, media, keywords, tracking
- `admin/` — React admin panel, served by the API at `/admin`

Full guide: **[docs/BACKEND.md](docs/BACKEND.md)** (folder structure, schema, API reference, env vars, setup,
migrations, admin accounts, deployment).

## Pre-launch checklist

- [ ] Replace everything in `src/lib/api/mock/data/site.ts`: business name, phone (`e164` and display), email, address, hours, license number and trust footnote.
- [ ] Set `emergency.available` to `false` if you don't offer 24/7 service. The copy across the site adjusts.
- [ ] Confirm each trust badge is true (licensed, insured, response times). Remove any that aren't.
- [ ] Replace the sample service areas (Houston, Dallas and Austin) with the areas you actually serve, each with unique local content.
- [ ] Rewrite the About page with the real company story and photos.
- [ ] Add real job and team photos (they convert better than illustrations) through `image` and `featuredImage`.
- [ ] Have an attorney review the Privacy Policy, Terms and Disclaimer templates.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the production domain.
- [ ] Turn on spam protection (Turnstile or reCAPTCHA) and lead notifications.
- [ ] Set up a Google Business Profile with the same name, address and phone (NAP) as the website.
- [ ] Re-check the keyword volumes for your actual city in Keyword Planner, Semrush or Ahrefs.
