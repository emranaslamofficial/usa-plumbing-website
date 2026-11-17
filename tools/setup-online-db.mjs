// One-time setup of the ONLINE database (e.g. Neon) used by the live site on Vercel.
//  1. creates all tables (prisma migrate deploy)
//  2. loads roles, website content and the keyword sheet (seed)
//  3. creates the Owner admin account with a strong generated password
//  4. generates the secret keys to paste into Vercel → saved to tools/vercel-env.txt
// Run it by double-clicking "SETUP ONLINE DATABASE.bat".

import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BACKEND = path.join(ROOT, "backend");
const OUT = path.join(ROOT, "tools", "vercel-env.txt");
const rl = readline.createInterface({ input: process.stdin, terminal: false });
const lines = rl[Symbol.asyncIterator]();
/** Works both when typing and when input is piped. */
async function ask(q) {
  process.stdout.write(q);
  const { value } = await lines.next();
  return value ?? "";
}

console.log("\n=== Online database setup (for Vercel) ===\n");
console.log("Paste the DIRECT (unpooled) connection string from Neon.");
console.log("In Vercel: Storage -> your Neon database -> .env.local tab -> DATABASE_URL_UNPOOLED");
console.log("It looks like: postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require\n");

const dbUrl = (await ask("Database URL: ")).trim();
if (!/^postgres(ql)?:\/\//.test(dbUrl)) {
  console.log("\nThat doesn't look like a PostgreSQL URL. Nothing was changed.");
  process.exit(1);
}
const email = (await ask("Admin email (you will log in with this): ")).trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.log("\nInvalid email. Nothing was changed.");
  process.exit(1);
}
const name = (await ask("Admin name: ")).trim() || "Site Owner";
rl.close();

const adminPassword = randomBytes(15).toString("base64url");
const env = { ...process.env, DATABASE_URL: dbUrl, DATABASE_URL_UNPOOLED: dbUrl };
delete env.ADMIN_EMAIL;
delete env.ADMIN_PASSWORD;

function run(label, args, extraEnv = {}) {
  console.log(`\n> ${label}...`);
  const r = spawnSync(process.execPath, args, { cwd: BACKEND, env: { ...env, ...extraEnv }, stdio: "inherit" });
  if (r.status !== 0) {
    console.log(`\nFAILED: ${label}. Check the database URL and your internet connection, then run this again.`);
    process.exit(1);
  }
}

run("Creating tables", [path.join(BACKEND, "node_modules/prisma/build/index.js"), "migrate", "deploy"]);
if (!existsSync(path.join(BACKEND, "src/generated/prisma/client.ts"))) run("Generating database client", [path.join(BACKEND, "node_modules/prisma/build/index.js"), "generate"]);
run("Loading content, roles and keywords", [path.join(BACKEND, "node_modules/tsx/dist/cli.mjs"), "prisma/seed.ts"]);
// Creates the Owner account, or resets its password if it already exists, so the password shown below always works
run("Creating admin account", [path.join(BACKEND, "node_modules/tsx/dist/cli.mjs"), "scripts/create-admin.ts", "--email", email, "--name", name, "--reset"], { ADMIN_PASSWORD: adminPassword });

// Secrets for Vercel (kept if the file already exists, so re-running doesn't break a live site)
let secrets = { PUBLIC_API_KEY: randomBytes(32).toString("base64url"), APP_ENCRYPTION_KEY: randomBytes(32).toString("hex"), REVALIDATE_SECRET: randomBytes(24).toString("base64url") };
if (existsSync(OUT)) {
  const old = readFileSync(OUT, "utf8");
  for (const k of Object.keys(secrets)) {
    const m = old.match(new RegExp(`^${k}=(.+)$`, "m"));
    if (m) secrets[k] = m[1].trim();
  }
}

const text = `# Values for Vercel — KEEP PRIVATE. Never commit or share this file.
# Generated ${new Date().toISOString()}

# Admin login (change the password after first login: My account)
#   email:    ${email}
#   password: ${adminPassword}

# ===== Backend project (root directory: backend) — Settings -> Environment Variables =====
PUBLIC_API_KEY=${secrets.PUBLIC_API_KEY}
APP_ENCRYPTION_KEY=${secrets.APP_ENCRYPTION_KEY}
SITE_REVALIDATE_SECRET=${secrets.REVALIDATE_SECRET}
API_PUBLIC_URL=https://YOUR-BACKEND.vercel.app
SITE_URL=https://YOUR-WEBSITE.vercel.app
SITE_REVALIDATE_URL=https://YOUR-WEBSITE.vercel.app/api/revalidate
# DATABASE_URL, DATABASE_URL_UNPOOLED -> added automatically when you connect the Neon database
# BLOB_READ_WRITE_TOKEN               -> added automatically when you connect a Blob store

# ===== Website project (root directory: ./) — Settings -> Environment Variables =====
BACKEND_API_KEY=${secrets.PUBLIC_API_KEY}
REVALIDATE_SECRET=${secrets.REVALIDATE_SECRET}
BACKEND_API_URL=https://YOUR-BACKEND.vercel.app
NEXT_PUBLIC_SITE_URL=https://YOUR-WEBSITE.vercel.app
CONTENT_REVALIDATE_SECONDS=300
`;
writeFileSync(OUT, text);

console.log("\n=========================================================");
console.log(" Online database is ready.");
console.log(` Admin email:    ${email}`);
console.log(` Admin password: ${adminPassword}`);
console.log(" (Save this password now. Change it after first login.)");
console.log(`\n Secret keys for Vercel were saved to:\n   ${OUT}`);
console.log("=========================================================\n");
