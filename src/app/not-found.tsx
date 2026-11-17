import Link from "next/link";
import type { Metadata } from "next";
import { api } from "@/lib/api";
import { CallButton, ButtonLink } from "@/components/ui/Button";
import { servicePath } from "@/lib/utils";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default async function NotFound() {
  const [settings, services] = await Promise.all([api.getSiteSettings(), api.listServices()]);
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 to-white">
      <div className="container-x max-w-3xl py-20 text-center sm:py-28">
        <p className="font-display text-7xl font-extrabold text-brand-200 sm:text-8xl" aria-hidden="true">
          404
        </p>
        <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">This page went down the drain</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-500">
          The page you&apos;re looking for doesn&apos;t exist or has moved. If you have a plumbing problem, we can still help.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <CallButton phone={settings.phone} size="lg" showNumber />
          <ButtonLink href="/" variant="secondary" size="lg">
            Back to home
          </ButtonLink>
        </div>
        <nav aria-label="Popular services" className="mt-12">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-ink-500">Popular services</h2>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {services
              .filter((s) => s.isFeatured)
              .map((s) => (
                <li key={s.id}>
                  <Link href={servicePath(s)} className="inline-block rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-700 ring-1 ring-ink-200 hover:text-brand-700 hover:ring-brand-300">
                    {s.name}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
