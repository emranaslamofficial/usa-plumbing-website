# Backend, Database, CMS & Admin Panel

Everything runs in **one Next.js server on one domain**:

| URL | What | Code |
|---|---|---|
| `/` … | Public website | `src/app` |
| `/admin` | Admin panel (React SPA, built into `public/admin`) | `admin/` |
| `/api/v1/*` | CMS / admin REST API (Express app) | `backend/src`, mounted by `src/pages/api/v1/[[...path]].ts` |

```
Visitor ──► Next.js pages ──(in-process, no HTTP)──► backend/src/modules/public.service.ts ─┐
               │  /api/service-request (forms) ─► public.service.submitLead                  ├─► PostgreSQL
               │  /api/track (CTA clicks)      ─► public.service.recordCtaClick              │   (Prisma)
               │  proxy.ts (redirects)         ─► /api/v1/public/redirects                    │
Staff ──────► /admin ──(httpOnly session cookie + CSRF header)──► /api/v1/admin/*  ──────────┘
Admin edit ─► POST /api/revalidate (same site) → cached pages refresh immediately
Call-tracking provider ──(HMAC-signed webhook)──► /api/v1/webhooks/calls/:provider
```

The website reads content straight from the database through the same service code the API uses. That means it needs no HTTP round trip, no extra API key and no second server, and pages can be built without a running API. Staff use the admin panel on the same origin, so cookies stay first-party and there's no CORS.

Deploying to Vercel: **[DEPLOY-VERCEL.md](DEPLOY-VERCEL.md)**.

---

## 1. Folder structure

```
backend/
├─ prisma/
│  ├─ schema.prisma            database schema (all models, enums, indexes)
│  ├─ migrations/              SQL migrations (commit these)
│  └─ seed.ts                  roles/permissions, Phase-1 content, keyword sheet import
├─ prisma.config.ts            Prisma 7 config (run with --config backend/prisma.config.ts from the root)
├─ load-env.ts                 loads root .env.local/.env for CLI scripts
├─ scripts/
│  ├─ local-postgres.ts        real PostgreSQL for local dev without installing it (npm run db:local)
│  └─ create-admin.ts          create/reset an Owner account (npm run admin:create)
├─ src/
│  ├─ app.ts                   Express app: security headers, parsers, routers, error handler (mounted at /api/v1)
│  ├─ server.ts                optional standalone server (if you ever host the API separately)
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
│  │  ├─ public.service.ts     website content + lead/CTA intake (used in-process by the site AND by the API)
│  │  ├─ public.routes.ts      thin REST wrapper around public.service + call-tracking webhook
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
├─ uploads/                    local uploaded media when no Blob store is connected (git-ignored)
└─ .pgdata/                    local PostgreSQL data (git-ignored)

src/pages/api/v1/[[...path]].ts   hands /api/v1/* to the Express app
src/lib/api/direct.ts             website content provider: database via public.service (cached, tag "content")
src/app/media/[...path]/route.ts  serves local-disk uploads (development)

admin/
├─ src/main.tsx                routes + permission gates (built to ../public/admin, base path /admin)
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

### 3.2 Public API (`/public/*`, server-to-server; the website itself calls public.service in-process)

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

All variables live in one place: `.env.local` locally (template: [`.env.example`](../.env.example)), or **Vercel → Settings → Environment Variables**.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL`, `SITE_URL` | ✔ | Public address, e.g. `https://www.example.com` |
| `DATABASE_URL` | ✔ | PostgreSQL (pooled URL on Neon). Empty = website runs on sample data, no admin. |
| `DATABASE_URL_UNPOOLED` | Neon | Direct URL for migrations (Neon adds it automatically) |
| `PUBLIC_API_KEY` | ✔ | 32+ random characters; protects `/api/v1/public/*` |
| `APP_ENCRYPTION_KEY` | ✔ | 64 hex characters: 2FA secret encryption and IP/phone hashing. **Never change it after launch.** |
| `REVALIDATE_SECRET` | ✔ | Lets admin edits purge the site cache |
| `CONTENT_REVALIDATE_SECONDS` | | Page cache lifetime (default 300) |
| `BLOB_READ_WRITE_TOKEN` | Vercel | Image storage (added when you connect a Blob store). Empty = `backend/uploads`. |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `MAIL_FROM` | for email | Password resets and lead notifications (otherwise only logged) |
| `LEAD_NOTIFY_EMAILS` | | New-lead recipients (also editable in Admin → System) |
| `CALL_TRACKING_WEBHOOK_SECRET` | for call tracking | HMAC secret for provider webhooks |
| `SESSION_TTL_HOURS` / `SESSION_IDLE_MINUTES` | | Admin session limits (12 h / 120 min) |
| `TRUST_PROXY` | | Proxy hops in front of the app (automatically `1` on Vercel) |

## 5. Local setup (Windows, nothing to install)

Double-click **`START WEBSITE.bat`**. It uses the Node.js bundled in `tools/node`, starts PostgreSQL (`backend/.pgdata`), applies migrations, seeds a new database, rebuilds the admin panel and website when their code changed, and serves everything on **http://localhost:3000** (admin at **/admin**). Stop it with Ctrl+C or **`STOP WEBSITE.bat`**.

### Manual / other OS

You need Node.js 20.19+.

1. Install the dependencies:

   ```bash
   npm install && npm --prefix admin install
   ```

2. Create your env file, then fill in the secrets from section 4:

   ```bash
   cp .env.example .env.local
   ```

3. Start the local database and keep it running (or point `DATABASE_URL` at any PostgreSQL):

   ```bash
   npm run db:local
   ```

4. Apply the database schema:

   ```bash
   npm run db:deploy
   ```

5. Load roles, the existing content and the keyword sheet:

   ```bash
   npm run db:seed
   ```

6. Create your admin login:

   ```bash
   npm run admin:create -- --email you@company.com --name "Your Name"
   ```

7. Build the admin panel, generate the database client and build the website:

   ```bash
   npm run build
   ```

8. Start the server at http://localhost:3000:

   ```bash
   npm start
   ```

For admin UI development with hot reload, run `npm run dev` at the root and `npm --prefix admin run dev`, then open http://localhost:5173/admin.

## 6. Migrations

| Task | Command (from the project root) |
|---|---|
| Change the schema | edit `backend/prisma/schema.prisma`, then `npm run db:migrate -- --name <change>` (commit `backend/prisma/migrations/`) |
| Apply in production | runs automatically in the Vercel build (`npm run vercel-build`), or `npm run db:deploy` |
| Regenerate the client | `npm run db:generate` (part of every build) |
| Browse data | `npm run db:studio` |

Never run `migrate dev` or `migrate reset` against production.

## 7. Admin credentials

There are no default passwords. Create the first Owner in one of these ways:

- **Online database:** use **`SETUP ONLINE DATABASE.bat`**. It creates the account (or resets it if it exists) and prints the password once.
- **CLI:**

  ```bash
  npm run admin:create -- --email owner@company.com --name "Jane Smith"
  ```

  This prints a strong temporary password. Add `--reset` for a locked-out account.

After signing in at `/admin`:
- Change the password and turn on 2FA in **My account**.
- Add staff in **Users** with the least-privileged role (Owner, Administrator, Editor, Dispatcher).

The local database has the test account `owner@example.com` / `LocalDevOnly-2026`. It exists only on your computer, never online.

## 8. How the website gets its data

[`src/lib/api/index.ts`](../src/lib/api/index.ts) picks the provider automatically:

| Condition | Provider | Use |
|---|---|---|
| `DATABASE_URL` set | [`direct.ts`](../src/lib/api/direct.ts): database via `public.service` | Normal setup: one server |
| `BACKEND_API_URL` set | [`http.ts`](../src/lib/api/http.ts): a separately hosted API | Optional, if you ever split the backend out |
| neither | [`mock/`](../src/lib/api/mock): built-in sample data | UI work without a database |

**Caching:** content is cached under the `content` tag for `CONTENT_REVALIDATE_SECONDS`. Every admin edit calls `POST /api/revalidate` on the same site, so changes appear on the next page view.

**Builds:** `next build` reads the database, so `DATABASE_URL` must be set during the build. Vercel provides it automatically.

## 9. Production deployment

Follow **[DEPLOY-VERCEL.md](DEPLOY-VERCEL.md)**. It covers one Vercel project with Neon Postgres and Vercel Blob.

Other hosts (any Node server or Docker) work too:

1. Install the dependencies:

   ```bash
   npm ci && npm --prefix admin ci
   ```

2. Apply migrations and build:

   ```bash
   npm run db:deploy && npm run build
   ```

3. Start the server behind HTTPS:

   ```bash
   npm start
   ```

4. Set `TRUST_PROXY=1`.
5. Keep `backend/uploads` on a persistent disk, or set `BLOB_READ_WRITE_TOKEN`.

**Production checklist**

- [ ] Strong unique `PUBLIC_API_KEY`, `APP_ENCRYPTION_KEY`, `REVALIDATE_SECRET`
- [ ] Owner account with 2FA
- [ ] SMTP set up, and lead notification emails set
- [ ] Real business info, phone and hours entered in Admin (replace all placeholders)
- [ ] Database backups (Neon has point-in-time restore)
- [ ] Captcha (Turnstile) if spam appears; hooks are ready
- [ ] High traffic: Redis-backed rate limiting (Upstash)
