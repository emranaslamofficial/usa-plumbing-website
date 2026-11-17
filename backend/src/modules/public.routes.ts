import { Router, raw } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { z } from "zod";
import { prisma, type Prisma } from "../db";
import { clientIp, requirePublicKey } from "../auth/session";
import { parse } from "../lib/validate";
import { AppError, badRequest, created, notFound, ok, unauthorized } from "../lib/http";
import { hmac, safeEqual } from "../lib/crypto";
import { env } from "../config/env";
import { createHmac } from "node:crypto";
import * as pub from "./public.service";

/**
 * Public REST API (Bearer PUBLIC_API_KEY). The website itself calls public.service.ts
 * in-process; these routes are for external/headless use and server-to-server clients.
 * All logic lives in public.service.ts.
 */
export const publicRouter = Router();
publicRouter.use(requirePublicKey);

const limiter = (limit: number, windowMin: number) =>
  rateLimit({
    windowMs: windowMin * 60_000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(clientIp(req)),
    message: { success: false, error: { code: "RATE_LIMITED", message: "Too many submissions. Please call us instead." } },
  });

const found = <T>(v: T | null, what: string) => {
  if (!v) throw notFound(what);
  return v;
};
const slug = (v: unknown) => String(v).slice(0, 200);

publicRouter.get("/settings", async (_req, res) => ok(res, await pub.getSettings()));
publicRouter.get("/services", async (_req, res) => ok(res, await pub.listServices()));
publicRouter.get("/services/:slug", async (req, res) => ok(res, found(await pub.getService(slug(req.params.slug)), "Service")));
publicRouter.get("/locations", async (_req, res) => ok(res, await pub.listLocations()));
publicRouter.get("/locations/:slug", async (req, res) => ok(res, found(await pub.getLocation(slug(req.params.slug)), "Location")));

publicRouter.get("/posts", async (req, res) => {
  if (typeof req.query.slugs === "string") return ok(res, { items: await pub.getPostsBySlugs(req.query.slugs.slice(0, 2000).split(",")) });
  ok(res, await pub.listPosts(parse(pub.postQuerySchema, req.query)));
});
publicRouter.get("/posts/slugs", async (_req, res) => ok(res, await pub.listPostSlugs()));
publicRouter.get("/posts/featured", async (_req, res) => ok(res, await pub.listFeaturedPosts()));
publicRouter.get("/posts/popular", async (req, res) => ok(res, await pub.listPopularPosts(Number(req.query.limit) || 4)));
publicRouter.get("/posts/:slug", async (req, res) => ok(res, found(await pub.getPost(slug(req.params.slug)), "Post")));
publicRouter.get("/posts/:slug/related", async (req, res) => ok(res, await pub.listRelatedPosts(slug(req.params.slug), Number(req.query.limit) || 3)));
publicRouter.get("/blog-categories", async (_req, res) => ok(res, await pub.listBlogCategories()));
publicRouter.get("/authors/:id", async (req, res) => ok(res, found(await pub.getAuthor(slug(req.params.id)), "Author")));

publicRouter.get("/pages", async (_req, res) => ok(res, await pub.listPageSlugs()));
publicRouter.get("/pages/:slug", async (req, res) => ok(res, found(await pub.getPage(slug(req.params.slug)), "Page")));
publicRouter.get("/faqs", async (req, res) => {
  const { group } = parse(z.object({ group: z.string().regex(/^[a-z0-9-]+$/).max(40) }), req.query);
  ok(res, await pub.listFaqs(group));
});
publicRouter.get("/testimonials", async (_req, res) => ok(res, await pub.listTestimonials()));
publicRouter.get("/redirects", async (_req, res) => ok(res, await pub.listRedirects()));
publicRouter.post("/redirects/hit", async (req, res) => {
  const { source } = parse(z.object({ source: z.string().max(500) }), req.body);
  await pub.recordRedirectHit(source);
  ok(res, { recorded: true });
});
publicRouter.get("/robots", async (_req, res) => ok(res, await pub.getRobots()));

function rethrow(err: unknown): never {
  if (err instanceof pub.PublicInputError) throw new AppError(err.status, err.status === 429 ? "RATE_LIMITED" : "VALIDATION_ERROR", err.message, err.details);
  throw err;
}

publicRouter.post("/leads", limiter(5, 10), async (req, res) => {
  const meta = { ip: clientIp(req), userAgent: req.get("x-client-user-agent") ?? req.get("user-agent") };
  created(res, await pub.submitLead(req.body, meta).catch(rethrow));
});

publicRouter.post("/track/cta", limiter(60, 10), async (req, res) => {
  const meta = { ip: clientIp(req), userAgent: req.get("x-client-user-agent") ?? "" };
  await pub.recordCtaClick(req.body, meta).catch(rethrow);
  created(res, { recorded: true });
});

// ── Call-tracking provider webhook (not behind the public key; HMAC-verified instead) ──

export const webhooksRouter = Router();

const callSchema = z.object({
  providerCallId: z.string().min(1).max(200),
  trackingNumber: z.string().max(30).optional(),
  callerNumber: z.string().max(30).optional(),
  status: z.enum(["answered", "missed", "voicemail", "busy", "failed"]),
  durationSeconds: z.number().int().nonnegative().optional(),
  startedAt: z.coerce.date(),
  /** visitorId / click id passed through the provider's dynamic number insertion, if supported */
  clickId: z.string().max(64).optional(),
});

/**
 * POST /webhooks/calls/:provider
 * Header X-Signature: hex HMAC-SHA256 of the raw body using CALL_TRACKING_WEBHOOK_SECRET.
 * Provider-specific payloads should be mapped to `callSchema` in an adapter here.
 */
webhooksRouter.post("/calls/:provider", raw({ type: "application/json", limit: "100kb" }), async (req, res) => {
  const secret = env.CALL_TRACKING_WEBHOOK_SECRET;
  if (!secret) throw new AppError(503, "NOT_CONFIGURED", "Call tracking is not configured");
  const rawBody = req.body instanceof Buffer ? req.body : Buffer.from("");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!safeEqual(expected, String(req.get("x-signature") ?? ""))) throw unauthorized("Invalid signature");
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw badRequest("Invalid JSON");
  }
  const provider = z.string().regex(/^[a-z0-9-]{2,30}$/).parse(req.params.provider);
  const d = parse(callSchema, payload);
  const click = d.clickId ? await prisma.ctaClickEvent.findFirst({ where: { OR: [{ id: d.clickId }, { visitorId: d.clickId }] }, orderBy: { createdAt: "desc" } }) : null;
  await prisma.callEvent.upsert({
    where: { provider_providerCallId: { provider, providerCallId: d.providerCallId } },
    create: {
      provider,
      providerCallId: d.providerCallId,
      trackingNumber: d.trackingNumber,
      callerNumberHash: d.callerNumber ? hmac(d.callerNumber.replace(/\D/g, "")) : null,
      status: d.status,
      durationSeconds: d.durationSeconds,
      startedAt: d.startedAt,
      attributedClickId: click?.id,
      rawPayload: payload as Prisma.InputJsonValue,
    },
    update: { status: d.status, durationSeconds: d.durationSeconds },
  });
  ok(res, { received: true });
});
