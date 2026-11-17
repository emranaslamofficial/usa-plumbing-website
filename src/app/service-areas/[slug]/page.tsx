import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { pageMetadata, plumberSchema, faqSchema, locationAreaNames, seoOverrides, customSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/sections/PageHero";
import { ContactCard } from "@/components/sections/ContactCard";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { FaqList } from "@/components/sections/FaqList";
import { EmergencyBanner } from "@/components/sections/EmergencyBanner";
import { CtaBand } from "@/components/sections/CtaBand";
import { CallButton, ButtonLink } from "@/components/ui/Button";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = true;

export async function generateStaticParams() {
  return (await api.listLocations()).map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const l = await api.getLocation(slug);
  if (!l) return {};
  return pageMetadata({
    title: l.seo.metaTitle,
    description: l.seo.metaDescription,
    path: `/service-areas/${l.slug}`,
    absoluteTitle: true,
    ...seoOverrides(l.seo),
  });
}

export default async function LocationPage({ params }: Params) {
  const { slug } = await params;
  const location = await api.getLocation(slug);
  if (!location) notFound();
  const [settings, services] = await Promise.all([api.getSiteSettings(), api.listServices()]);
  const featured = location.featuredServiceSlugs.map((s) => services.find((x) => x.slug === s)).filter((x) => x !== undefined);
  // Only services offered in this area (managed per area in the admin); empty list = all services
  const offered = location.serviceSlugs?.length ? services.filter((s) => location.serviceSlugs!.includes(s.slug)) : services;
  const rest = offered.filter((s) => !location.featuredServiceSlugs.includes(s.slug));
  const place = `${location.city}, ${location.stateCode}`;

  return (
    <>
      <JsonLd data={[plumberSchema(settings, locationAreaNames(location)), faqSchema(location.faqs), customSchema(location.seo)]} />
      <PageHero
        crumbs={[
          { name: "Service Areas", href: "/service-areas" },
          { name: place, href: `/service-areas/${location.slug}` },
        ]}
        eyebrow={`Local plumbers · ${place}`}
        title={`Plumbing Services in ${place}`}
        intro={location.intro[0]}
        actions={
          <>
            <CallButton phone={settings.phone} size="lg" showNumber />
            <ButtonLink href="/request-service" variant="secondary" size="lg" arrow>
              Request Service
            </ButtonLink>
          </>
        }
        aside={
          <div className="hidden lg:block">
            <ContactCard settings={settings} title={`Plumber in ${location.city}`} />
          </div>
        }
      />

      <div className="container-x py-14 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_20rem]">
          <div className="min-w-0 space-y-12">
            {location.intro.slice(1).map((p) => (
              <p key={p} className="text-lg leading-relaxed text-ink-600">
                {p}
              </p>
            ))}

            <section aria-labelledby="local-heading">
              <h2 id="local-heading" className="text-2xl font-extrabold sm:text-3xl">
                Plumbing considerations for {location.city} homes
              </h2>
              <RevealGroup as="ul" className="mt-6 grid gap-4">
                {location.localConsiderations.map((c) => (
                  <RevealItem as="li" key={c.title} className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-100">
                    <h3 className="text-lg font-bold">{c.title}</h3>
                    <p className="mt-1.5 leading-relaxed text-ink-500">{c.description}</p>
                  </RevealItem>
                ))}
              </RevealGroup>
            </section>

            {location.faqs.length > 0 && (
              <section aria-labelledby="loc-faq">
                <h2 id="loc-faq" className="text-2xl font-extrabold sm:text-3xl">
                  {location.city} plumbing FAQs
                </h2>
                <div className="mt-6">
                  <FaqList faqs={location.faqs} />
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start" aria-label="Contact and coverage">
            <div className="lg:hidden">
              <ContactCard settings={settings} title={`Plumber in ${location.city}`} />
            </div>
            {location.nearbyAreas.length > 0 && (
              <div className="rounded-2xl bg-white p-6 ring-1 ring-ink-100">
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-ink-900">Also serving</h2>
                <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-ink-600">
                  {location.nearbyAreas.map((a) => (
                    <li key={a} className="flex items-center gap-1.5">
                      <MapPin aria-hidden="true" className="size-3.5 text-brand-500" /> {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>

      {featured.length > 0 && (
        <section aria-labelledby="loc-featured" className="bg-ink-50 py-16 sm:py-20">
          <div className="container-x">
            <h2 id="loc-featured" className="text-2xl font-extrabold sm:text-3xl">
              Popular plumbing services in {location.city}
            </h2>
            <ServicesGrid services={featured} phone={settings.phone} className="mt-8 lg:grid-cols-4" />
          </div>
        </section>
      )}

      <section aria-labelledby="loc-all" className="py-16 sm:py-20">
        <div className="container-x">
          <h2 id="loc-all" className="text-2xl font-extrabold sm:text-3xl">
            All services available in {location.city}
          </h2>
          <ServicesGrid services={rest} phone={settings.phone} className="mt-8" />
        </div>
      </section>

      <EmergencyBanner settings={settings} />
      <CtaBand settings={settings} title={`Need a plumber in ${location.city}?`} />
    </>
  );
}
