import type { Metadata } from "next";
import { api } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/sections/PageHero";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { EmergencyBanner } from "@/components/sections/EmergencyBanner";
import { CtaBand } from "@/components/sections/CtaBand";
import { CallButton, ButtonLink } from "@/components/ui/Button";
import type { ServiceCategory, ServiceSummary } from "@/types";

export const metadata: Metadata = pageMetadata({
  title: "Plumbing Services & Repairs",
  description:
    "Explore our residential and commercial plumbing services: drain cleaning, sewer repair, water heaters, leak detection, pipe repair, fixtures and emergency plumbing.",
  path: "/services",
});

const GROUPS: { title: string; categories: ServiceCategory[] }[] = [
  { title: "Drains & Sewer", categories: ["drains-sewer"] },
  { title: "Water Heaters", categories: ["water-heaters"] },
  { title: "Leaks & Pipes", categories: ["leaks-pipes"] },
  { title: "Fixtures, Remodels & Gas", categories: ["fixtures", "remodel", "gas", "water-treatment"] },
  { title: "Emergency & Commercial", categories: ["emergency", "commercial"] },
];

export default async function ServicesPage() {
  const [settings, services] = await Promise.all([api.getSiteSettings(), api.listServices()]);
  const grouped = GROUPS.map((g) => ({ ...g, items: services.filter((s) => g.categories.includes(s.category)) })).filter(
    (g) => g.items.length,
  );
  // Any category not mapped above still shows (future-proof for new admin categories)
  const mapped = new Set(GROUPS.flatMap((g) => g.categories));
  const other: ServiceSummary[] = services.filter((s) => !mapped.has(s.category));

  return (
    <>
      <PageHero
        crumbs={[{ name: "Services", href: "/services" }]}
        eyebrow="What we do"
        title="Plumbing Services"
        intro={`Licensed plumbers for homes and businesses across ${settings.serviceAreaLabel}. Pick a service to learn more, or call and we'll point you in the right direction.`}
        actions={
          <>
            <CallButton phone={settings.phone} showNumber size="lg" />
            <ButtonLink href="/request-service" variant="secondary" size="lg" arrow>
              Request Service
            </ButtonLink>
          </>
        }
      />

      <div className="container-x space-y-16 py-16 sm:py-20">
        {grouped.map((g) => (
          <section key={g.title} aria-labelledby={`grp-${g.title}`}>
            <h2 id={`grp-${g.title}`} className="text-2xl font-extrabold sm:text-3xl">
              {g.title}
            </h2>
            <ServicesGrid services={g.items} phone={settings.phone} className="mt-6" />
          </section>
        ))}
        {other.length > 0 && (
          <section aria-labelledby="grp-other">
            <h2 id="grp-other" className="text-2xl font-extrabold sm:text-3xl">
              More Services
            </h2>
            <ServicesGrid services={other} phone={settings.phone} className="mt-6" />
          </section>
        )}
      </div>

      <EmergencyBanner settings={settings} />
      <CtaBand settings={settings} title="Not sure which service you need?" text="Describe the problem on the phone and we'll tell you what it likely is and what it takes to fix it." />
    </>
  );
}
