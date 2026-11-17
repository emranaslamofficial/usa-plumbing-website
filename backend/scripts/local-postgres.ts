/**
 * Runs a real PostgreSQL server locally WITHOUT installing Postgres system-wide
 * (binaries come from the `embedded-postgres` npm package). Development only.
 *
 *   npm run db:local        → starts Postgres on port 5433, data in ./.pgdata
 *
 * DATABASE_URL=postgresql://plumbing:plumbing@localhost:5433/plumbing
 * In production use a managed PostgreSQL (Neon, Supabase, RDS, Cloud SQL...).
 */
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";

const dataDir = path.resolve(".pgdata");
const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "plumbing",
  password: "plumbing",
  port: 5433,
  persistent: true,
  // Force UTF-8 — on Windows initdb otherwise inherits the WIN1252 code page
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

const fresh = !existsSync(path.join(dataDir, "PG_VERSION"));
if (fresh) await pg.initialise();
await pg.start();
if (fresh) await pg.createDatabase("plumbing");

console.log("✅ PostgreSQL running → postgresql://plumbing:plumbing@localhost:5433/plumbing  (Ctrl+C to stop)");

const stop = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
