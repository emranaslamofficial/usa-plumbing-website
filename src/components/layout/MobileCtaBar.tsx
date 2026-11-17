import Link from "next/link";
import { Phone, ClipboardList } from "lucide-react";
import { telHref } from "@/lib/utils";

/** Sticky bottom CTA bar on mobile/tablet: CALL NOW | REQUEST SERVICE. */
export function MobileCtaBar({ phone }: { phone: { display: string; e164: string } }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200/70 bg-white/95 px-3 pt-2.5 shadow-[0_-8px_24px_-12px_rgb(15_26_49/0.25)] backdrop-blur-md pb-[max(0.625rem,env(safe-area-inset-bottom))] lg:hidden"
      role="region"
      aria-label="Quick contact"
    >
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-2.5">
        <a
          href={telHref(phone.e164)}
          aria-label={`Call now at ${phone.display}`}
          data-cta="call-mobile-bar"
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent-400 font-bold text-ink-950 shadow-cta transition-transform active:scale-[0.97]"
        >
          <Phone aria-hidden="true" className="size-[1.1rem]" />
          Call Now
        </a>
        <Link
          href="/request-service"
          data-cta="request-mobile-bar"
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 font-bold text-white transition-transform active:scale-[0.97]"
        >
          <ClipboardList aria-hidden="true" className="size-[1.1rem]" />
          Request Service
        </Link>
      </div>
    </div>
  );
}
