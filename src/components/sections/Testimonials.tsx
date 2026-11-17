import { Star } from "lucide-react";
import type { Testimonial } from "@/types";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";

/**
 * Renders only real reviews that staff marked verified in the admin.
 * With no testimonials the section is omitted entirely — never padded with placeholders.
 */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="reviews-heading" className="py-16 sm:py-24">
      <div className="container-x">
        <SectionHeading id="reviews-heading" eyebrow="Reviews" title="What our customers say" align="center" />
        <RevealGroup as="ul" className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((t) => (
            <RevealItem as="li" key={t.id}>
              <figure className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-100">
                {t.rating ? (
                  <p className="flex gap-0.5 text-accent-500" aria-label={`${t.rating} out of 5 stars`}>
                    {Array.from({ length: t.rating }, (_, i) => <Star key={i} aria-hidden="true" className="size-4 fill-current" />)}
                  </p>
                ) : null}
                <blockquote className="mt-3 flex-1 leading-relaxed text-ink-700">“{t.body}”</blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold text-ink-900">{t.authorName}</span>
                  {t.location && <span className="text-ink-500"> · {t.location}</span>}
                  {t.serviceName && <span className="block text-xs text-ink-400">{t.serviceName}</span>}
                  {t.source && (
                    <span className="block text-xs text-ink-400">
                      via {t.sourceUrl ? <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{t.source}</a> : t.source}
                    </span>
                  )}
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
