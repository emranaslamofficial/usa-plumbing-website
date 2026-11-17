import { z } from "zod";

/** All configuration is read and validated once at startup. The process exits on invalid config. */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  /** Public origin of this API (used to build absolute media URLs). */
  API_PUBLIC_URL: z.string().url().default(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  /** The Next.js website origin (CORS + password-reset links point to the admin on this API). */
  /** The public website URL (on Vercel: your domain). Defaults to the Vercel deployment URL. */
  SITE_URL: z.string().url().default(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  /** Extra origins allowed to call the admin API with credentials (comma separated), e.g. Vite dev server. */
  CORS_ORIGINS: z.string().default("http://localhost:5173"),

  /** Server-to-server key the Next.js site uses for /api/v1/public/* (Bearer). */
  PUBLIC_API_KEY: z.string().min(24, "PUBLIC_API_KEY must be at least 24 characters"),
  /** 32-byte key (64 hex chars) for encrypting 2FA secrets and hashing IPs. */
  APP_ENCRYPTION_KEY: z.string().regex(/^[0-9a-f]{64}$/i, "APP_ENCRYPTION_KEY must be 64 hex characters"),

  SESSION_TTL_HOURS: z.coerce.number().positive().default(12),
  SESSION_IDLE_MINUTES: z.coerce.number().positive().default(120),
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),

  /** Website revalidation hook (Next.js /api/revalidate) */
  SITE_REVALIDATE_URL: z.string().url().optional().or(z.literal("")),
  SITE_REVALIDATE_SECRET: z.string().optional(),

  // Local-disk uploads (only used when no Vercel Blob store is connected)
  UPLOAD_DIR: z.string().default("backend/uploads"),
  // Vercel functions accept request bodies up to 4.5 MB
  UPLOAD_MAX_MB: z.coerce.number().positive().default(process.env.VERCEL ? 4 : 8),
  /** Set automatically when a Vercel Blob store is connected — uploads then go to Blob storage. */
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default("Website <no-reply@example.com>"),
  LEAD_NOTIFY_EMAILS: z.string().default(""),

  /** Shared secret used to verify call-tracking provider webhooks (HMAC-SHA256). */
  CALL_TRACKING_WEBHOOK_SECRET: z.string().optional(),

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  /** Number of proxy hops in front of the app ("1" on Vercel), or "loopback"/a subnet list. Never "true" (lets clients spoof IPs). */
  TRUST_PROXY: z.string().default(process.env.VERCEL ? "1" : "loopback"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  for (const issue of parsed.error.issues) console.error(`   ${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Invalid environment configuration: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`);
}

// One-server setup: the website's cache-refresh endpoint is on this same site.
const siteUrl = parsed.data.SITE_URL.replace(/\/$/, "");
export const env = {
  ...parsed.data,
  SITE_REVALIDATE_URL: parsed.data.SITE_REVALIDATE_URL || `${siteUrl}/api/revalidate`,
  SITE_REVALIDATE_SECRET: parsed.data.SITE_REVALIDATE_SECRET || process.env.REVALIDATE_SECRET,
  isProd: parsed.data.NODE_ENV === "production",
  cookieSecure: parsed.data.COOKIE_SECURE ?? parsed.data.NODE_ENV === "production",
  corsOrigins: parsed.data.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
};
