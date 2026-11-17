"use client";

import { useEffect } from "react";
import { captureAttribution, getAttribution, visitorId } from "@/lib/attribution";

/**
 * Records clicks on call / request-service CTAs (one delegated listener, no per-button code).
 * A "CALL" event means a visitor tapped a tel: link — it is NOT a confirmed phone call.
 * Confirmed calls only come from a call-tracking provider webhook on the backend.
 */
export function Tracking() {
  useEffect(() => {
    captureAttribution();

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>("a[href^='tel:'], a[href^='sms:'], a[href^='mailto:'], [data-cta]");
      if (!el) return;
      const href = el.getAttribute("href") ?? "";
      const type = href.startsWith("tel:") ? "CALL" : href.startsWith("sms:") ? "SMS" : href.startsWith("mailto:") ? "EMAIL" : href.includes("/request-service") ? "REQUEST_SERVICE" : null;
      if (!type) return;
      const payload = JSON.stringify({
        type,
        placement: [el.closest("header") ? "header" : el.closest("footer") ? "footer" : "content", el.dataset.cta].filter(Boolean).join(":"),
        target: href.slice(0, 200),
        pagePath: window.location.pathname,
        visitorId: visitorId(),
        attribution: getAttribution(),
      });
      // sendBeacon survives the page switching to the phone dialer
      const sent = navigator.sendBeacon?.("/api/track", new Blob([payload], { type: "application/json" }));
      if (!sent) void fetch("/api/track", { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => undefined);
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
