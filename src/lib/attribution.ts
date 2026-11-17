import type { Attribution } from "@/types";

/**
 * First-touch marketing attribution, kept in sessionStorage (no cookies, no PII).
 * Captured on the first page view of a visit and attached to leads and CTA clicks.
 */
const KEY = "plumb_attr";
const VISITOR = "plumb_vid";

function deviceType(): Attribution["deviceType"] {
  if (typeof navigator === "undefined") return "UNKNOWN";
  const ua = navigator.userAgent;
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "TABLET";
  if (/Mobi|iPhone|Android|Mobile/i.test(ua)) return "MOBILE";
  return "DESKTOP";
}

const clip = (v: string | null | undefined, n = 200) => (v ? v.slice(0, n) : undefined);

export function captureAttribution() {
  try {
    if (sessionStorage.getItem(KEY)) return;
    const url = new URL(window.location.href);
    const p = url.searchParams;
    const ref = document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : undefined;
    const a: Attribution = {
      landingPage: clip(url.pathname + url.search, 500),
      referrer: clip(ref, 500),
      utmSource: clip(p.get("utm_source")),
      utmMedium: clip(p.get("utm_medium")),
      utmCampaign: clip(p.get("utm_campaign")),
      utmTerm: clip(p.get("utm_term")),
      utmContent: clip(p.get("utm_content")),
    };
    sessionStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    /* storage blocked (private mode) — attribution is best-effort */
  }
}

export function getAttribution(): Attribution {
  let a: Attribution = {};
  try {
    a = JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as Attribution;
  } catch {
    /* ignore */
  }
  return { ...a, sourcePath: typeof window !== "undefined" ? window.location.pathname : undefined, deviceType: deviceType() };
}

/** Anonymous random id for this browser session — lets a call-tracking provider match clicks to calls. */
export function visitorId() {
  try {
    let id = sessionStorage.getItem(VISITOR);
    if (!id) {
      id = crypto.randomUUID().replace(/-/g, "");
      sessionStorage.setItem(VISITOR, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

export function newSubmissionKey() {
  try {
    return crypto.randomUUID().replace(/-/g, "");
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  }
}
