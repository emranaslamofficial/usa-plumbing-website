import type { SiteSettings } from "@/types";
import { Icon } from "@/components/ui/Icon";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";

/**
 * Trust signals come from editable settings. Anything that needs verification
 * (licenses, insurance, response times) carries an asterisk tied to the footnote.
 */
export function TrustBar({ settings }: { settings: SiteSettings }) {
  const hasFootnote = settings.trustBadges.some((b) => b.requiresFootnote);
  return (
    <section aria-labelledby="trust-heading" className="border-y border-ink-100 bg-white">
      <h2 id="trust-heading" className="sr-only">
        Why customers choose {settings.businessName}
      </h2>
      <div className="container-x py-10">
        <RevealGroup as="ul" className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {settings.trustBadges.map((b) => (
            <RevealItem as="li" key={b.id} className="flex items-start gap-3.5 lg:flex-col lg:items-center lg:text-center">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <Icon name={b.icon} className="size-6" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-ink-900">
                  {b.label}
                  {b.requiresFootnote && (
                    <a href="#trust-footnote" className="text-brand-600 no-underline" aria-label="See footnote">
                      *
                    </a>
                  )}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">{b.description}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
        {hasFootnote && (
          <p id="trust-footnote" className="mt-8 text-center text-xs text-ink-400">
            {settings.trustFootnote}
          </p>
        )}
      </div>
    </section>
  );
}
