// Runs first in the Vercel build. Stops with a clear message if required settings are missing,
// instead of a confusing error later in the build.

const problems = [];
const has = (k) => Boolean(process.env[k]?.trim());

if (!has("DATABASE_URL") && !has("DATABASE_URL_UNPOOLED")) {
  problems.push("DATABASE_URL is missing -> connect a Neon database: Project > Storage > Create Database > Neon > Connect (guide step 2).");
}
if (!has("PUBLIC_API_KEY") || process.env.PUBLIC_API_KEY.trim().length < 24) {
  problems.push("PUBLIC_API_KEY is missing or too short -> copy it from tools/vercel-env.txt into Settings > Environment Variables (guide step 4).");
}
if (!/^[0-9a-f]{64}$/i.test(process.env.APP_ENCRYPTION_KEY?.trim() ?? "")) {
  problems.push("APP_ENCRYPTION_KEY is missing or not 64 hex characters -> copy it from tools/vercel-env.txt (guide step 4).");
}
if (!has("REVALIDATE_SECRET")) {
  problems.push("REVALIDATE_SECRET is missing -> copy it from tools/vercel-env.txt (guide step 4).");
}

if (problems.length) {
  console.error("\n==================== BUILD STOPPED: SETTINGS MISSING ====================");
  for (const p of problems) console.error(" x " + p);
  console.error("\nAfter adding them: Deployments > (latest) > ... > Redeploy.");
  console.error("Guide: docs/DEPLOY-VERCEL.md");
  console.error("==========================================================================\n");
  process.exit(1);
}

const warn = [];
if (!has("BLOB_READ_WRITE_TOKEN")) warn.push("BLOB_READ_WRITE_TOKEN not set -> image uploads in the admin will fail on Vercel. Connect a Blob store (guide step 2).");
if (!has("SITE_URL") && !has("NEXT_PUBLIC_SITE_URL")) warn.push("SITE_URL / NEXT_PUBLIC_SITE_URL not set -> using the Vercel address. Set them to your domain later.");
for (const w of warn) console.warn(" ! " + w);
console.log("Environment check passed.");
