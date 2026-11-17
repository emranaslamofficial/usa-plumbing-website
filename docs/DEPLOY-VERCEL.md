# Deploying to Vercel (one project, one domain)

Everything runs as **one Vercel project** on **one domain**:

| URL | What |
|---|---|
| `https://your-site.com` | Website |
| `https://your-site.com/admin` | Admin panel |
| `https://your-site.com/api/v1/…` | Backend API (used by the admin panel) |

You also need two storage add-ons, created inside Vercel (free plans available):

- **Neon Postgres**, the database for leads, services, the blog and settings.
- **Vercel Blob**, which stores images uploaded in the admin panel.

The code is already on GitHub: `emranaslamofficial/usa-plumbing-website`.

---

## Step 1: Create the Vercel project

1. Go to <https://vercel.com/new> and sign in with GitHub.
2. Click **Import** next to `usa-plumbing-website`.
3. Leave **Root Directory** as `./`. The Framework is detected as **Next.js**; leave the build settings alone, since `vercel.json` sets them.
4. Click **Deploy**. **This first deploy will fail** because there's no database yet. That's expected; continue below.

## Step 2: Add the database and image storage

On the project page, open the **Storage** tab:

1. **Create Database → Neon (Serverless Postgres)** → follow the steps → **Connect** it to this project.
   This adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED` automatically.
2. **Create Database → Blob** → create it → **Connect** it to this project.
   This adds `BLOB_READ_WRITE_TOKEN` automatically.

## Step 3: Fill the online database and get your keys (on your computer)

1. In Vercel, open **Storage → your Neon database → `.env.local` tab → Show secret**, and copy the value of **`DATABASE_URL_UNPOOLED`**.
2. Double-click **`SETUP ONLINE DATABASE.bat`** in the project folder.
3. Paste the database URL, then type the email and name for your admin login.
4. The tool:
   - creates the tables,
   - loads the services, service areas, blog posts, pages and your keyword sheet,
   - creates your admin account and shows its **password** (save it).
5. It also writes **`tools/vercel-env.txt`** with secret keys for the next step. Keep that file private.

## Step 4: Environment variables

Vercel project → **Settings → Environment Variables**. Add each line from `tools/vercel-env.txt`:

| Name | Value |
|---|---|
| `PUBLIC_API_KEY` | from the file |
| `APP_ENCRYPTION_KEY` | from the file. **Never change it after launch.** |
| `REVALIDATE_SECRET` | from the file |
| `CONTENT_REVALIDATE_SECONDS` | `300` |
| `NEXT_PUBLIC_SITE_URL` | your site address, e.g. `https://usa-plumbing-website.vercel.app` (shown on the project page) |
| `SITE_URL` | same as above |

Optional:

- **Email:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`. Without these, password-reset emails and new-lead emails aren't sent.
- **Lead notifications:** `LEAD_NOTIFY_EMAILS` is the address(es) that get new leads. You can also set this later in Admin → System.

## Step 5: Deploy

Go to **Deployments** → open the **⋯** menu on the latest deployment → **Redeploy**.

✅ **Website:** `https://your-project.vercel.app`
✅ **Admin panel:** `https://your-project.vercel.app/admin`. Sign in with the email and password from step 3, then change the password in **My account**.

---

## Your own domain (optional)

1. Project → **Settings → Domains** → add `www.yourdomain.com` and follow the DNS steps.
2. Change `NEXT_PUBLIC_SITE_URL` and `SITE_URL` to `https://www.yourdomain.com`, then redeploy.

The admin panel then lives at `https://www.yourdomain.com/admin`.

## Updating later

- **Code changes:** every `git push` to GitHub redeploys automatically. Database changes (migrations) apply during the build.
- **Content changes:** services, blog, prices, phone, hours and so on are edited in the admin panel and need no redeploy.

## Troubleshooting

| Problem | Fix |
|---|---|
| Deploy fails at `prisma migrate deploy` | The Neon database isn't connected to the project (step 2). |
| Deploy fails with "Invalid environment configuration: PUBLIC_API_KEY, APP_ENCRYPTION_KEY" | Add the step 4 variables, then redeploy. |
| Website shows no content | The database is empty. Run `SETUP ONLINE DATABASE.bat` (step 3), then redeploy. |
| Admin edits don't show on the site | Check `REVALIDATE_SECRET` and `SITE_URL` are set (step 4). |
| Image upload fails | Connect a Blob store (step 2). Images must be under 4 MB on Vercel. |
| Forgot admin password | Run `SETUP ONLINE DATABASE.bat` again with the same email. It resets the password and keeps your content. |

**Note:** login and form rate limits are counted per Vercel server instance. For stricter limits under heavy traffic, add Upstash Redis later.
