import { Plus } from "lucide-react";
import type { Faq } from "@/types";
import { RichText } from "@/components/blog/RichText";

/** Native <details> accordion — accessible and works without JavaScript. */
export function FaqList({ faqs, headingLevel = "h3" }: { faqs: Faq[]; headingLevel?: "h3" | "h4" }) {
  const H = headingLevel;
  return (
    <div className="divide-y divide-ink-100 rounded-2xl bg-white ring-1 ring-ink-100">
      {faqs.map((f) => (
        <details key={f.question} className="group px-5 sm:px-6 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5">
            <H className="font-display text-base font-bold text-ink-900 sm:text-lg">{f.question}</H>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 transition-transform duration-300 group-open:rotate-45">
              <Plus aria-hidden="true" className="size-4" />
            </span>
          </summary>
          <div className="pb-5 pr-10 leading-relaxed text-ink-600">
            <RichText text={f.answer} />
          </div>
        </details>
      ))}
    </div>
  );
}
