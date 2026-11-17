// Loads the project's env files (root .env.local, then .env) for CLI scripts: prisma, seed, admin tools.
// The Next.js server loads these files itself.
import { config } from "dotenv";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
config({ path: [path.join(root, ".env.local"), path.join(root, ".env")], quiet: true });
