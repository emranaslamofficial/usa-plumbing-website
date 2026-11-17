import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { pageMetadata, plumberSchema } from "@/lib/seo";
import { telHref } from "@/lib/utils";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHero } from "@/components/sections/PageHero";
import { ServiceRequestForm } from "@/components/forms/ServiceRequestForm";

export async function generateMetadata(): Promise<Metadata> {
  const s = await api.getSiteSettings();
  return pageMetadata({
    title: "Contact Us | Call or Request Service",
    description: `Contact ${s.businessName}. Call ${s.phone.display} for plumbing service or send a request online. Serving ${s.serviceAreaLabel}.`,
    path: "/contact",
  });
}

export default async function ContactPage() {
  const [settings, services, locations] = await Promise.all([api.getSiteSettings(), api.listServices(), api.listLocations()]);
  const a = settings.address;
  const mapQuery = encodeURIComponent(`${a.street}, ${a.city}, ${a.region} ${a.postalCode}`);

  const items = [
    { icon: Phone, label: "Call us", value: settings.phone.display, href: telHref(settings.phone.e164), strong: true },
    { icon: Mail, label: "Email", value: settings.email, href: `mailto:${settings.email}` },
    { icon: MapPin, label: "Office", value: `${a.street}, ${a.city}, ${a.region} ${a.postalCode}`, href: `https://www.google.com/maps/search/?api=1&query=${mapQuery}` },
  ];

  return (
    <>
      <JsonLd data={plumberSchema(settings, locations.map((l) => l.city))} />
      <PageHero
        crumbs={[{ name: "Contact", href: "/contact" }]}
        eyebrow="Contact"
        title="Contact us"
        intro="For urgent plumbing problems, calling is the fastest way to reach us. For everything else, send a request and we'll get back to you to schedule."
      />

      <div className="container-x grid gap-10 py-14 sm:py-20 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-4">
          {items.map((it) => (
            <a
              key={it.label}
              href={it.href}
              {...(it.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-100 transition-all hover:-translate-y-0.5 hover:ring-brand-200"
            >
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${it.strong ? "bg-accent-400 text-ink-950" : "bg-brand-50 text-brand-600"}`}>
                <it.icon aria-hidden="true" className="size-5" />
              </span>
              <span>
                <span className="block text-sm text-ink-500">{it.label}</span>
                <span className={`block break-words font-semibold text-ink-900 ${it.strong ? "font-display text-2xl font-extrabold" : ""}`}>{it.value}</span>
              </span>
            </a>
          ))}
          <div className="rounded-2xl bg-ink-50 p-5 ring-1 ring-ink-100">
            <p className="flex items-center gap-2 font-display font-bold text-ink-900">
              <Clock aria-hidden="true" className="size-4 text-brand-600" /> Business hours
            </p>
            <dl className="mt-3 grid gap-1.5 text-sm">
              {settings.hours.map((h) => (
                <div key={h.label} className="flex justify-between gap-4">
                  <dt className="text-ink-500">{h.label}</dt>
                  <dd className="text-right font-medium text-ink-800">{h.value}</dd>
                </div>
              ))}
            </dl>
            {settings.emergency.available && <p className="mt-3 text-sm font-semibold text-brand-700">{settings.emergency.label} — call any time.</p>}
          </div>
        </div>

        <section aria-labelledby="contact-form-heading" className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-ink-100 sm:p-8">
          <h2 id="contact-form-heading" className="text-2xl font-extrabold">
            Send us a service request
          </h2>
          <p className="mt-2 text-ink-500">Tell us what&apos;s going on and when works for you.</p>
          <div className="mt-6">
            <ServiceRequestForm services={services.map(({ slug, name }) => ({ slug, name }))} phone={settings.phone} formType="contact" />
          </div>
        </section>
      </div>
    </>
  );
}
