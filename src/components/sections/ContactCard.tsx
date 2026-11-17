import { Clock, ShieldCheck } from "lucide-react";
import type { SiteSettings } from "@/types";
import { CallButton, ButtonLink } from "@/components/ui/Button";
import { telHref } from "@/lib/utils";

/** Sidebar / hero conversion card. */
export function ContactCard({ settings, requestHref = "/request-service", title = "Talk to a plumber" }: { settings: SiteSettings; requestHref?: string; title?: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-100">
      <p className="font-display text-lg font-bold text-ink-900">{title}</p>
      <a href={telHref(settings.phone.e164)} className="mt-1 block font-display text-3xl font-extrabold tabular-nums text-brand-700 hover:text-brand-800">
        {settings.phone.display}
      </a>
      <div className="mt-5 grid gap-3">
        <CallButton phone={settings.phone} className="w-full" />
        <ButtonLink href={requestHref} variant="secondary" className="w-full">
          Request Service Online
        </ButtonLink>
      </div>
      <ul className="mt-5 space-y-2 border-t border-ink-100 pt-5 text-sm text-ink-500">
        <li className="flex items-center gap-2">
          <Clock aria-hidden="true" className="size-4 text-brand-600" />
          {settings.emergency.available ? settings.emergency.label : `${settings.hours[0]?.label} ${settings.hours[0]?.value}`}
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck aria-hidden="true" className="size-4 text-brand-600" />
          Licensed &amp; insured plumbers<span className="text-brand-600">*</span>
        </li>
      </ul>
      <p className="mt-3 text-[0.7rem] leading-snug text-ink-400">
        {settings.trustFootnote}
      </p>
    </div>
  );
}
