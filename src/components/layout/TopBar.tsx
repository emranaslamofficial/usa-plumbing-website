import { Clock, MapPin } from "lucide-react";
import type { SiteSettings } from "@/types";
import { telHref } from "@/lib/utils";

/** Slim utility bar above the header (desktop only) — reinforces availability and coverage. */
export function TopBar({ settings }: { settings: SiteSettings }) {
  return (
    <div className="hidden bg-ink-950 text-[0.8rem] text-ink-200 lg:block">
      <div className="container-x flex h-9 items-center justify-between gap-6">
        <p className="flex items-center gap-2">
          {settings.emergency.available && (
            <>
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              <span className="font-semibold text-white">{settings.emergency.label}</span>
              <span aria-hidden="true" className="text-ink-500">|</span>
            </>
          )}
          <MapPin aria-hidden="true" className="size-3.5 text-ink-400" />
          Serving {settings.serviceAreaLabel}
        </p>
        <p className="flex items-center gap-5">
          <span className="flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-3.5 text-ink-400" />
            {settings.hours[0]?.label}: {settings.hours[0]?.value}
          </span>
          <a href={telHref(settings.phone.e164)} className="font-semibold text-white hover:text-accent-300">
            {settings.phone.display}
          </a>
        </p>
      </div>
    </div>
  );
}
