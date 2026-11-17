import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/layout/Breadcrumbs";

/** Compact header for inner pages: breadcrumbs, H1, intro, optional actions/aside. */
export function PageHero({
  crumbs,
  eyebrow,
  title,
  intro,
  actions,
  aside,
}: {
  crumbs: Crumb[];
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-ink-100 bg-gradient-to-b from-brand-50/70 to-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 [background:radial-gradient(50rem_24rem_at_100%_0%,rgb(47_116_236/0.10),transparent_60%)]" />
      <div className={`container-x relative py-10 sm:py-14 ${aside ? "grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-center" : ""}`}>
        <div className="hero-enter max-w-3xl">
          <Breadcrumbs items={crumbs} />
          {eyebrow && <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-brand-600">{eyebrow}</p>}
          <h1 className={`${eyebrow ? "mt-2" : "mt-6"} text-[2rem] font-extrabold leading-tight sm:text-[2.6rem]`}>{title}</h1>
          {intro && <div className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-500">{intro}</div>}
          {actions && <div className="mt-7 flex flex-col gap-3 sm:flex-row">{actions}</div>}
        </div>
        {aside && <div className="hero-enter-delayed">{aside}</div>}
      </div>
    </section>
  );
}
