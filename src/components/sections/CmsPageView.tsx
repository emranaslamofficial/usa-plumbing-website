import type { CmsPage } from "@/types";
import { PageHero } from "./PageHero";
import { FaqList } from "./FaqList";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { RichText } from "@/components/blog/RichText";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema, customSchema } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

/** Renders a page created/edited in Admin → Pages. */
export function CmsPageView({ page, path }: { page: CmsPage; path: string }) {
  return (
    <>
      <JsonLd data={[faqSchema(page.faqs), customSchema(page.seo)]} />
      <PageHero crumbs={[{ name: page.title, href: path }]} title={page.title} intro={<p>Last updated: {formatDate(page.updatedAt)}</p>} />
      <div className="container-x max-w-3xl py-12 sm:py-16">
        {page.intro && (
          <p className="mb-8 text-lg leading-relaxed text-ink-700">
            <RichText text={page.intro} />
          </p>
        )}
        <ArticleBody blocks={page.body} />
        {page.faqs.length > 0 && (
          <section aria-labelledby="page-faq" className="mt-12">
            <h2 id="page-faq" className="text-2xl font-extrabold">
              Frequently asked questions
            </h2>
            <div className="mt-6">
              <FaqList faqs={page.faqs} />
            </div>
          </section>
        )}
      </div>
    </>
  );
}
