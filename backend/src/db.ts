import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";
import { env } from "./config/env.js";

export const prisma = new PrismaClient({
  // Small pool: on Vercel every function instance has its own pool (use the pooled Neon URL)
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL, max: process.env.VERCEL ? 3 : 10 }),
  log: env.isProd ? ["error"] : ["error", "warn"],
});

export * from "./generated/prisma/client.js";
