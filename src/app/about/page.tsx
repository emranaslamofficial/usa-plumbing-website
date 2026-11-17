import type { Metadata } from "next";
import { api } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/sections/PageHero";
import { TrustBar } from "@/components/sections/TrustBar";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { CtaBand } from "@/components/sections/CtaBand";
import { CallButton, ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";

export async function generateMetadata(): Promise<Metadata> {
  const s = await api.getSiteSettings();
  return pageMetadata({
    title: "About Us | Trusted Local Plumbers",
    description: `Learn about ${s.businessName}: local, licensed plumbers serving ${s.serviceAreaLabel} with honest diagnosis and clear pricing.`,
    path: "/about",
  });
}

// NOTE: Replace the placeholder story below with the company's real history, team and credentials.
// Avoid unverifiable claims (years in business, job counts, awards) unless they are accurate.
const VALUES = [
  { title: "Honest diagnosis", text: "We explain what's wrong in plain language and recommend the repair that actually makes sense — not the most expensive one." },
  { title: "Clear pricing", text: "You'll know the price before work begins. No surprise add-ons after the job is done." },
  { title: "Respect for your home", text: "Shoe covers, drop cloths and a clean work area are standard on every job." },
  { title: "Work done to code", text: "Permits where required and quality parts, so repairs last and pass inspection." },
];

export default async function AboutPage() {
  const settings = await api.getSiteSettings();
  return (
    <>
      <PageHero
        crumbs={[{ name: "About", href: "/about" }]}
        eyebrow="About us"
        title={`Local plumbers who do the job right — ${settings.businessName}`}
        intro={settings.tagline}
        actions={
          <>
            <CallButton phone={settings.phone} size="lg" showNumber />
            <ButtonLink href="/request-service" variant="secondary" size="lg" arrow>
              Request Service
            </ButtonLink>
          </>
        }
      />

      <section className="py-16 sm:py-20">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <Reveal className="space-y-5 text-lg leading-relaxed text-ink-600">
            <h2 className="text-3xl font-extrabold">Our story</h2>
            <p>
              {settings.businessName} provides residential and commercial plumbing services across {settings.serviceAreaLabel}. We started with a
              simple idea: people deserve a plumber who shows up when promised, explains the problem honestly and leaves the home cleaner than
              they found it.
            </p>
            <p>
              Today our team handles everything from dripping faucets and clogged drains to water heater replacement, slab leaks and sewer line
              repair. Whether it&apos;s a planned upgrade or an emergency, we treat every home like our own.
            </p>
            {process.env.NODE_ENV !== "production" && (
              <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
                <strong>Dev note (hidden in production):</strong> replace this section with your real company history, owner story and team
                photos. Authentic details build far more trust than generic copy.
              </p>
            )}
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-3xl font-extrabold">What you can expect</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {VALUES.map((v) => (
                <li key={v.title} className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-100">
                  <h3 className="text-lg font-bold">{v.title}</h3>
                  <p className="mt-1.5 text-[0.95rem] text-ink-500">{v.text}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <TrustBar settings={settings} />
      <HowItWorks />
      <CtaBand settings={settings} />
    </>
  );
}
