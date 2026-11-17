import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/sections/PageHero";
import { CtaBand } from "@/components/sections/CtaBand";
import { CallButton, ButtonLink } from "@/components/ui/Button";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";

export async function generateMetadata(): Promise<Metadata> {
  const s = await api.getSiteSettings();
  return pageMetadata({
    title: `Plumbers Serving ${s.serviceAreaLabel}`,
    description: `See the cities and communities ${s.businessName} serves. Local plumbing repair, drain cleaning, water heaters and emergency service.`,
    path: "/service-areas",
  });
}

export default async function ServiceAreasPage() {
  const [settings, locations] = await Promise.all([api.getSiteSettings(), api.listLocations()]);

  // Group by state so the page scales to many locations managed in the admin panel.
  const byState = locations.reduce<Record<string, typeof locations>>((acc, l) => {
    (acc[l.stateName] ??= []).push(l);
    return acc;
  }, {});

  return (
    <>
      <PageHero
        crumbs={[{ name: "Service Areas", href: "/service-areas" }]}
        eyebrow="Where we work"
        title={<>Serving Homeowners &amp; Businesses Across {settings.serviceAreaLabel}</>}
        intro="Choose your city for local information, common plumbing issues in your area and the services we provide there."
        actions={
          <>
            <CallButton phone={settings.phone} size="lg" showNumber />
            <ButtonLink href="/request-service" variant="secondary" size="lg" arrow>
              Request Service
            </ButtonLink>
          </>
        }
      />

      <div className="container-x space-y-14 py-16 sm:py-20">
        {Object.entries(byState).map(([state, locs]) => (
          <section key={state} aria-labelledby={`st-${state}`}>
            <h2 id={`st-${state}`} className="text-2xl font-extrabold sm:text-3xl">
              {state}
            </h2>
            <RevealGroup as="ul" className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {locs.map((l) => (
                <RevealItem as="li" key={l.id}>
                  <Link
                    href={`/service-areas/${l.slug}`}
                    className="group flex h-full flex-col rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-100 transition-all hover:-translate-y-1 hover:shadow-card-hover hover:ring-brand-200"
                  >
                    <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <MapPin aria-hidden="true" className="size-5" />
                    </span>
                    <span className="mt-4 font-display text-xl font-bold text-ink-900">
                      Plumbing services in {l.city}, {l.stateCode}
                    </span>
                    {l.nearbyAreas.length > 0 && (
                      <span className="mt-2 text-sm leading-relaxed text-ink-500">Including {l.nearbyAreas.join(", ")}</span>
                    )}
                    <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-brand-700">
                      View {l.city} services
                      <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          </section>
        ))}

        <div className="rounded-2xl bg-ink-50 p-6 text-center ring-1 ring-ink-100 sm:p-8">
          <h2 className="text-xl font-bold">Don&apos;t see your city?</h2>
          <p className="mt-2 text-ink-500">Our coverage changes as we grow. Call us with your ZIP code and we&apos;ll let you know if we can help.</p>
          <div className="mt-5 flex justify-center">
            <CallButton phone={settings.phone} showNumber />
          </div>
        </div>
      </div>

      <CtaBand settings={settings} />
    </>
  );
}
