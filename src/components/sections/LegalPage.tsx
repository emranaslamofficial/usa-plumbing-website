import type { ReactNode } from "react";
import { PageHero } from "./PageHero";

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

/**
 * Shared layout for Privacy / Terms / Disclaimer. Content is a starting template only —
 * have it reviewed by a qualified attorney. In Phase 2 these become CMS-managed pages.
 */
export function LegalPage({ title, path, updated, intro, sections }: { title: string; path: string; updated: string; intro: ReactNode; sections: LegalSection[] }) {
  return (
    <>
      <PageHero crumbs={[{ name: title, href: path }]} title={title} intro={<p>Last updated: {updated}</p>} />
      <div className="container-x max-w-3xl py-12 sm:py-16">
        <div className="prose-article">
          <p>{intro}</p>
          {sections.map((s, i) => (
            <section key={s.heading} aria-labelledby={`legal-${i}`}>
              <h2 id={`legal-${i}`}>{s.heading}</h2>
              {s.body}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
