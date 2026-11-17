import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ServiceRequestForm } from "@/components/forms/ServiceRequestForm";
import { CallButton } from "@/components/ui/Button";

export const metadata: Metadata = pageMetadata({
  title: "Request Plumbing Service Online",
  description: "Request plumbing service online. Tell us what you need and when, and we'll contact you to confirm your appointment.",
  path: "/request-service",
});

type Props = { searchParams: Promise<{ service?: string }> };

export default async function RequestServicePage({ searchParams }: Props) {
  const [{ service }, settings, services] = await Promise.all([searchParams, api.getSiteSettings(), api.listServices()]);
  const defaultService = services.some((s) => s.slug === service) ? service : undefined;

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-white">
      <div className="container-x relative grid gap-10 py-10 sm:py-14 lg:grid-cols-[1fr_1.35fr] lg:gap-14">
        <div className="hero-enter lg:pt-6">
          <Breadcrumbs items={[{ name: "Request Service", href: "/request-service" }]} />
          <h1 className="mt-6 text-[2rem] font-extrabold leading-tight sm:text-[2.6rem]">Request plumbing service</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-500">
            Fill out the form and our team will contact you to confirm a time. It takes about a minute.
          </p>
          <ul className="mt-8 space-y-3 text-ink-700">
            {["We'll call or text to confirm your appointment", "Your plumber explains options and pricing before starting", "Residential and commercial service"].map(
              (t) => (
                <li key={t} className="flex items-start gap-3">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-500" /> {t}
                </li>
              ),
            )}
          </ul>
          <div className="mt-10 rounded-2xl bg-ink-950 p-6 text-ink-200">
            <p className="font-display text-lg font-bold text-white">Is this an emergency?</p>
            <p className="mt-1.5 text-sm">Burst pipe, sewage backup or no water? Please call — it&apos;s the fastest way to get help.</p>
            <CallButton phone={settings.phone} showNumber className="mt-4 w-full sm:w-auto" attention />
          </div>
        </div>

        <section aria-label="Service request form" className="hero-enter-delayed rounded-3xl bg-white p-6 shadow-card-hover ring-1 ring-ink-100 sm:p-8">
          <ServiceRequestForm
            services={services.map(({ slug, name }) => ({ slug, name }))}
            phone={settings.phone}
            defaultService={defaultService}
          />
        </section>
      </div>
    </div>
  );
}
