import Link from "next/link";
import { Mail, MapPin, Phone, Clock } from "lucide-react";
import type { LocationSummary, ServiceSummary, SiteSettings } from "@/types";
import { Logo } from "./Logo";
import { CallButton } from "@/components/ui/Button";
import { servicePath, telHref } from "@/lib/utils";

function FooterHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.12em] text-white">{children}</h2>;
}

export function Footer({ settings, services, locations }: { settings: SiteSettings; services: ServiceSummary[]; locations: LocationSummary[] }) {
  const year = new Date().getFullYear();
  const a = settings.address;
  const f = settings.footer;
  const QUICK_LINKS = settings.navigation.quickLinks;
  const LEGAL = settings.navigation.legal;
  return (
    <footer className="relative overflow-hidden bg-ink-950 text-ink-300">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 right-0 size-[32rem] rounded-full bg-brand-700/20 blur-3xl" />

      <div className="container-x relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <Logo name={settings.businessName} tone="light" src={settings.logo} />
          <p className="mt-5 max-w-sm leading-relaxed">{f.description || settings.shortDescription}</p>
          <div className="mt-6">
            <CallButton phone={settings.phone} showNumber />
          </div>
          {settings.social.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Social profiles">
              {settings.social.map((s) => (
                <li key={s.platform}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center rounded-lg px-3 text-xs font-semibold text-ink-200 ring-1 ring-white/15 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {s.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {f.showServices && <nav aria-label="Services" className="lg:col-span-3">
          <FooterHeading>Services</FooterHeading>
          <ul className="grid gap-2.5 text-sm">
            {services.slice(0, f.servicesLimit).map((s) => (
              <li key={s.id}>
                <Link href={servicePath(s)} className="transition-colors hover:text-white">
                  {s.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/services" className="font-semibold text-brand-300 hover:text-white">
                All services →
              </Link>
            </li>
          </ul>
        </nav>}

        <div className="grid gap-10 sm:grid-cols-2 md:col-span-2 lg:col-span-5 lg:grid-cols-2">
          <div>
            {f.showServiceAreas && locations.length > 0 && <nav aria-label="Service areas" className="mb-8">
              <FooterHeading>Service Areas</FooterHeading>
              <ul className="grid gap-2.5 text-sm">
                {locations.map((l) => (
                  <li key={l.id}>
                    <Link href={`/service-areas/${l.slug}`} className="transition-colors hover:text-white">
                      {l.city}, {l.stateCode}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>}
            <nav aria-label="Quick links">
              <FooterHeading>Quick Links</FooterHeading>
              <ul className="grid gap-2.5 text-sm">
                {QUICK_LINKS.map((q) => (
                  <li key={q.href}>
                    <Link href={q.href} className="transition-colors hover:text-white">
                      {q.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div>
            <FooterHeading>Contact</FooterHeading>
            <address className="grid gap-3.5 text-sm not-italic">
              <a href={telHref(settings.phone.e164)} className="flex items-start gap-2.5 hover:text-white">
                <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-400" />
                <span className="font-semibold text-white">{settings.phone.display}</span>
              </a>
              <a href={`mailto:${settings.email}`} className="flex items-start gap-2.5 break-all hover:text-white">
                <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-300" />
                {settings.email}
              </a>
              <p className="flex items-start gap-2.5">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-300" />
                <span>
                  {a.street}
                  <br />
                  {a.city}, {a.region} {a.postalCode}
                </span>
              </p>
            </address>
            {f.showHours && <><h3 className="mb-3 mt-8 flex items-center gap-2 font-display text-sm font-bold uppercase tracking-[0.12em] text-white">
              <Clock aria-hidden="true" className="size-4" /> Hours
            </h3>
            <dl className="grid gap-1.5 text-sm">
              {settings.hours.map((h) => (
                <div key={h.label} className="flex justify-between gap-4">
                  <dt>{h.label}</dt>
                  <dd className="text-right text-ink-200">{h.value}</dd>
                </div>
              ))}
              {settings.emergency.available && (
                <div className="mt-1 flex justify-between gap-4 font-semibold text-accent-300">
                  <dt>Emergencies</dt>
                  <dd>{settings.emergency.shortLabel}</dd>
                </div>
              )}
            </dl></>}
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="container-x flex flex-col gap-4 py-6 text-xs text-ink-400 md:flex-row md:items-center md:justify-between">
          <p>
            {f.copyrightText || `© ${year} ${settings.legalName}. All rights reserved.`}
            {settings.licenseNumber && <span className="ml-2">License {settings.licenseNumber}</span>}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
