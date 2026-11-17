# Backend, Database, CMS & Admin Panel

The project is made of three apps that deploy separately:

| App | Folder | Tech | Port (dev) |
|---|---|---|---|
| Public website | `/` (root) | Next.js 16, React 19, Tailwind 4 | 3000 |
| API + CMS backend | `backend/` | Node.js, Express 5, TypeScript, Prisma 7, PostgreSQL | 4000 |
| Admin panel | `admin/` | React 19 + Vite SPA, served by the API at `/admin` | 5173 in dev, `/admin` in prod |

```
Visitor ──► Next.js website ──(server-to-server, Bearer PUBLIC_API_KEY)──► /api/v1/public/*  ─┐
                │  /api/service-request  (lead forms)                                          ├─► PostgreSQL
                │  /api/track            (CTA click beacons)                                    │
                │  proxy.ts              (CMS redirects)                                       │
Staff ──────► /admin (React SPA) ──(httpOnly session cookie + CSRF header)──► /api/v1/admin/* ┘
Backend ──► POST {site}/api/revalidate after every content edit → pages refresh immediately
Call-tracking provider ──(HMAC-signed webhook)──► /api/v1/webhooks/calls/:provider
```

The browser never calls the backend's public API directly, so the API key never reaches the client. Staff use the admin panel on the API's own origin, which keeps cookies first-party with no cross-site CORS.

---

## 1. Folder structure

```
backend/
├─ prisma/
│  ├─ schema.prisma            database schema (all models, enums, indexes)
│  ├─ migrations/              SQL migrations (commit these)
│  └─ seed.ts                  roles/permissions, Phase-1 content, keyword sheet import
├─ prisma.config.ts            Prisma 7 config (schema path, DATABASE_URL, seed command)
├─ scripts/
│  ├─ local-postgres.ts        real PostgreSQL for local dev without installing it (npm run db:local)
│  └─ create-admin.ts          create/reset an Owner account (npm run admin:create)
├─ src/
│  ├─ server.ts                HTTP server, graceful shutdown, session cleanup job
│  ├─ app.ts                   Express app: security headers, CORS, parsers, routers, error handler, /media, /admin
│  ├─ db.ts                    Prisma client (pg driver adapter)
│  ├─ config/env.ts            environment validation (process exits on bad config)
│  ├─ auth/
│  │  ├─ session.ts            DB sessions, cookies, CSRF check, requireAuth / requirePermission / requirePublicKey
│  │  ├─ password.ts           Argon2id hashing, password policy
│  │  └─ permissions.ts        permission keys + default roles
│  ├─ lib/
│  │  ├─ http.ts               response envelope, AppError helpers, pagination meta
│  │  ├─ validate.ts           zod helpers: cleanText (strips HTML/control chars), slugs, safe hrefs
│  │  ├─ content.ts            SEO schema, content-block schema, live/scheduled filters, slugs, site revalidation
│  │  ├─ crud.ts               generic permission-checked CRUD router for simple tables
│  │  ├─ audit.ts              audit log writer (secrets scrubbed)
│  │  ├─ crypto.ts             tokens, SHA-256/HMAC, AES-256-GCM (2FA secrets)
│  │  ├─ mailer.ts             SMTP (or console in dev)
│  │  └─ logger.ts             pino (redacts auth headers, cookies, passwords)
│  ├─ modules/                 one router per domain
│  │  ├─ auth.routes.ts        login, 2FA, logout, me, password change/reset
│  │  ├─ public.routes.ts      website content API, lead intake, CTA tracking, call webhook
│  │  ├─ public.serializers.ts DB rows → the website's TypeScript types
│  │  ├─ leads.service.ts      lead creation: spam traps, idempotency, de-dupe, notifications
│  │  ├─ leads.routes.ts       admin leads + contact messages + CSV export
│  │  ├─ services.routes.ts    services (status, trash/restore, FAQs, relations, areas)
│  │  ├─ areas.routes.ts       states → cities → service areas (thin-page guard)
│  │  ├─ posts.routes.ts       blog (draft/publish/schedule/unpublish, trash/restore, slug check)
│  │  ├─ pages.routes.ts       CMS pages (legal pages + custom pages)
│  │  ├─ media.routes.ts       image upload/validation/variants
│  │  ├─ keywords.*.ts         CSV/XLSX import, views, assignment, cannibalization guard
│  │  ├─ settings.routes.ts    business info, hours, footer, system, phones, badges, social, navigation
│  │  ├─ users.routes.ts       users + roles & permissions
│  │  └─ misc.routes.ts        categories, tags, authors, FAQs, testimonials, redirects, states,
│  │                           audit log, dashboard, analytics, SEO overview
│  └─ generated/prisma/        generated client (do not edit, git-ignored)
└─ uploads/                    uploaded media (local disk storage; git-ignored)

admin/
├─ src/main.tsx                routes + permission gates
├─ src/lib/                    api client (CSRF), auth context
├─ src/components/             UI kit, Layout, ResourcePage (generic CRUD), MediaPicker,
│                              BlockEditor (blog/page editor), SEO panel, list editors
└─ src/pages/                  Dashboard/Analytics, Leads, Services & Areas, Blog & Pages,
                               Keywords/SEO/Media, Settings/Users/Roles/Audit/Account, simple resources
```

---

## 2. Database schema

The source of truth is [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma). Every mutable table has `createdAt`/`updatedAt`, and every foreign key and common filter is indexed.

| Requested model | Implemented as | Notes |
|---|---|---|
| Users / Admin Users | `User` | One table. Every user is a staff/admin user, and website visitors never get accounts, so a separate admin table would duplicate data. |
| Roles, Permissions | `Role`, `Permission`, `RolePermission` | Many-to-many. The `Owner` role (`isSystem`) always has every permission. |
| — | `Session`, `PasswordResetToken` | Only SHA-256 hashes of tokens are stored. |
| Services, Service Categories | `Service`, `ServiceCategory`, `ServiceRelation` | Soft delete (`deletedAt`), `status`, `sortOrder`. |
| States, Cities, Service Areas | `State` → `City` → `ServiceArea`, plus `ServiceAreaService` (m:n with `isFeatured`) | One landing page per city. |
| Blog Posts, Categories, Tags, Authors | `Post`, `BlogCategory`, `Tag`, `PostTag`, `PostService`, `Author` | Scheduling via `status=SCHEDULED` + `publishedAt`. |
| SEO Metadata | `SeoMeta` (1:1 with Service, ServiceArea, Post, Page, BlogCategory) | Meta title/description, canonical, robots, OG title/description/image, extra JSON-LD. |
| FAQs | `Faq` | Belongs to exactly one service, area, post or page, or to a named `group` such as `home`. |
| Leads, Lead Status | `Lead` + `LeadStatus` enum + `LeadEvent` (status history) + `LeadNote` | Statuses: NEW, CONTACTED, QUALIFIED, BOOKED, COMPLETED, INVALID, SPAM, CLOSED. |
| Contact Messages | `ContactMessage` (1:1 with `Lead`) | Every contact-form submission also creates a lead. |
| Business Information | `BusinessInfo` (singleton) | Name, address, emergency availability, license, logo, favicon. |
| Phone Numbers | `PhoneNumber` | Exactly one primary number, used by every Call Now button. |
| Business Hours | `BusinessHours` | One row per weekday. |
| Site / System Settings | `SystemSetting` (key → JSON, validated per key) | `robots`, `leadNotifications`, `callTracking`, `analytics`. |
| Footer Settings | `FooterSettings` (singleton) | |
| Navigation | `NavigationItem` (`HEADER`, `FOOTER_QUICK_LINKS`, `FOOTER_LEGAL`, optional parent) | |
| Social Links, Trust badges | `SocialLink`, `TrustBadge` | |
| Testimonials | `Testimonial` | Can only be published when `isVerified` (a genuine review). |
| Media | `Media` | Original plus responsive WebP `variants`. |
| Redirects | `Redirect` | Includes a hit counter. |
| Pages | `Page` | `isSystem` pages (legal) cannot be deleted. |
| Audit Logs | `AuditLog` | Who, what, entity, diff, IP and user agent. |
| Keyword management | `Keyword`, `KeywordImport` | A keyword maps to at most one page (unique `normalized`). |
| Call tracking | `CtaClickEvent` (clicks), `CallEvent` (provider-confirmed calls) | Clicks are never counted as calls. |

---

## 3. API documentation

Base URL: `{API_PUBLIC_URL}/api/v1`. All endpoints use JSON.

Every response uses the same envelope:

```json
{ "success": true, "data": { … }, "meta": { "page": 1, "pageSize": 20, "total": 57, "totalPages": 3 } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": { "phone": "Enter a valid 10-digit US phone number." } } }
```

| Status | Meaning |
|---|---|
| 200 / 201 | OK / created |
| 400 | Malformed request |
| 401 | Not signed in, session expired, or invalid API key |
| 403 | Missing permission, or CSRF check failed |
| 404 | Not found |
| 409 | Conflict: duplicate slug, keyword cannibalization, unique value |
| 413 / 415 | File too large / file type not allowed |
| 422 | Validation failed (`details` holds per-field errors) |
| 423 | Account temporarily locked |
| 429 | Rate limited |
| 500 | Internal error (details are logged, never returned) |

### 3.1 Authentication (`/auth`)

Uses session cookies: `plumb_sid` is httpOnly, SameSite=Strict, and Secure in production. Every non-GET admin request must send the `X-CSRF-Token` header, set to the value of the `plumb_csrf` cookie.

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | Rate-limited. The account locks for 15 min after 5 failures. Returns `{ twoFactorRequired, user? }`. |
| POST | `/auth/2fa/verify` | `{ code }` | Second login step when 2FA is on. |
| POST | `/auth/logout` | — | |
| GET | `/auth/me` | — | Current user and permission keys. |
| POST | `/auth/password` | `{ currentPassword, newPassword }` | Signs out the user's other sessions. |
| POST | `/auth/forgot-password` | `{ email }` | Always returns 200, so account existence isn't revealed. Emails a link valid for 1 hour. |
| POST | `/auth/reset-password` | `{ token, password }` | Ends all of that user's sessions. |
| POST | `/auth/2fa/setup` · `/2fa/enable` · `/2fa/disable` | `—` · `{ code }` · `{ password }` | TOTP. The secret is AES-256-GCM encrypted at rest. |

Sessions expire after `SESSION_TTL_HOURS` (default 12), or after `SESSION_IDLE_MINUTES` (default 120) without activity. Passwords are hashed with Argon2id and are never included in any response.

### 3.2 Public API (`/public/*`, used by the Next.js server)

Every public endpoint requires `Authorization: Bearer {PUBLIC_API_KEY}`. Only published content is returned (posts also include scheduled posts whose time has passed).

| Method | Path | Returns |
|---|---|---|
| GET | `/public/settings` | Business info, primary phone, hours (grouped), emergency, trust badges, social, logo/favicon, navigation, footer, analytics/call-tracking script |
| GET | `/public/services` · `/public/services/:slug` | Service list · full service (FAQs, related services/posts, SEO + keywords) |
| GET | `/public/locations` · `/public/locations/:slug` | Service areas · full area page |
| GET | `/public/posts?page&pageSize&category&q` | Paginated post summaries |
| GET | `/public/posts?slugs=a,b` | `{ items }` for the given slugs |
| GET | `/public/posts/slugs` · `/featured` · `/popular?limit` · `/:slug` · `/:slug/related` | |
| GET | `/public/blog-categories` · `/public/authors/:id` | |
| GET | `/public/pages` · `/public/pages/:slug` | CMS pages. Tokens such as `{{legalName}}` are filled in from Business Info. |
| GET | `/public/faqs?group=home` · `/public/testimonials` | Testimonials: verified and published only |
| GET | `/public/redirects` · `/public/robots` | |
| POST | `/public/redirects/hit` | `{ source }`, which increments the redirect's hit counter |
| POST | `/public/leads` | Lead intake (see 3.4). Rate-limited to 5 per 10 min per visitor IP. |
| POST | `/public/track/cta` | `{ type: CALL\|REQUEST_SERVICE\|SMS\|EMAIL, placement, target, pagePath, visitorId, attribution }`. Rate-limited. |

The Next.js server forwards the visitor's IP in `X-Client-IP`. The backend trusts that header only when the request also carries the valid API key.

### 3.3 Admin API (`/admin/*`, session + permission)

| Area | Endpoints | Permission |
|---|---|---|
| Dashboard | `GET /admin/dashboard` | dashboard:view |
| Analytics | `GET /admin/analytics?days=30`: CTA clicks by page, device, placement and UTM; leads by form and campaign; daily series; confirmed calls | dashboard:view |
| Leads | `GET /admin/leads?q&status&source&serviceId&assignedToId&from&to&sort&dir&page` · `GET /:id` · `PATCH /:id {status, assignedToId}` · `POST /:id/notes` · `DELETE /:id` · `GET /export` (CSV, same filters) · `POST /` (manual/phone lead) | leads:read / write / delete / export |
| Contact messages | `GET /admin/contact-messages?unread=true` | leads:read |
| Services | `GET /admin/services[?deleted=true]` · `GET/PUT /:id` · `POST /` · `PATCH /:id/status` · `DELETE /:id` (trash) · `POST /:id/restore` | content:* |
| Service categories | `/admin/service-categories` (CRUD + `PUT /reorder`) | content:* |
| Service areas | `/admin/service-areas` (same as services) · `GET /states` | content:* |
| Blog | `/admin/posts?q&status&categoryId&deleted&page` · `GET /slug-check?slug&id` · `POST` · `PUT /:id` · `PATCH /:id/status {status, publishedAt}` · `DELETE /:id` (trash) · `POST /:id/restore` · `DELETE /:id/permanent` | content:* |
| Categories, tags, authors | `/admin/blog-categories`, `/admin/tags`, `/admin/authors` | content:* |
| Pages | `/admin/pages` (CRUD, trash/restore; system pages can't be deleted) | content:* |
| FAQs, testimonials | `/admin/faqs?group&serviceId…`, `/admin/testimonials` | content:write |
| Media | `GET /admin/media?q` · `POST /admin/media` (multipart `file`, `alt`) · `PATCH /:id {alt,title}` · `DELETE /:id` | media:write |
| SEO | `GET /admin/seo/overview` (titles, descriptions, noindex, duplicates) · `/admin/redirects` (CRUD) | content:read / seo:write |
| Keywords | `GET /admin/keywords?view=all\|unused\|assigned\|service\|location\|blog\|home\|ignored&q&priority&sort` · `POST /import` (multipart `.csv`/`.xlsx`) · `GET /imports` · `GET /targets` · `PATCH /:id {target, role, status, priority, intent, category, notes, force}` · `POST /` · `DELETE /:id` · `GET /report/conflicts` | keywords:write |
| Settings | `GET/PUT /admin/settings/business` · `GET/PUT /hours` · `GET/PUT /footer` · `GET /system` · `PUT /system/:key` (`robots`, `leadNotifications`, `callTracking`, `analytics`) · CRUD `/phones`, `/trust-badges`, `/social-links`, `/navigation?location=` | settings:write / system:write |
| Users | `GET /admin/users` · `GET /assignable` · `POST` · `PATCH /:id {name, roleId, isActive, password, unlock}` · `DELETE /:id` | users:manage |
| Roles | `GET /admin/roles` · `GET /permissions` · `POST` · `PUT /:id` · `DELETE /:id` | roles:manage |
| Audit log | `GET /admin/audit-logs?entity&userId&action&page` | audit:read |

### 3.4 Lead intake and abuse protection

`POST /public/leads` takes `formType` (`service_request` or `contact`), `name`, `phone`, `email`, `serviceSlug`, `zip`, `preferredDate`, `preferredTime`, `message`, `company` (honeypot), `startedAt`, `submissionKey` and `attribution {landingPage, sourcePath, referrer, utmSource…utmContent, deviceType}`.

| Threat | Defense |
|---|---|
| Bots | Hidden honeypot field, plus a minimum fill time of 2.5 s. Bot submissions get a fake success and nothing is stored. Captcha hook ready (`captchaToken`, Turnstile env vars). |
| Duplicate submits | `submissionKey` is unique, so retries return the same reference. An HMAC of phone + service + message within 15 minutes is collapsed into one lead. |
| Rate-limit abuse | 5 leads per 10 min per visitor IP, plus per-IP limits on login and tracking. |
| Malformed requests | JSON body limit (1 MB API, 20 KB on the site route); strict zod schemas; content-type check. |
| Injection | Prisma parameterized queries only; no string-built SQL. |
| XSS | Text is stripped of HTML and control characters on the server, and React renders everything as text (inline `[links](/path)` are parsed, never HTML). Hrefs block `javascript:`/`data:`. CSP on the API and admin. |
| CSRF | Admin: double-submit token plus SameSite=Strict cookies. Website forms: same-origin check, and no cookies are used. |
| Server-side validation | The site route validates, then the backend validates again with its own rules. |

Contact-form submissions (`formType: "contact"`) create both a `Lead` (source CONTACT_FORM) and a `ContactMessage`.

### 3.5 Call-conversion tracking

- **Clicks:** a delegated listener ([`src/components/analytics/Tracking.tsx`](../src/components/analytics/Tracking.tsx)) sends every `tel:` click (and Request Service, SMS and email CTA) to `/api/track`, which forwards it to `/public/track/cta`. Each click stores the page, device, placement, timestamp, UTMs, referrer and landing page, plus an anonymous session `visitorId`.
- **Calls:** a `CallEvent` is created **only** by `POST /api/v1/webhooks/calls/:provider`.
  - Signature: the `X-Signature` header must be the hex HMAC-SHA256 of the raw body using `CALL_TRACKING_WEBHOOK_SECRET`.
  - Body: `{ providerCallId, trackingNumber?, callerNumber?, status: answered|missed|voicemail|busy|failed, durationSeconds?, startedAt, clickId? }`.
  - Duplicates: repeated deliveries are idempotent per provider and call ID.
  - Privacy: caller numbers are stored only as an HMAC.
  - Provider formats: map each provider's native payload to this shape in `public.routes.ts`. CallRail, CTM and Twilio all support webhooks.
  - Number swapping: a provider's dynamic-number-insertion script URL can be set in Admin → System, and the site loads it lazily.
- **Reporting:** the dashboard and Analytics label clicks "clicks, not confirmed calls". Confirmed calls show separately and stay at 0 until a provider is connected.

### 3.6 Media uploads

- **Accepted:** JPEG, PNG, WebP and AVIF, up to `UPLOAD_MAX_MB` (default 8). SVG is rejected because it can contain scripts.
- **Type checks:** the file extension and declared MIME type must both be on the allow-list, and the magic bytes must match the declared MIME type.
- **Re-encoding:**
  - **Decode:** each image is fully decoded by sharp, with a pixel limit to stop decompression bombs.
  - **Clean:** the image is auto-rotated and re-encoded, which removes EXIF/GPS data and any embedded payloads.
  - **Resize:** WebP versions at 480, 960 and 1600 px are generated.
  - **Rename:** files get random names.
- **Serving:** files are served from `/media` with `nosniff` and `CSP: sandbox`, and are never executed.
- **On the website:** media is reached through a rewrite (`/media/*` → backend) and optimized by `next/image` into AVIF/WebP.

### 3.7 SEO controls

- **Per page:** services, areas, posts and pages each have SEO title, meta description, canonical URL, robots directive, OG title, OG description, OG image and extra JSON-LD.
- **On the website:** these become `<title>`, meta tags, `<link rel=canonical>`, robots meta, Open Graph/Twitter tags and additional schema.
- **Sitemap and robots:** `sitemap.xml` is built from live content (services, areas, posts, CMS pages, categories). `robots.txt` comes from Admin → System, and preview deployments are always disallowed.
- **Redirects:** managed in the admin and applied by `src/proxy.ts`. The rule list is cached for 60 seconds, so new rules take up to a minute to apply.
- **Keyword management:**
  - **Import:** the CSV/XLSX importer understands multi-sheet, multi-section workbooks (like the provided sheet) and preserves existing assignments.
  - **One page per keyword:** a keyword can be assigned to at most one page.
  - **One primary per page:** each page has one PRIMARY keyword. Assigning a primary that matches another page's intent signature (normalized, plurals and "near me"-type words removed) is blocked with a 409 unless forced.
  - **Report:** `/report/conflicts` lists competing primaries and published pages with no primary keyword.
- **Thin-page guard:** a service area can only be published with at least 2 local intro paragraphs (80+ characters each), 2 local considerations, an SEO title and a meta description.

---

## 4. Environment variables

### `backend/.env`

| Variable | Required | Example / default | Purpose |
|---|---|---|---|
| `NODE_ENV` | | `production` | |
| `PORT` | | `4000` | |
| `DATABASE_URL` | ✔ | `postgresql://user:pass@host:5432/plumbing?sslmode=require` | |
| `API_PUBLIC_URL` | ✔ | `https://api.example.com` | Used for reset links and the admin URL |
| `SITE_URL` | | `https://www.example.com` | |
| `CORS_ORIGINS` | | `http://localhost:5173` | Extra origins allowed to call the admin/auth API with credentials (the Vite dev server) |
| `PUBLIC_API_KEY` | ✔ | 32+ random chars | Must equal the site's `BACKEND_API_KEY` |
| `APP_ENCRYPTION_KEY` | ✔ | 64 hex chars | 2FA secret encryption and IP/phone HMAC. **Never change it after launch.** |
| `SESSION_TTL_HOURS` / `SESSION_IDLE_MINUTES` | | `12` / `120` | |
| `COOKIE_SECURE` | | auto (`true` in production) | |
| `SITE_REVALIDATE_URL` / `SITE_REVALIDATE_SECRET` | ✔ for instant updates | `https://www.example.com/api/revalidate` | Secret must equal the site's `REVALIDATE_SECRET` |
| `UPLOAD_DIR` / `UPLOAD_MAX_MB` | | `./uploads` / `8` | Use a persistent volume |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `MAIL_FROM` | for email | | Without these, emails are only logged |
| `LEAD_NOTIFY_EMAILS` | | `office@company.com` | Combined with the list in Admin → System |
| `CALL_TRACKING_WEBHOOK_SECRET` | for call tracking | | |
| `LOG_LEVEL` / `TRUST_PROXY` | | `info` / `loopback` | Behind a load balancer set `TRUST_PROXY=1` (number of hops) |
| `ADMIN_DIST` | | `../admin/dist` | Folder of the built admin panel |

Generate the secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Website `.env.local`

`NEXT_PUBLIC_SITE_URL`, `BACKEND_API_URL`, `BACKEND_API_KEY`, `CONTENT_REVALIDATE_SECONDS`, `REVALIDATE_SECRET` (see `.env.example`).

### Admin build

`VITE_SITE_URL=https://www.example.com` is used for the "View on site" links.

---

## 5. Local setup

Requires **Node.js 20.19+**. PostgreSQL is optional locally, because `db:local` runs a real Postgres from npm.

1. Install the backend dependencies:

   ```bash
   cd backend && npm install
   ```

2. Create the backend `.env` with `DATABASE_URL=postgresql://plumbing:plumbing@localhost:5433/plumbing` plus the secrets listed in section 4:

   ```bash
   cp .env.example .env
   ```

3. Start the local database and keep it running:

   ```bash
   npm run db:local
   ```

4. In a second terminal, from `backend/`, apply the migrations and generate the client:

   ```bash
   npm run db:deploy && npm run db:generate
   ```

5. Seed roles, permissions, the existing content and the keyword sheet:

   ```bash
   npm run db:seed
   ```

6. Start the API on http://localhost:4000:

   ```bash
   npm run dev
   ```

7. Install the admin panel's dependencies:

   ```bash
   cd admin && npm install
   ```

8. Build the admin panel so the API serves it at http://localhost:4000/admin:

   ```bash
   npm run build
   ```

   For admin development with hot reload, use `npm run dev` instead (http://localhost:5173/admin).

9. Set up the website: from the project root, run `npm install`, then set `BACKEND_API_URL`, `BACKEND_API_KEY` and `REVALIDATE_SECRET` in `.env.local` (shown in section 4).

10. Start the website:

   ```bash
   npm run dev
   ```

The website still runs without the backend: leave `BACKEND_API_URL` empty and it falls back to the built-in mock data.

## 6. Migrations

| Task | Command |
|---|---|
| Change the schema (dev) | edit `prisma/schema.prisma`, then `npx prisma migrate dev --name <change>` (creates SQL in `prisma/migrations/`; commit it) |
| Apply in production / CI | `npm run db:deploy` (`prisma migrate deploy`, applies pending migrations only) |
| Regenerate the client | `npm run db:generate` (also part of `npm run build`) |
| Inspect data | `npm run db:studio` |

Never run `migrate dev` or `migrate reset` against production.

## 7. Admin credentials

There are no default passwords. Create the first Owner in one of two ways:

- **Seed with env vars:** set `ADMIN_EMAIL`, `ADMIN_PASSWORD` (12+ characters, letters and a number) and optionally `ADMIN_NAME` before `npm run db:seed`. Remove them from the environment afterwards.
- **Run the CLI:**

  ```bash
  npm run admin:create -- --email owner@company.com --name "Jane Smith"
  ```

  This prints a strong temporary password once. Add `--reset` to reset a locked-out account.

After signing in at `/admin`:
- Change your password and turn on 2FA in **My account**.
- Add staff in **Users** with the least-privileged role: Owner, Administrator, Editor or Dispatcher. Custom roles can be created in **Roles & Permissions**.

Locally, the seed created `owner@example.com` / `LocalDevOnly-2026` for testing only. Delete it, or reset its password, before any deployment.

## 8. Frontend integration

- **Content provider:** set `BACKEND_API_URL` and the site switches from `src/lib/api/mock` to [`src/lib/api/http.ts`](../src/lib/api/http.ts). Both implement `ContentApi` ([`src/lib/api/types.ts`](../src/lib/api/types.ts)), so pages don't change.
- **Caching:** content fetches use ISR (`CONTENT_REVALIDATE_SECONDS`) and the `content` cache tag. After any admin edit the backend calls `POST /api/revalidate`, so changes appear on the next page view.
- **Content controlled by the CMS:**
  - business information, phones, hours, emergency wording and trust badges
  - logo and favicon
  - header menu, footer links and footer options
  - services, service areas and posts
  - CMS pages, including the legal pages and any custom page at `/{slug}`
  - homepage FAQs and testimonials
  - redirects, robots and the sitemap
  - SEO overrides
  - analytics and call-tracking scripts
- **Forms:** `ServiceRequestForm` posts to `/api/service-request`, which forwards to the backend with the visitor IP, attribution and idempotency key. The contact page sends `formType="contact"`.
- **Tracking:** the `Tracking` component captures first-touch attribution in `sessionStorage` and records CTA clicks.
- **Builds:** `next build` fetches content, so the API must be reachable during the build.

## 9. Production deployment

**Database:** use managed PostgreSQL 15+ (Neon, Supabase, AWS RDS, Cloud SQL) with automated backups and point-in-time recovery, and connect with `sslmode=require`.

**API and admin** (any Node host: Render, Railway, Fly.io, a VPS with Docker or PM2):

1. Build the admin panel:

   ```bash
   cd admin && npm ci && VITE_SITE_URL=https://www.example.com npm run build
   ```

2. Build the backend:

   ```bash
   cd backend && npm ci && npm run build
   ```

   This generates the Prisma client and bundles `dist/server.js`.

3. Apply migrations on every release:

   ```bash
   npm run db:deploy
   ```

4. Seed once, on the first deploy only:

   ```bash
   npm run db:seed
   ```

5. Create the Owner account (section 7).

6. Start the server:

   ```bash
   npm start
   ```

   Run it behind HTTPS (the platform's TLS, or nginx/Caddy) at e.g. `https://api.example.com` (admin at `https://api.example.com/admin`), and set `TRUST_PROXY=1`.

7. Mount `UPLOAD_DIR` on a persistent volume, or swap `media.routes.ts` storage to S3/R2. The DB schema already stores URLs.

8. Point a health check at `GET /health`.

**Website** (Vercel or any Node host):

1. Set `NEXT_PUBLIC_SITE_URL`, `BACKEND_API_URL`, `BACKEND_API_KEY`, `REVALIDATE_SECRET` and `CONTENT_REVALIDATE_SECONDS`.
2. Set the backend's `SITE_REVALIDATE_URL` to `https://www.example.com/api/revalidate`, with the matching secret.

**Production checklist:**
- [ ] Strong unique values for `PUBLIC_API_KEY`, `APP_ENCRYPTION_KEY` and the revalidate secret
- [ ] Owner account with 2FA; local test account removed
- [ ] SMTP configured, and lead notification emails set in Admin → System
- [ ] Real business info, phone and hours entered in Admin (replace all placeholders)
- [ ] `robots` → allow indexing enabled only on production
- [ ] Database and `uploads/` backups scheduled
- [ ] Captcha (Turnstile) enabled if spam appears; hooks are ready in the form and API
- [ ] Multi-instance API: swap the in-memory rate-limit store for Redis (`rate-limit-redis`)
