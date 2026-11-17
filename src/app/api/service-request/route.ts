import { NextResponse } from "next/server";
import type { ServiceRequestInput, ServiceRequestResult } from "@/types";
import { validateServiceRequest, normalizePhone, MIN_FILL_MS } from "@/lib/validation";
import { api } from "@/lib/api";
import { backendPost } from "@/lib/api/http";
import { clientIp } from "@/lib/request";

/**
 * POST /api/service-request
 *
 * Server-side boundary for lead submissions (service request + contact forms).
 * The browser never talks to the backend directly, so BACKEND_API_KEY stays on the server.
 *
 *  1. Same-origin check (CSRF defence for this cookie-less JSON endpoint)
 *  2. Validates input (never trust the client) + honeypot / fill-time spam checks
 *  3. Forwards to the backend (POST /api/v1/public/leads), which validates AGAIN,
 *     rate-limits per visitor IP, de-duplicates and stores the lead.
 *  Mock mode (no BACKEND_API_URL): validates and logs only.
 */

const json = (body: ServiceRequestResult, status = 200) => NextResponse.json(body, { status });

function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients; backend rate limits apply
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ ok: false, message: "Invalid request origin." }, 403);
  if (!req.headers.get("content-type")?.includes("application/json")) return json({ ok: false, message: "Invalid request." }, 415);

  let input: ServiceRequestInput;
  try {
    const raw = await req.text();
    if (raw.length > 20_000) return json({ ok: false, message: "Request too large." }, 413);
    input = JSON.parse(raw) as ServiceRequestInput;
  } catch {
    return json({ ok: false, message: "Invalid request." }, 400);
  }

  // Bot traps → pretend success, store nothing
  const tooFast = typeof input.startedAt === "number" && Date.now() - input.startedAt < MIN_FILL_MS;
  if (input.company || tooFast) return json({ ok: true, message: successMessage() });

  const services = await api.listServices();
  const fieldErrors = validateServiceRequest(input, services.map((s) => s.slug));
  if (Object.keys(fieldErrors).length) return json({ ok: false, message: "Please correct the highlighted fields.", fieldErrors }, 422);

  if (process.env.BACKEND_API_URL) {
    try {
      const r = await backendPost<{ referenceId: string }>(
        "/leads",
        {
          formType: input.formType === "contact" ? "contact" : "service_request",
          name: input.name,
          phone: input.phone,
          email: input.email || undefined,
          serviceSlug: input.serviceSlug,
          zip: input.zip,
          preferredDate: input.preferredDate || undefined,
          preferredTime: input.preferredTime || undefined,
          message: input.message || undefined,
          startedAt: input.startedAt,
          submissionKey: input.submissionKey,
          captchaToken: input.captchaToken,
          attribution: { ...(input.attribution ?? {}), sourcePath: input.sourcePath ?? input.attribution?.sourcePath },
        },
        { "X-Client-IP": clientIp(req), "X-Client-User-Agent": req.headers.get("user-agent")?.slice(0, 300) ?? "" },
      );
      if (r.status === 201 || r.status === 200) return json({ ok: true, referenceId: r.data?.referenceId, message: successMessage() });
      if (r.status === 422) return json({ ok: false, message: r.error?.message ?? "Please correct the highlighted fields.", fieldErrors: r.error?.details as ServiceRequestResult["fieldErrors"] }, 422);
      if (r.status === 429) return json({ ok: false, message: "Too many requests from your connection. Please call us instead." }, 429);
      throw new Error(`Backend responded ${r.status}`);
    } catch (err) {
      console.error("[service-request] backend error", err);
      return json({ ok: false, message: "We couldn't submit your request right now. Please call us so we can help." }, 502);
    }
  }

  // ── MOCK MODE ── no backend configured.
  const referenceId = `SR-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  console.info("[service-request] (mock) lead received", { referenceId, service: input.serviceSlug, zip: input.zip, phone: "***" + normalizePhone(input.phone).slice(-4) });
  return json({ ok: true, referenceId, message: successMessage() });
}

function successMessage() {
  return "A member of our team will contact you shortly to confirm your appointment.";
}
