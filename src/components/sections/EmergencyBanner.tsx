import { TriangleAlert } from "lucide-react";
import type { SiteSettings } from "@/types";
import { CallButton, ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";

export function EmergencyBanner({ settings, compact = false }: { settings: SiteSettings; compact?: boolean }) {
  return (
    <section aria-labelledby="emergency-heading" className={compact ? "" : "py-16 sm:py-20"}>
      <div className={compact ? "" : "container-x"}>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
            <div aria-hidden="true" className="absolute -right-24 -top-24 size-80 rounded-full bg-accent-500/15 blur-3xl" />
            <div aria-hidden="true" className="absolute -bottom-32 left-10 size-80 rounded-full bg-brand-600/25 blur-3xl" />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div className="flex gap-5">
                <span className="relative hidden size-14 shrink-0 place-items-center rounded-2xl bg-accent-400 text-ink-950 sm:grid">
                  <span aria-hidden="true" className="absolute inset-0 rounded-2xl bg-accent-400 motion-safe:animate-pulse-ring" />
                  <TriangleAlert aria-hidden="true" className="relative size-7" />
                </span>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-accent-300">
                    {settings.emergency.available ? settings.emergency.label : "Urgent plumbing help"}
                  </p>
                  <h2 id="emergency-heading" className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                    Plumbing Emergency?
                  </h2>
                  <p className="mt-3 max-w-xl text-lg text-ink-200">
                    Don&apos;t wait for a small leak to become major damage. Shut off your main water valve if you can, then call us for fast
                    help with burst pipes, backups and water heater failures.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <CallButton phone={settings.phone} label="Call Now" showNumber size="lg" attention />
                <ButtonLink href="/emergency-plumbing" variant="outline-light" size="lg">
                  What to do right now
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
