import { Search } from "lucide-react";

/**
 * Plain GET form → /blog?q=… — works without JavaScript and produces shareable URLs.
 * Search result pages are noindexed (see blog/page.tsx) to avoid thin duplicate pages.
 */
export function BlogSearch({ defaultValue }: { defaultValue?: string }) {
  return (
    <form action="/blog" method="get" role="search" className="relative">
      <label htmlFor="blog-search" className="sr-only">
        Search articles
      </label>
      <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-400" />
      <input
        id="blog-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search plumbing guides…"
        className="h-12 w-full rounded-xl bg-white pl-12 pr-24 text-ink-900 shadow-sm ring-1 ring-ink-200 transition-shadow placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <button
        type="submit"
        className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        Search
      </button>
    </form>
  );
}
