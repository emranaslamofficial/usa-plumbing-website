import Image from "next/image";
import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import type { ContentBlock } from "@/types";
import { RichText } from "./RichText";
import { cn } from "@/lib/utils";

const CALLOUT = {
  tip: { icon: Lightbulb, cls: "bg-emerald-50 ring-emerald-200 [&_svg]:text-emerald-600", label: "Tip" },
  warning: { icon: TriangleAlert, cls: "bg-amber-50 ring-amber-200 [&_svg]:text-amber-600", label: "Warning" },
  info: { icon: Info, cls: "bg-brand-50 ring-brand-200 [&_svg]:text-brand-600", label: "Note" },
} as const;

/** Renders structured article blocks with correct H2/H3 hierarchy. */
export function ArticleBody({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="prose-article">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2 key={i} id={b.id}>
                {b.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} id={b.id}>
                {b.text}
              </h3>
            );
          case "p":
            return (
              <p key={i}>
                <RichText text={b.text} />
              </p>
            );
          case "ul":
          case "ol": {
            const L = b.type;
            return (
              <L key={i}>
                {b.items.map((it) => (
                  <li key={it}>
                    <RichText text={it} />
                  </li>
                ))}
              </L>
            );
          }
          case "quote":
            return (
              <figure key={i} className="border-l-4 border-brand-300 pl-5">
                <blockquote className="text-lg italic text-ink-800">
                  <RichText text={b.text} />
                </blockquote>
                {b.cite && <figcaption className="mt-2 text-sm text-ink-500">— {b.cite}</figcaption>}
              </figure>
            );
          case "table":
            return (
              <div key={i} className="overflow-x-auto rounded-xl ring-1 ring-ink-100">
                <table className="w-full text-left text-[0.95rem]">
                  {b.caption && <caption className="bg-ink-50 px-4 py-2 text-left text-sm font-semibold text-ink-700">{b.caption}</caption>}
                  {b.headers.length > 0 && (
                    <thead className="bg-ink-50">
                      <tr>
                        {b.headers.map((h, j) => (
                          <th key={j} scope="col" className="px-4 py-2.5 font-semibold text-ink-900">{h}</th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody className="divide-y divide-ink-100">
                    {b.rows.map((r, ri) => (
                      <tr key={ri}>
                        {r.map((c, ci) => (
                          <td key={ci} className="px-4 py-2.5 align-top">
                            <RichText text={c} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "image":
            if (!b.src) return null;
            return (
              <figure key={i}>
                <Image
                  src={b.src}
                  alt={b.alt}
                  width={b.width ?? 1200}
                  height={b.height ?? 675}
                  sizes="(min-width: 1024px) 46rem, 100vw"
                  className="h-auto w-full rounded-2xl ring-1 ring-ink-100"
                />
                {b.caption && <figcaption className="mt-2 text-center text-sm text-ink-500">{b.caption}</figcaption>}
              </figure>
            );
          case "callout": {
            const c = CALLOUT[b.variant];
            return (
              <aside key={i} className={cn("flex gap-3.5 rounded-2xl p-5 ring-1", c.cls)} aria-label={b.title ?? c.label}>
                <c.icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                <div className="text-[0.98rem]">
                  {b.title && <p className="font-display font-bold text-ink-900">{b.title}</p>}
                  <p className={b.title ? "mt-1" : ""}>
                    <RichText text={b.text} />
                  </p>
                </div>
              </aside>
            );
          }
        }
      })}
    </div>
  );
}
