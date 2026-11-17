import type { Metadata } from "next";
import { api } from "@/lib/api";
import { pageMetadata, plumberSchema, faqSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { HomeHero } from "@/components/sections/HomeHero";
import { TrustBar } from "@/components/sections/TrustBar";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { EmergencyBanner } from "@/components/sections/EmergencyBanner";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { ServiceAreasSection } from "@/components/sections/ServiceAreasSection";
import { FaqList } from "@/components/sections/FaqList";
import { CtaBand } from "@/components/sections/CtaBand";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ButtonLink } from "@/components/ui/Button";
import { PostCard } from "@/components/blog/PostCard";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Testimonials } from "@/components/sections/Testimonials";

// Homepage targets: "local plumbing", "plumber", "plumber near me", "residential plumber",
// "plumbing services near me". See docs/KEYWORD-MAP.md.
export async function generateMetadata(): Promise<Metadata> {
  const s = await api.getSiteSettings();
  return pageMetadata({
    title: `Local Plumbing Services & Residential Plumber | ${s.businessName}`,
    absoluteTitle: true,
    description: `Trusted local plumbers serving ${s.serviceAreaLabel}. Drain cleaning, water heaters, leak repair and emergency plumbing for homes and businesses. Call now.`,
    path: "/",
  });
}

export default async function HomePage() {
  const [settings, services, locations, popular, HOME_FAQS, testimonials] = await Promise.all([
    api.getSiteSettings(),
    api.listServices(),
    api.listLocations(),
    api.listPopularPosts(3),
    api.listFaqs("home"),
    api.listTestimonials(),
  ]);
  const categories = await api.listCategories();
  const featuredServices = services.filter((s) => s.isFeatured);
  const areaNames = locations.flatMap((l) => [l.city, ...l.nearbyAreas]);

  return (
    <>
      <JsonLd data={[plumberSchema(settings, areaNames), faqSchema(HOME_FAQS)]} />
      <HomeHero settings={settings} />
      <TrustBar settings={settings} />

      <section aria-labelledby="services-heading" className="py-16 sm:py-24">
        <div className="container-x">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              id="services-heading"
              eyebrow="Plumbing services"
              title="Complete plumbing services for your home or business"
              description="From a dripping faucet to a failed sewer line — diagnosed properly, priced clearly and fixed to last."
            />
            <ButtonLink href="/services" variant="secondary" arrow className="shrink-0">
              All services
            </ButtonLink>
          </div>
          <ServicesGrid services={featuredServices} phone={settings.phone} className="mt-12" />
        </div>
      </section>

      <EmergencyBanner settings={settings} />
      <HowItWorks />
      <Testimonials items={testimonials} />
      <ServiceAreasSection settings={settings} locations={locations} />

      {HOME_FAQS.length > 0 && <section aria-labelledby="faq-heading" className="bg-ink-50 py-16 sm:py-24">
        <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            id="faq-heading"
            eyebrow="FAQ"
            title="Questions homeowners ask us"
            description="Can't find your answer? Call us — we're happy to talk through the problem before you book."
          />
          <FaqList faqs={HOME_FAQS} />
        </div>
      </section>}

      {popular.length > 0 && (
        <section aria-labelledby="tips-heading" className="py-16 sm:py-24">
          <div className="container-x">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <SectionHeading id="tips-heading" eyebrow="Plumbing tips" title="Helpful guides from our plumbers" />
              <ButtonLink href="/blog" variant="secondary" arrow className="shrink-0">
                Visit the blog
              </ButtonLink>
            </div>
            <RevealGroup as="ul" className="mt-12 grid gap-6 md:grid-cols-3">
              {popular.map((p) => (
                <RevealItem as="li" key={p.id}>
                  <PostCard post={p} category={categories.find((c) => c.slug === p.categorySlug)} />
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}

      <CtaBand settings={settings} />
    </>
  );
}
