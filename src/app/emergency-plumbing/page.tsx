import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Droplets, Power, Flame, Camera, ShieldAlert } from "lucide-react";
import { api } from "@/lib/api";
import { pageMetadata, serviceSchema, faqSchema, seoOverrides, customSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CallButton, ButtonLink } from "@/components/ui/Button";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { FaqList } from "@/components/sections/FaqList";
import { CtaBand } from "@/components/sections/CtaBand";
import { PostCard } from "@/components/blog/PostCard";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

// Dedicated landing page for: emergency plumber near me / emergency plumber / 24 hour plumber /
// burst pipe repair near me / emergency water heater repair. Content is the "emergency-plumbing" service record.
const SLUG = "emergency-plumbing";

export async function generateMetadata(): Promise<Metadata> {
  const s = await api.getService(SLUG);
  if (!s) return {};
  return pageMetadata({ title: s.seo.metaTitle, description: s.seo.metaDescription, path: "/emergency-plumbing", absoluteTitle: true, ...seoOverrides(s.seo) });
}

const STEPS = [
  { icon: Droplets, title: "Shut off the water", text: "Close the main shut-off valve — usually where the water line enters the house, or at the meter." },
  { icon: Power, title: "Cut power if needed", text: "Turn off electricity to wet areas, and power or gas to a leaking water heater." },
  { icon: Flame, title: "Smell gas? Get out", text: "Leave immediately and call your gas utility or 911 from outside. Don't use switches." },
  { icon: Camera, title: "Document the damage", text: "Take photos and video before cleanup — useful for insurance claims." },
];

export default async function EmergencyPage() {
  const [settings, service, all, locations, categories] = await Promise.all([
    api.getSiteSettings(),
    api.getService(SLUG),
    api.listServices(),
    api.listLocations(),
    api.listCategories(),
  ]);
  if (!service) notFound();
  const related = service.relatedServiceSlugs.map((s) => all.find((x) => x.slug === s)).filter((x) => x !== undefined);
  const posts = await api.getPostsBySlugs(service.relatedPostSlugs);

  return (
    <>
      <JsonLd data={[serviceSchema(service, settings, locations.map((l) => l.city)), faqSchema(service.faqs), customSchema(service.seo)]} />

      <section className="relative overflow-hidden bg-ink-950 text-ink-200">
        <div aria-hidden="true" className="absolute -right-32 -top-32 size-[30rem] rounded-full bg-accent-500/15 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-40 -left-20 size-[30rem] rounded-full bg-brand-600/25 blur-3xl" />
        <div className="container-x relative py-12 sm:py-16 lg:py-20">
          <div className="hero-enter max-w-3xl">
            <Breadcrumbs tone="dark" items={[{ name: "Emergency Plumbing", href: "/emergency-plumbing" }]} />
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent-400/15 px-3.5 py-1.5 text-sm font-semibold text-accent-300 ring-1 ring-accent-400/30">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full rounded-full bg-accent-400 opacity-70 motion-safe:animate-ping" />
                <span className="relative inline-flex size-2 rounded-full bg-accent-400" />
              </span>
              {settings.emergency.available ? settings.emergency.label : "Priority emergency dispatch"}
            </p>
            <h1 className="mt-5 text-[2.2rem] font-extrabold leading-tight text-white sm:text-5xl">{service.h1}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-200">{service.intro[0]}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CallButton phone={settings.phone} size="lg" showNumber attention label="Call Now" />
              <ButtonLink href="/request-service?service=emergency-plumbing" variant="outline-light" size="lg">
                Request Service Online
              </ButtonLink>
            </div>
            <p className="mt-4 text-sm text-ink-400">For the fastest response to an active emergency, please call rather than submitting a form.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="first-steps" className="py-16 sm:py-20">
        <div className="container-x">
          <h2 id="first-steps" className="text-2xl font-extrabold sm:text-3xl">
            What to do right now, before the plumber arrives
          </h2>
          <RevealGroup as="ol" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <RevealItem as="li" key={s.title} className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-100">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-accent-400/20 text-accent-600">
                    <s.icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="font-display text-sm font-extrabold text-ink-300">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-1.5 text-[0.95rem] text-ink-500">{s.text}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section aria-labelledby="when-heading" className="bg-ink-50 py-16 sm:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 id="when-heading" className="text-2xl font-extrabold sm:text-3xl">
              {service.signsTitle}
            </h2>
            <ul className="mt-6 space-y-3">
              {service.signs.map((s) => (
                <li key={s} className="flex items-start gap-3 rounded-xl bg-white p-4 ring-1 ring-ink-100">
                  <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent-600" />
                  {s}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-2xl font-extrabold sm:text-3xl">{service.featuresTitle}</h2>
            <ul className="mt-6 grid gap-4">
              {service.features.map((f) => (
                <li key={f.title} className="rounded-xl bg-white p-5 ring-1 ring-ink-100">
                  <h3 className="font-bold">{f.title}</h3>
                  <p className="mt-1 text-[0.95rem] text-ink-500">{f.description}</p>
                </li>
              ))}
            </ul>
            {service.intro[1] && <p className="mt-6 leading-relaxed text-ink-600">{service.intro[1]}</p>}
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="emg-faq" className="py-16 sm:py-20">
        <div className="container-x max-w-4xl">
          <h2 id="emg-faq" className="text-2xl font-extrabold sm:text-3xl">
            Emergency plumbing FAQs
          </h2>
          <div className="mt-6">
            <FaqList faqs={service.faqs} />
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="emg-related" className="pb-4">
          <div className="container-x">
            <h2 id="emg-related" className="text-2xl font-extrabold sm:text-3xl">
              Common emergency repairs
            </h2>
            <ServicesGrid services={related} phone={settings.phone} className="mt-8 lg:grid-cols-4" />
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section aria-labelledby="emg-guides" className="py-16">
          <div className="container-x">
            <h2 id="emg-guides" className="text-2xl font-extrabold sm:text-3xl">
              Prevent the next emergency
            </h2>
            <ul className="mt-8 grid gap-6 md:grid-cols-3">
              {posts.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} category={categories.find((c) => c.slug === p.categorySlug)} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <CtaBand settings={settings} title="Plumbing emergency? Call now." text="A real person answers, helps you limit the damage and gets a plumber on the way." />
    </>
  );
}
