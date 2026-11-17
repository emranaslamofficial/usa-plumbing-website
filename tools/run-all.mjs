// One-window launcher for the whole project (no global Node/Postgres install needed).
//   1. PostgreSQL  (embedded, port 5433)   2. API + admin (port 4000)   3. Website (port 3000)
// Press Ctrl+C (or close the window) to stop everything; the database shuts down cleanly.
// Logs are also written to tools/logs/run.log.

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, appendFileSync, statSync, readdirSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BACKEND = path.join(ROOT, "backend");
const ADMIN = path.join(ROOT, "admin");
const NODE = process.execPath;
const LOG_DIR = path.join(ROOT, "tools", "logs");
mkdirSync(LOG_DIR, { recursive: true });
const LOG = path.join(LOG_DIR, "run.log");
appendFileSync(LOG, `\n===== ${new Date().toISOString()} start =====\n`);

const color = { db: "\x1b[35m", api: "\x1b[36m", web: "\x1b[32m", run: "\x1b[33m" };
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
  throw new Error(`${name} did not start on port ${port} within ${seconds}s — see the log lines above.`);
}

/** Runs a one-off command and waits (build / migrate). */
function runSync(tag, args, cwd) {
  log(tag, `> ${path.basename(args[0])} ${args.slice(1).join(" ")}`);
  const r = spawnSync(NODE, args, { cwd, encoding: "utf8", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
  log(tag, (r.stdout ?? "") + (r.stderr ?? ""));
  if (r.status !== 0) throw new Error(`${tag}: command failed (${args.join(" ")})`);
}

/** Newest modification time of any file under the given folders (skips node_modules/build output). */
function newest(paths) {
  let t = 0;
  const walk = (p) => {
    if (!existsSync(p)) return;
    const st = statSync(p);
    if (st.isDirectory()) {
      for (const e of readdirSync(p)) if (!["node_modules", "dist", ".next", "generated", ".pgdata", "uploads", "public"].includes(e)) walk(path.join(p, e));
    } else t = Math.max(t, st.mtimeMs);
  };
  paths.forEach(walk);
  return t;
}
/** True when the build output is missing or older than its sources. */
const stale = (output, sources) => !existsSync(output) || statSync(output).mtimeMs < newest(sources);

const children = [];
function startService(tag, args, cwd) {
  const child = spawn(NODE, args, { cwd, env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", FORCE_COLOR: "0" }, windowsHide: true });
  child.stdout.on("data", (d) => log(tag, d));
  child.stderr.on("data", (d) => log(tag, d));
  child.on("exit", (code) => !stopping && log("run", `${tag} exited (code ${code}). Check the messages above.`));
  children.push(child);
  return child;
}

function openBrowser(url) {
  spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore", windowsHide: true }).unref();
}

let pg = null;
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  log("run", "Stopping website, API and database...");
  for (const c of children) c.kill();
  if (pg) await pg.stop().catch(() => undefined);
  log("run", "Stopped.");
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("SIGHUP", shutdown); // console window closed

async function main() {
  // ── 1. Database ──
  if (await portOpen(5433)) log("db", "already running");
  else {
    const { default: EmbeddedPostgres } = await import(pathToFileURL(path.join(BACKEND, "node_modules/embedded-postgres/dist/index.js")).href);
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

  // ── 2. API + admin ──
  if (await portOpen(4000)) log("api", "already running");
  else {
    if (!existsSync(path.join(BACKEND, ".env"))) throw new Error("backend/.env is missing — copy backend/.env.example to backend/.env and fill it in.");
    runSync("api", [path.join(BACKEND, "node_modules/prisma/build/index.js"), "migrate", "deploy"], BACKEND);
    if (!existsSync(path.join(BACKEND, "src/generated/prisma/client.ts"))) runSync("api", [path.join(BACKEND, "node_modules/prisma/build/index.js"), "generate"], BACKEND);
    if (stale(path.join(BACKEND, "dist/server.js"), [path.join(BACKEND, "src"), path.join(BACKEND, "api")]))
      runSync("api", [path.join(BACKEND, "node_modules/esbuild/bin/esbuild"), "src/server.ts", "--bundle", "--platform=node", "--format=esm", "--packages=external", "--sourcemap", "--outfile=dist/server.js"], BACKEND);
    if (stale(path.join(ADMIN, "dist/index.html"), [path.join(ADMIN, "src"), path.join(ADMIN, "index.html")])) runSync("api", [path.join(ADMIN, "node_modules/vite/bin/vite.js"), "build"], ADMIN);
    startService("api", ["--env-file=.env", "--enable-source-maps", "dist/server.js"], BACKEND);
    await waitPort(4000, "API", 60);
  }

  // ── 3. Website ──
  if (await portOpen(3000)) log("web", "already running");
  else {
    const NEXT = path.join(ROOT, "node_modules/next/dist/bin/next");
    if (stale(path.join(ROOT, ".next/BUILD_ID"), [path.join(ROOT, "src"), path.join(ROOT, "next.config.ts"), path.join(ROOT, "public")])) {
      log("web", "Building the website (about 1 minute)...");
      runSync("web", [NEXT, "build"], ROOT);
    }
    startService("web", [NEXT, "start", "-p", "3000"], ROOT);
    await waitPort(3000, "Website", 90);
  }

  log("run", "");
  log("run", "*** Everything is running ***");
  log("run", "   Website      -> http://localhost:3000");
  log("run", "   Admin panel  -> http://localhost:4000/admin");
  log("run", "   Keep this window open. Press Ctrl+C to stop.");
  if (!process.argv.includes("--no-browser")) {
    openBrowser("http://localhost:3000");
    openBrowser("http://localhost:4000/admin");
  }
}

main().catch(async (err) => {
  log("run", `ERROR: ${err.message}`);
  log("run", `Full log: ${LOG}`);
  for (const c of children) c.kill();
  if (pg) await pg.stop().catch(() => undefined);
  process.exitCode = 1;
});
