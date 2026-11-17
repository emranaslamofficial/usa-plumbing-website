// One-window launcher (no global Node/Postgres install needed). Starts:
//   1. PostgreSQL (embedded, port 5433)
//   2. ONE Next.js server on port 3000 serving the website, the admin panel (/admin) and the API (/api/v1)
// Rebuilds the admin panel / website automatically when their source code changed.
// Press Ctrl+C (or close the window) to stop; the database shuts down cleanly.
// Logs are also written to tools/logs/run.log.

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, appendFileSync, statSync, readdirSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ADMIN = path.join(ROOT, "admin");
const BACKEND = path.join(ROOT, "backend");
const NODE = process.execPath;
const BIN = (p) => path.join(ROOT, "node_modules", p);
const LOG_DIR = path.join(ROOT, "tools", "logs");
mkdirSync(LOG_DIR, { recursive: true });
const LOG = path.join(LOG_DIR, "run.log");
appendFileSync(LOG, `\n===== ${new Date().toISOString()} start =====\n`);

const color = { db: "\x1b[35m", web: "\x1b[32m", build: "\x1b[36m", run: "\x1b[33m" };
function log(tag, msg) {
  for (const line of String(msg).split(/\r?\n/)) {
    if (!line.trim()) continue;
    process.stdout.write(`${color[tag] ?? ""}[${tag}]\x1b[0m ${line}\n`);
    appendFileSync(LOG, `[${tag}] ${line.replace(/\x1b\[[0-9;]*m/g, "")}\n`);
  }
}

const portOpen = (port) =>
  new Promise((resolve) => {
    const s = net.connect(port, "127.0.0.1");
    s.once("connect", () => (s.destroy(), resolve(true)));
    s.once("error", () => resolve(false));
  });

async function waitPort(port, name, seconds) {
  for (let i = 0; i < seconds; i++) {
    if (await portOpen(port)) return log("run", `${name} is up on port ${port}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${name} did not start on port ${port} within ${seconds}s - see the log lines above.`);
}

/** Runs a one-off command and waits (build / migrate). */
function runSync(tag, args, cwd = ROOT) {
  log(tag, `> ${path.basename(args[0])} ${args.slice(1).join(" ")}`);
  const r = spawnSync(NODE, args, { cwd, encoding: "utf8", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
  log(tag, (r.stdout ?? "") + (r.stderr ?? ""));
  if (r.status !== 0) throw new Error(`${tag}: command failed (${path.basename(args[0])} ${args.slice(1).join(" ")})`);
}

/** Newest modification time of any file under the given paths (skips dependencies and build output). */
function newest(paths) {
  let t = 0;
  const walk = (p) => {
    if (!existsSync(p)) return;
    const st = statSync(p);
    if (st.isDirectory()) {
      for (const e of readdirSync(p)) if (!["node_modules", "dist", ".next", "generated", ".pgdata", "uploads"].includes(e)) walk(path.join(p, e));
    } else t = Math.max(t, st.mtimeMs);
  };
  paths.forEach(walk);
  return t;
}
/** True when the build output is missing or older than its sources. */
const stale = (output, sources) => !existsSync(output) || statSync(output).mtimeMs < newest(sources);

/** True for a brand-new local database (no Business Info row yet) that still needs its content. */
function needsSeed() {
  const script = `const {Client}=require(${JSON.stringify(BIN("pg"))});const c=new Client({connectionString:"postgresql://plumbing:plumbing@localhost:5433/plumbing"});c.connect().then(()=>c.query('select count(*)::int n from "BusinessInfo"')).then(r=>{console.log(r.rows[0].n);return c.end()}).catch(()=>console.log(0))`;
  return spawnSync(NODE, ["-e", script], { encoding: "utf8" }).stdout.trim() === "0";
}

const children = [];
let pg = null;
let stopping = false;

async function shutdown() {
  if (stopping) return;
  stopping = true;
  log("run", "Stopping website and database...");
  for (const c of children) c.kill();
  if (pg) await pg.stop().catch(() => undefined);
  log("run", "Stopped.");
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("SIGHUP", shutdown); // console window closed

function openBrowser(url) {
  spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore", windowsHide: true }).unref();
}

async function main() {
  if (!existsSync(path.join(ROOT, ".env.local"))) throw new Error(".env.local is missing - copy .env.example to .env.local and fill it in.");

  // ── 1. Database ──
  if (await portOpen(5433)) log("db", "already running");
  else {
    const { default: EmbeddedPostgres } = await import(pathToFileURL(BIN("embedded-postgres/dist/index.js")).href);
    const dataDir = path.join(BACKEND, ".pgdata");
    const fresh = !existsSync(path.join(dataDir, "PG_VERSION"));
    pg = new EmbeddedPostgres({
      databaseDir: dataDir,
      user: "plumbing",
      password: "plumbing",
      port: 5433,
      persistent: true,
      initdbFlags: ["--encoding=UTF8", "--locale=C"],
      onLog: (m) => log("db", m),
      onError: (m) => log("db", m),
    });
    if (fresh) await pg.initialise();
    await pg.start();
    if (fresh) await pg.createDatabase("plumbing");
    await waitPort(5433, "Database", 60);
  }

  // ── 2. Database schema, generated client, first-run content ──
  const PRISMA = BIN("prisma/build/index.js");
  runSync("build", [PRISMA, "migrate", "deploy", "--config", "backend/prisma.config.ts"]);
  if (stale(path.join(BACKEND, "src/generated/prisma/client.ts"), [path.join(BACKEND, "prisma/schema.prisma")]))
    runSync("build", [PRISMA, "generate", "--config", "backend/prisma.config.ts"]);
  if (needsSeed()) {
    log("build", "Empty database - loading website content, roles and keywords...");
    runSync("build", [BIN("tsx/dist/cli.mjs"), "backend/prisma/seed.ts"]);
  }

  // ── 3. Admin panel → public/admin ──
  if (stale(path.join(ROOT, "public/admin/index.html"), [path.join(ADMIN, "src"), path.join(ADMIN, "index.html")])) {
    log("build", "Building the admin panel...");
    runSync("build", [path.join(ADMIN, "node_modules/vite/bin/vite.js"), "build", "--outDir", "../public/admin", "--emptyOutDir"], ADMIN);
  }

  // ── 4. Website + admin + API (one server) ──
  if (await portOpen(3000)) log("web", "already running on port 3000");
  else {
    const NEXT = BIN("next/dist/bin/next");
    if (stale(path.join(ROOT, ".next/BUILD_ID"), [path.join(ROOT, "src"), path.join(BACKEND, "src"), path.join(ROOT, "next.config.ts"), path.join(ROOT, "public")])) {
      log("build", "Building the website (about 1-2 minutes)...");
      runSync("build", [NEXT, "build"]);
    }
    const child = spawn(NODE, [NEXT, "start", "-p", "3000"], { cwd: ROOT, env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" }, windowsHide: true });
    child.stdout.on("data", (d) => log("web", d));
    child.stderr.on("data", (d) => log("web", d));
    child.on("exit", (code) => !stopping && log("run", `Website server exited (code ${code}). Check the messages above.`));
    children.push(child);
    await waitPort(3000, "Website", 90);
  }

  log("run", "");
  log("run", "*** Everything is running ***");
  log("run", "   Website      -> http://localhost:3000");
  log("run", "   Admin panel  -> http://localhost:3000/admin");
  log("run", "   Keep this window open. Press Ctrl+C to stop.");
  if (!process.argv.includes("--no-browser")) {
    openBrowser("http://localhost:3000");
    openBrowser("http://localhost:3000/admin");
  }
}

main().catch(async (err) => {
  log("run", `ERROR: ${err.message}`);
  log("run", `Full log: ${LOG}`);
  for (const c of children) c.kill();
  if (pg) await pg.stop().catch(() => undefined);
  process.exitCode = 1;
});
