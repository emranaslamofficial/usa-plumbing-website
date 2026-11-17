import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (p: number) => string }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const item = "grid h-11 min-w-11 place-items-center rounded-xl px-3 text-sm font-semibold transition-colors";
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={cn(item, "ring-1 ring-ink-200 hover:bg-ink-50")} aria-label="Previous page">
          <ChevronLeft aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span className={cn(item, "text-ink-300 ring-1 ring-ink-100")} aria-hidden="true">
          <ChevronLeft className="size-4" />
        </span>
      )}
      <ul className="flex gap-2">
        {pages.map((p) => (
          <li key={p}>
            <Link
              href={hrefFor(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(item, p === page ? "bg-brand-600 text-white" : "ring-1 ring-ink-200 hover:bg-ink-50")}
            >
              {p}
            </Link>
          </li>
        ))}
      </ul>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={cn(item, "ring-1 ring-ink-200 hover:bg-ink-50")} aria-label="Next page">
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      ) : (
        <span className={cn(item, "text-ink-300 ring-1 ring-ink-100")} aria-hidden="true">
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
