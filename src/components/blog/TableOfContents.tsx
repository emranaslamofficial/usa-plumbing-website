import { ListTree } from "lucide-react";
import type { ContentBlock } from "@/types";

export function TableOfContents({ blocks, hasFaq }: { blocks: ContentBlock[]; hasFaq?: boolean }) {
  const headings = blocks.filter((b): b is Extract<ContentBlock, { type: "h2" | "h3" }> => b.type === "h2" || b.type === "h3");
  if (headings.length < 2) return null;
  return (
    <nav aria-labelledby="toc-heading" className="rounded-2xl bg-ink-50 p-5 ring-1 ring-ink-100">
      <p id="toc-heading" className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-ink-900">
        <ListTree aria-hidden="true" className="size-4 text-brand-600" /> In this article
      </p>
      <ol className="mt-3 space-y-1.5 text-sm">
        {headings.map((h) => (
          <li key={h.id} className={h.type === "h3" ? "pl-4" : ""}>
            <a href={`#${h.id}`} className="block py-0.5 text-ink-600 transition-colors hover:text-brand-700">
              {h.text}
            </a>
          </li>
        ))}
        {hasFaq && (
          <li>
            <a href="#faq" className="block py-0.5 text-ink-600 transition-colors hover:text-brand-700">
              Frequently asked questions
            </a>
          </li>
        )}
      </ol>
    </nav>
  );
}
