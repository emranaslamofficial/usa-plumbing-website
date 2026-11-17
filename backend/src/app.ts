import express, { Router, type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import path from "node:path";
import { existsSync } from "node:fs";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { AppError, zodDetails } from "./lib/http.js";
import { prisma, Prisma } from "./db.js";
import { requireAuth } from "./auth/session.js";
import { authRouter } from "./modules/auth.routes.js";
import { publicRouter, webhooksRouter } from "./modules/public.routes.js";
import { servicesRouter } from "./modules/services.routes.js";
import { areasRouter } from "./modules/areas.routes.js";
import { postsRouter } from "./modules/posts.routes.js";
import { pagesRouter } from "./modules/pages.routes.js";
import { leadsRouter, contactMessagesRouter } from "./modules/leads.routes.js";
import { mediaRouter, UPLOAD_ROOT } from "./modules/media.routes.js";
import { settingsRouter } from "./modules/settings.routes.js";
import { usersRouter, rolesRouter } from "./modules/users.routes.js";
import { keywordsRouter } from "./modules/keywords.routes.js";
import {
  serviceCategoriesRouter,
  blogCategoriesRouter,
  tagsRouter,
  authorsRouter,
  faqsRouter,
  testimonialsRouter,
  redirectsRouter,
  statesRouter,
  auditRouter,
  dashboardRouter,
  analyticsRouter,
  seoRouter,
} from "./modules/misc.routes.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  // Numeric = hop count (e.g. 1 behind Vercel); otherwise "loopback" or a subnet list
  app.set("trust proxy", /^\d+$/.test(env.TRUST_PROXY) ? Number(env.TRUST_PROXY) : env.TRUST_PROXY === "false" ? false : env.TRUST_PROXY);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "blob:", "https://*.public.blob.vercel-storage.com"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: env.isProd ? [] : null,
        },
      },
      crossOriginResourcePolicy: { policy: "cross-origin" }, // media is embedded by the website
    }),
  );
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url?.startsWith("/media/") || req.url === "/health" || false } }));

  // Webhooks need the raw body for signature checks → mount before JSON parsing
  app.use("/api/v1/webhooks", webhooksRouter);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));
  app.use(cookieParser());

  app.get("/health", async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  });

  // Uploaded images: immutable, sniff-proof, never executed
  app.use(
    "/media",
    express.static(UPLOAD_ROOT, {
      immutable: true,
      maxAge: "365d",
      index: false,
      dotfiles: "deny",
      setHeaders: (res) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
      },
    }),
  );

  // ── API ──
  const api = Router();
  api.use("/public", publicRouter);
  api.use("/auth", cors({ origin: env.corsOrigins, credentials: true }), authRouter);

  const admin = Router();
  admin.use(cors({ origin: env.corsOrigins, credentials: true }));
  admin.use(requireAuth());
  admin.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  admin.use("/dashboard", dashboardRouter);
  admin.use("/analytics", analyticsRouter);
  admin.use("/leads", leadsRouter);
  admin.use("/contact-messages", contactMessagesRouter);
  admin.use("/services", servicesRouter);
  admin.use("/service-categories", serviceCategoriesRouter);
  admin.use("/service-areas", areasRouter);
  admin.use("/states", statesRouter);
  admin.use("/posts", postsRouter);
  admin.use("/blog-categories", blogCategoriesRouter);
  admin.use("/tags", tagsRouter);
  admin.use("/authors", authorsRouter);
  admin.use("/pages", pagesRouter);
  admin.use("/faqs", faqsRouter);
  admin.use("/testimonials", testimonialsRouter);
  admin.use("/media", mediaRouter);
  admin.use("/settings", settingsRouter);
  admin.use("/users", usersRouter);
  admin.use("/roles", rolesRouter);
  admin.use("/redirects", redirectsRouter);
  admin.use("/audit-logs", auditRouter);
  admin.use("/keywords", keywordsRouter);
  admin.use("/seo", seoRouter);
  api.use("/admin", admin);

  api.use((_req, _res, next) => next(new AppError(404, "NOT_FOUND", "Endpoint not found")));
  app.use("/api/v1", api);

  // ── Admin panel SPA (built by /admin → admin/dist) ──
  const adminDist = path.resolve(process.env.ADMIN_DIST ?? "../admin/dist");
  if (existsSync(adminDist)) {
    app.use("/admin", express.static(adminDist, { index: false, maxAge: "1h" }));
    app.get(/^\/admin(\/.*)?$/, (_req, res) => {
      res.setHeader("Cache-Control", "no-store");
      res.sendFile(path.join(adminDist, "index.html"));
    });
  }
  app.get("/", (_req, res) => res.redirect("/admin"));

  // ── Errors ──
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    let status = 500;
    let code = "INTERNAL_ERROR";
    let message = "Something went wrong. Please try again.";
    let details: unknown;

    if (err instanceof AppError) ({ status, code, message, details } = err);
    else if (err instanceof ZodError) [status, code, message, details] = [422, "VALIDATION_ERROR", "Invalid input", zodDetails(err)];
    else if (err instanceof MulterError) [status, code, message] = [err.code === "LIMIT_FILE_SIZE" ? 413 : 400, err.code, err.code === "LIMIT_FILE_SIZE" ? `File is too large (max ${env.UPLOAD_MAX_MB} MB)` : err.message];
    else if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") [status, code, message] = [409, "CONFLICT", "A record with this value already exists"];
      else if (err.code === "P2025") [status, code, message] = [404, "NOT_FOUND", "Record not found"];
      else if (err.code === "P2003") [status, code, message] = [409, "CONFLICT", "This record is linked to other records"];
    } else if (err instanceof SyntaxError && "body" in (err as object)) [status, code, message] = [400, "BAD_JSON", "Malformed JSON body"];
    else if ((err as { type?: string })?.type === "entity.too.large") [status, code, message] = [413, "PAYLOAD_TOO_LARGE", "Request body too large"];

    if (status >= 500) req.log?.error({ err }, "unhandled error");
    res.status(status).json({ success: false, error: { code, message, ...(details ? { details } : {}) } });
  });

  return app;
}
