# Deploying to GitHub + Vercel

You'll create **two Vercel projects from the same GitHub repo**:

| Vercel project | Root Directory | What it is | URL example |
|---|---|---|---|
| **Backend** | `backend` | API + **Admin panel** (`/admin`) | `https://plumbing-backend.vercel.app/admin` |
| **Website** | `./` (repo root) | The public website | `https://plumbing-site.vercel.app` |

The backend also needs two storage add-ons, created inside Vercel with free plans available:

- **Neon Postgres:** the database (leads, services, blog, settings).
- **Vercel Blob:** images uploaded in the admin panel.

Deploy the backend first (steps 2–4). The website needs the backend running before it can build.

---

## Step 1: Upload the code to GitHub

1. Go to <https://github.com/new>. Name the repo, for example `usa-plumbing-website`, choose **Private**, and **don't** add a README. Click **Create repository**.
2. GitHub shows the repo's address, like `https://github.com/YOUR-NAME/usa-plumbing-website.git`. Copy it.
3. Open a terminal in this project folder and connect it to that address (replace with yours):

   ```bash
   git remote add origin https://github.com/YOUR-NAME/usa-plumbing-website.git
   ```

4. Upload the code:

   ```bash
   git push -u origin main
   ```

   A browser window asks you to sign in to GitHub the first time.

The repository is already created and committed locally. Private files are **not** uploaded, because `.gitignore` excludes them: passwords and keys (`.env`, `.env.local`), the local database, uploaded test images, and the bundled Node.js.

---

## Step 2: Create the backend project (API + admin panel)

1. Go to <https://vercel.com/new>, click **Import** next to your GitHub repo.
2. **Root Directory:** click *Edit* → choose **`backend`**.
3. **Framework Preset:** **Other**. Leave the build settings alone; `backend/vercel.json` sets them.
4. Click **Deploy**. **The first deploy will fail** because there's no database yet. That's expected; continue below.

### 2a. Add the database (Neon)

1. Open the backend project → **Storage** tab → **Create Database** → **Neon (Serverless Postgres)** → follow the steps.
2. On the connect screen, make sure **this backend project** is ticked, then click **Connect**.
3. Vercel adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED` automatically.

### 2b. Add image storage (Vercel Blob)

1. In the same project's **Storage** tab, choose **Create Database** → **Blob** → create it and connect it to the backend project.
2. Vercel adds `BLOB_READ_WRITE_TOKEN` automatically.

---

## Step 3: Fill the online database and get your keys

1. In Vercel, open **Storage** → your Neon database → the **`.env.local`** tab, click **Show secret**, and copy the value of **`DATABASE_URL_UNPOOLED`**.
2. On your computer, double-click **`SETUP ONLINE DATABASE.bat`** in the project folder.
3. Paste the database URL, then type the **email and name** you want for the admin login.
4. The tool:
   - creates all the tables,
   - loads the services, service areas, blog posts, pages and your keyword sheet,
   - creates your admin account and shows its **password** (save it).
5. It also saves a file **`tools/vercel-env.txt`** with secret keys for the next steps. Keep that file private.

You only do this once. Running it again later won't overwrite your data or keys.

---

## Step 4: Backend environment variables

Backend project → **Settings** → **Environment Variables**. Add these from the **Backend** section of `tools/vercel-env.txt`:

| Name | Value |
|---|---|
| `PUBLIC_API_KEY` | from the file |
| `APP_ENCRYPTION_KEY` | from the file |
| `SITE_REVALIDATE_SECRET` | from the file |
| `API_PUBLIC_URL` | your backend URL, e.g. `https://plumbing-backend.vercel.app` (shown on the project's main page) |
| `SITE_URL` | your website URL. Use `https://example.com` for now and update it after step 5 |
| `SITE_REVALIDATE_URL` | `<website URL>/api/revalidate`. Update it after step 5 |

Optional variables:

- **Email:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and `MAIL_FROM`. These are needed for password-reset emails and new-lead notifications.
- **Lead emails:** `LEAD_NOTIFY_EMAILS`, the address(es) that receive new leads.

Then go to **Deployments** → open the ⋯ menu on the latest one → **Redeploy**.

✅ **Admin panel is live:** open `https://YOUR-BACKEND.vercel.app/admin` and sign in with the email and password from step 3. Change the password right away in **My account**.

---

## Step 5: Create the website project

1. Go to <https://vercel.com/new> → **Import** the **same** repo again.
2. **Root Directory:** leave it as **`./`**. Vercel detects **Next.js** automatically.
3. Before clicking Deploy, open **Environment Variables** and add these from the **Website** section of `tools/vercel-env.txt`:

| Name | Value |
|---|---|
| `BACKEND_API_URL` | your backend URL, e.g. `https://plumbing-backend.vercel.app` |
| `BACKEND_API_KEY` | from the file (same as `PUBLIC_API_KEY`) |
| `REVALIDATE_SECRET` | from the file (same as `SITE_REVALIDATE_SECRET`) |
| `NEXT_PUBLIC_SITE_URL` | your website URL, e.g. `https://plumbing-site.vercel.app`, or your own domain later |
| `CONTENT_REVALIDATE_SECONDS` | `300` |

4. Click **Deploy**. ✅ The website is live.

### 5a. Connect the two

Go back to the **backend** project → Settings → Environment Variables:

1. Set `SITE_URL` to the website URL.
2. Set `SITE_REVALIDATE_URL` to `<website URL>/api/revalidate`.
3. **Redeploy** the backend.

From now on, edits in the admin panel appear on the website within seconds.

---

## Step 6: Your own domain (optional)

1. Website project → **Settings → Domains** → add `www.yourdomain.com` and follow the DNS instructions.
2. Update `NEXT_PUBLIC_SITE_URL` (website) and `SITE_URL` / `SITE_REVALIDATE_URL` (backend), then redeploy both.
3. Optional: give the admin its own subdomain, like `admin.yourdomain.com` on the backend project. Then update `API_PUBLIC_URL`.

---

## Updating the site later

Any change you `git push` to GitHub redeploys both projects automatically. Content changes are made in the admin panel and need no redeploy.

## Troubleshooting

| Problem | Fix |
|---|---|
| Backend deploy fails with "migrate deploy" / database error | The Neon database isn't connected to the backend project (step 2a), or `DATABASE_URL_UNPOOLED` is missing. |
| Backend build can't find `../admin` | Backend project → Settings → General → Root Directory → enable **"Include files outside the root directory in the Build Step"**. |
| `/admin` shows an error after login | Check `APP_ENCRYPTION_KEY` and `PUBLIC_API_KEY` are set on the backend, then redeploy. |
| Website build fails fetching content | The backend must be deployed and working first. Check that `BACKEND_API_URL` has no trailing `/` and `BACKEND_API_KEY` equals the backend's `PUBLIC_API_KEY`. |
| Admin edits don't appear on the website | `SITE_REVALIDATE_URL` / `SITE_REVALIDATE_SECRET` on the backend must match the website's URL / `REVALIDATE_SECRET` (step 5a). |
| Image upload fails | Connect a Blob store to the backend project (step 2b). Images are limited to 4 MB on Vercel. |
| Forgot admin password | Run `SETUP ONLINE DATABASE.bat` again with the same email. It won't create a duplicate. Or ask another Owner to reset it in **Users**. |

## Good to know

- **Rate limits** on login and forms are counted per Vercel server instance. For stricter limits under heavy traffic, add Upstash Redis later.
- **Local copy:** the local version (`START WEBSITE.bat`) keeps its own separate database and doesn't affect the live site.
