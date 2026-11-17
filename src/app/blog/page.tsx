import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/sections/PageHero";
import { PostCard } from "@/components/blog/PostCard";
import { BlogSearch } from "@/components/blog/BlogSearch";
import { Pagination } from "@/components/blog/Pagination";
import { CtaBand } from "@/components/sections/CtaBand";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";

type Props = { searchParams: Promise<{ page?: string; category?: string; q?: string }> };

const PAGE_SIZE = 6;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page, category, q } = await searchParams;
  const categories = await api.listCategories();
  const cat = categories.find((c) => c.slug === category);
  const pageNum = Number(page) > 1 ? Number(page) : 1;

  const params = new URLSearchParams();
  if (cat) params.set("category", cat.slug);
  if (pageNum > 1) params.set("page", String(pageNum));
  const path = `/blog${params.size ? `?${params}` : ""}`;

  return pageMetadata({
    title: cat ? `${cat.name} Tips & Guides${pageNum > 1 ? ` (Page ${pageNum})` : ""}` : `Plumbing Tips, Guides & How-Tos${pageNum > 1 ? ` (Page ${pageNum})` : ""}`,
    description: cat
      ? `${cat.description} Practical advice from licensed plumbers.`
      : "Practical plumbing guides from licensed plumbers: fix running toilets, unclog drains, maintain water heaters and prevent frozen pipes.",
    path,
    // Search results are thin/duplicate by nature — keep them out of the index.
    noIndex: Boolean(q),
  });
}

export default async function BlogPage({ searchParams }: Props) {
  const { page, category, q } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const [settings, categories, popular, featuredList] = await Promise.all([
    api.getSiteSettings(),
    api.listCategories(),
    api.listPopularPosts(4),
    api.listFeaturedPosts(),
  ]);
  const activeCat = categories.find((c) => c.slug === category);
  const isFiltered = Boolean(activeCat || q);
  const featured = !isFiltered && pageNum === 1 ? featuredList[0] : undefined;

  const result = await api.listPosts({ page: pageNum, pageSize: PAGE_SIZE, category: activeCat?.slug, q: q?.slice(0, 80) });
  const items = featured ? result.items.filter((p) => p.id !== featured.id) : result.items;

  const hrefFor = (p: number) => {
    const sp = new URLSearchParams();
    if (activeCat) sp.set("category", activeCat.slug);
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    return `/blog${sp.size ? `?${sp}` : ""}`;
  };
  const catHref = (slug?: string) => (slug ? `/blog?category=${slug}` : "/blog");
  const findCat = (slug: string) => categories.find((c) => c.slug === slug);

  return (
    <>
      <PageHero
        crumbs={[{ name: "Blog", href: "/blog" }, ...(activeCat ? [{ name: activeCat.name, href: catHref(activeCat.slug) }] : [])]}
        eyebrow="Plumbing tips & guides"
        title={activeCat ? `${activeCat.name} Guides` : "Plumbing Tips From Licensed Plumbers"}
        intro={activeCat ? activeCat.description : "Straightforward advice to help you fix small problems, prevent big ones and know when it's time to call a pro."}
      />

      <div className="container-x py-12 sm:py-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label="Blog categories" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
              <li>
                <Link
                  href={catHref()}
                  aria-current={!activeCat ? "page" : undefined}
                  className={cn("inline-block whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors", !activeCat ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-700 ring-1 ring-ink-100 hover:bg-brand-50")}
                >
                  All articles
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={catHref(c.slug)}
                    aria-current={activeCat?.slug === c.slug ? "page" : undefined}
                    className={cn(
                      "inline-block whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                      activeCat?.slug === c.slug ? "bg-brand-600 text-white" : "bg-ink-50 text-ink-700 ring-1 ring-ink-100 hover:bg-brand-50",
                    )}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="w-full lg:max-w-sm">
            <BlogSearch defaultValue={q} />
          </div>
        </div>

        {q && (
          <p className="mt-8 text-ink-600" aria-live="polite">
            {result.total} result{result.total === 1 ? "" : "s"} for <strong>&ldquo;{q}&rdquo;</strong>.{" "}
            <Link href="/blog" className="font-semibold text-brand-700 underline underline-offset-4">
              Clear search
            </Link>
          </p>
        )}

        {featured && (
          <section aria-label="Featured article" className="mt-10">
            <PostCard post={featured} category={findCat(featured.categorySlug)} variant="featured" headingLevel="h2" />
          </section>
        )}

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_18rem]">
          <section aria-labelledby="latest-heading">
            <h2 id="latest-heading" className="text-2xl font-extrabold">
              {isFiltered ? "Articles" : "Latest articles"}
            </h2>
            {items.length ? (
              <RevealGroup as="ul" className="mt-6 grid gap-6 sm:grid-cols-2">
                {items.map((p) => (
                  <RevealItem as="li" key={p.id}>
                    <PostCard post={p} category={findCat(p.categorySlug)} />
                  </RevealItem>
                ))}
              </RevealGroup>
            ) : (
              <div className="mt-6 rounded-2xl bg-ink-50 p-8 text-center ring-1 ring-ink-100">
                <p className="font-semibold text-ink-900">No articles found.</p>
                <p className="mt-1 text-ink-500">Try a different search, or call us — we&apos;re happy to answer your question directly.</p>
              </div>
            )}
            <Pagination page={result.page} totalPages={result.totalPages} hrefFor={hrefFor} />
          </section>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start" aria-label="Popular articles">
            {popular.length > 0 && (
              <div className="rounded-2xl bg-white p-6 ring-1 ring-ink-100">
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-ink-900">Popular articles</h2>
                <ol className="mt-4 space-y-4">
                  {popular.map((p, i) => (
                    <li key={p.id} className="flex gap-3">
                      <span className="font-display text-2xl font-extrabold leading-none text-brand-200">{i + 1}</span>
                      <Link href={`/blog/${p.slug}`} className="text-[0.95rem] font-semibold leading-snug text-ink-800 hover:text-brand-700">
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <div className="rounded-2xl bg-brand-700 p-6 text-brand-100">
              <p className="font-display text-lg font-bold text-white">Would rather have a pro handle it?</p>
              <p className="mt-1.5 text-sm">Our plumbers can diagnose and fix it — usually in a single visit.</p>
              <Link href="/request-service" className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-white font-semibold text-brand-700 hover:bg-brand-50">
                Request Service
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <CtaBand settings={settings} />
    </>
  );
}
