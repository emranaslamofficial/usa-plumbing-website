import { CheckCircle2, MapPin } from "lucide-react";
import type { SiteSettings } from "@/types";
import { CallButton, ButtonLink } from "@/components/ui/Button";
import { HeroIllustration } from "@/components/illustrations/HeroIllustration";

/**
 * Homepage hero. Uses CSS entrance animation (not JS) so the headline — the LCP
 * element — paints immediately on first load.
 */
export function HomeHero({ settings }: { settings: SiteSettings }) {
  const points = [
    "Residential & commercial plumbing",
    settings.emergency.available ? "Emergency service available" : "Same-day appointments when available",
    "Clear pricing before work begins",
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-brand-50/40 to-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 [background:radial-gradient(60rem_30rem_at_85%_-10%,rgb(47_116_236/0.12),transparent_60%)]" />
      <div className="container-x relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:py-20">
        <div className="hero-enter">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100">
            <MapPin aria-hidden="true" className="size-4" />
            Serving {settings.serviceAreaLabel}
          </p>
          <h1 className="mt-5 text-[2.35rem] font-extrabold leading-[1.08] sm:text-5xl lg:text-[3.5rem]">
            Fast, Reliable <span className="text-brand-600">Plumbing Services</span> When You Need Them
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-500 sm:text-xl">
            Licensed local plumbers for repairs, drain cleaning, water heaters and leak detection — for homes and businesses. One call
            gets a real person and a clear plan.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <CallButton phone={settings.phone} size="lg" showNumber attention={settings.emergency.available} />
            <ButtonLink href="/request-service" variant="secondary" size="lg" arrow>
              Request Service
            </ButtonLink>
          </div>

          <ul className="mt-8 grid gap-2.5 text-[0.95rem] text-ink-600 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-emerald-500" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="hero-enter-delayed relative mx-auto w-full max-w-md lg:max-w-none">
          <div aria-hidden="true" className="absolute inset-6 rounded-[2.5rem] bg-brand-200/40 blur-2xl" />
          <div className="relative rounded-[2rem] bg-white/70 p-4 shadow-card ring-1 ring-ink-100 backdrop-blur sm:p-6">
            <HeroIllustration className="h-auto w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
