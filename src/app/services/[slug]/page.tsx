import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { pageMetadata, serviceSchema, faqSchema, seoOverrides, customSchema } from "@/lib/seo";
import { servicePath } from "@/lib/utils";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/sections/PageHero";
import { ContactCard } from "@/components/sections/ContactCard";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { FaqList } from "@/components/sections/FaqList";
import { CtaBand } from "@/components/sections/CtaBand";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { PostCard } from "@/components/blog/PostCard";
import { CallButton, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { RichText } from "@/components/blog/RichText";

type Params = { params: Promise<{ slug: string }> };

// New services added in the admin panel render on demand (ISR) without a rebuild.
export const dynamicParams = true;

export async function generateStaticParams() {
  const services = await api.listServices();
  return services.filter((s) => !s.path).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const s = await api.getService(slug);
  if (!s) return {};
  return pageMetadata({
    title: s.seo.metaTitle,
    description: s.seo.metaDescription,
    path: servicePath(s),
    ...seoOverrides(s.seo),
    absoluteTitle: true,
  });
}

export default async function ServicePage({ params }: Params) {
  const { slug } = await params;
  const service = await api.getService(slug);
  if (!service) notFound();
  if (service.path && service.path !== `/services/${slug}`) permanentRedirect(service.path);

  const [settings, all, locations, categories, posts] = await Promise.all([
    api.getSiteSettings(),
    api.listServices(),
    api.listLocations(),
    api.listCategories(),
    api.getPostsBySlugs(service.relatedPostSlugs),
  ]);
  const related = service.relatedServiceSlugs.map((s) => all.find((x) => x.slug === s)).filter((x) => x !== undefined);
  const others = all.filter((s) => s.slug !== service.slug && !s.isEmergency).slice(0, 8);
  const requestHref = `/request-service?service=${service.slug}`;
  const areaNames = locations.map((l) => l.city);

  return (
    <>
      <JsonLd data={[serviceSchema(service, settings, areaNames), faqSchema(service.faqs), customSchema(service.seo)]} />
      <PageHero
        crumbs={[
          { name: "Services", href: "/services" },
          { name: service.name, href: servicePath(service) },
        ]}
        eyebrow={`${service.name} · ${settings.serviceAreaLabel}`}
        title={service.h1}
        intro={service.intro[0]}
        actions={
          <>
            <CallButton phone={settings.phone} size="lg" showNumber />
            <ButtonLink href={requestHref} variant="secondary" size="lg" arrow>
              Request Service
            </ButtonLink>
          </>
        }
        aside={
          <div className="hidden lg:block">
            <ContactCard settings={settings} requestHref={requestHref} title={`Need ${service.name.toLowerCase()}?`} />
          </div>
        }
      />

      <div className="container-x grid gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-14">
          {service.intro.length > 1 && (
            <div className="space-y-4 text-lg leading-relaxed text-ink-600">
              {service.intro.slice(1).map((p) => (
                <p key={p}>
                  <RichText text={p} />
                </p>
              ))}
            </div>
          )}

          <Reveal as="section" className="rounded-3xl bg-ink-50 p-6 ring-1 ring-ink-100 sm:p-8">
            <h2 className="text-2xl font-extrabold">{service.signsTitle}</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {service.signs.map((s) => (
                <li key={s} className="flex items-start gap-3 rounded-xl bg-white p-4 text-[0.95rem] text-ink-700 ring-1 ring-ink-100">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-600" />
                  {s}
                </li>
              ))}
            </ul>
          </Reveal>

          <section aria-labelledby="features-heading">
            <h2 id="features-heading" className="text-2xl font-extrabold sm:text-3xl">
              {service.featuresTitle}
            </h2>
            <RevealGroup as="ul" className="mt-6 grid gap-4 sm:grid-cols-2">
              {service.features.map((f) => (
                <RevealItem as="li" key={f.title} className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-100">
                  <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon name={service.icon} className="size-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                  <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-500">{f.description}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </section>

          {/* Mid-page conversion point, visible on all screen sizes */}
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-brand-50 p-6 ring-1 ring-brand-100 sm:flex-row sm:items-center">
            <p className="font-display text-lg font-bold text-ink-900">Talk to a plumber about your {service.name.toLowerCase()} needs.</p>
            <CallButton phone={settings.phone} label="Call Now" className="shrink-0" />
          </div>

          {service.faqs.length > 0 && (
            <section aria-labelledby="faq-heading">
              <h2 id="faq-heading" className="text-2xl font-extrabold sm:text-3xl">
                {service.name} FAQs
              </h2>
              <div className="mt-6">
                <FaqList faqs={service.faqs} />
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start" aria-label="Contact and other services">
          <div className="lg:hidden">
            <ContactCard settings={settings} requestHref={requestHref} />
          </div>
          <nav aria-labelledby="other-services" className="rounded-2xl bg-white p-6 ring-1 ring-ink-100">
            <h2 id="other-services" className="font-display text-sm font-bold uppercase tracking-wider text-ink-900">
              Other services
            </h2>
            <ul className="mt-3 divide-y divide-ink-100 text-[0.95rem]">
              {others.map((o) => (
                <li key={o.id}>
                  <Link href={servicePath(o)} className="group flex items-center justify-between py-2.5 text-ink-600 hover:text-brand-700">
                    {o.name}
                    <ArrowRight aria-hidden="true" className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {locations.length > 0 && (
            <nav aria-labelledby="svc-areas" className="rounded-2xl bg-white p-6 ring-1 ring-ink-100">
              <h2 id="svc-areas" className="font-display text-sm font-bold uppercase tracking-wider text-ink-900">
                Service areas
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {locations.map((l) => (
                  <li key={l.id}>
                    <Link href={`/service-areas/${l.slug}`} className="inline-block rounded-lg bg-ink-50 px-3 py-1.5 text-sm text-ink-700 hover:bg-brand-50 hover:text-brand-700">
                      {l.city}, {l.stateCode}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </aside>
      </div>

      <HowItWorks />

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="py-16 sm:py-20">
          <div className="container-x">
            <h2 id="related-heading" className="text-2xl font-extrabold sm:text-3xl">
              Related services
            </h2>
            <ServicesGrid services={related} phone={settings.phone} className="mt-8" />
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section aria-labelledby="guides-heading" className="bg-ink-50 py-16 sm:py-20">
          <div className="container-x">
            <h2 id="guides-heading" className="text-2xl font-extrabold sm:text-3xl">
              Helpful guides
            </h2>
            <ul className="mt-8 grid gap-6 md:grid-cols-3">
              {posts.slice(0, 3).map((p) => (
                <li key={p.id}>
                  <PostCard post={p} category={categories.find((c) => c.slug === p.categorySlug)} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <CtaBand settings={settings} title={service.ctaHeading || `Schedule ${service.name.toLowerCase()} today`} {...(service.ctaText ? { text: service.ctaText } : {})} />
    </>
  );
}
