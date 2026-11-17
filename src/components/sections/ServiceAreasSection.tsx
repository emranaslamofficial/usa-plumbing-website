import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import type { LocationSummary, SiteSettings } from "@/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";

export function ServiceAreasSection({ settings, locations }: { settings: SiteSettings; locations: LocationSummary[] }) {
  return (
    <section aria-labelledby="areas-heading" className="py-16 sm:py-24">
      <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionHeading
            id="areas-heading"
            eyebrow="Service areas"
            title={<>Serving Homeowners &amp; Businesses Across {settings.serviceAreaLabel}</>}
            description="Local plumbers who know the area's homes, soil, water and codes. Don't see your city? Call — we may still be able to help."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/service-areas" variant="primary" arrow>
              View all service areas
            </ButtonLink>
          </div>
        </div>
        <RevealGroup as="ul" className="grid gap-4 sm:grid-cols-2">
          {locations.map((l) => (
            <RevealItem as="li" key={l.id}>
              <Link
                href={`/service-areas/${l.slug}`}
                className="group flex h-full flex-col rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-100 transition-all hover:-translate-y-0.5 hover:shadow-card-hover hover:ring-brand-200"
              >
                <span className="flex items-center gap-2 font-display text-lg font-bold text-ink-900">
                  <MapPin aria-hidden="true" className="size-5 text-brand-600" />
                  {l.city}, {l.stateCode}
                </span>
                {l.nearbyAreas.length > 0 && (
                  <span className="mt-2 text-sm text-ink-500">Also serving {l.nearbyAreas.slice(0, 3).join(", ")} & nearby</span>
                )}
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                  Plumbers in {l.city}
                  <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
