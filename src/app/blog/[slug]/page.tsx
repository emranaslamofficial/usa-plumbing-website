import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { pageMetadata, articleSchema, faqSchema, seoOverrides, customSchema } from "@/lib/seo";
import { servicePath, telHref } from "@/lib/utils";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ArticleBody } from "@/components/blog/ArticleBody";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { PostCover } from "@/components/blog/PostCover";
import { PostCard, PostMeta } from "@/components/blog/PostCard";
import { FaqList } from "@/components/sections/FaqList";
import { CtaBand } from "@/components/sections/CtaBand";
import { CallButton, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = true;

export async function generateStaticParams() {
  return (await api.listAllPostSlugs()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await api.getPost(slug);
  if (!post) return {};
  return pageMetadata({
    title: post.seo.metaTitle,
    description: post.seo.metaDescription,
    path: `/blog/${post.slug}`,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    ...seoOverrides(post.seo),
    ogImage: post.seo.ogImage ?? post.featuredImage?.src ?? `/blog/${post.slug}/opengraph-image`,
    absoluteTitle: true,
  });
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await api.getPost(slug);
  if (!post) notFound();

  const [settings, author, categories, related, services] = await Promise.all([
    api.getSiteSettings(),
    api.getAuthor(post.authorId),
    api.listCategories(),
    api.listRelatedPosts(post.slug, 3),
    api.listServices(),
  ]);
  const category = categories.find((c) => c.slug === post.categorySlug);
  const relatedServices = post.relatedServiceSlugs.map((s) => services.find((x) => x.slug === s)).filter((x) => x !== undefined);
  const primaryService = relatedServices[0];
  const authorName = author?.name ?? settings.businessName;

  return (
    <>
      <JsonLd data={[articleSchema(post, authorName, settings), faqSchema(post.faqs), customSchema(post.seo)]} />

      <article>
        <header className="border-b border-ink-100 bg-gradient-to-b from-brand-50/60 to-white">
          <div className="container-x max-w-4xl py-10 sm:py-14">
            <Breadcrumbs
              items={[
                { name: "Blog", href: "/blog" },
                ...(category ? [{ name: category.name, href: `/blog?category=${category.slug}` }] : []),
                { name: post.title, href: `/blog/${post.slug}` },
              ]}
            />
            {category && (
              <Link href={`/blog?category=${category.slug}`} className="mt-6 inline-block text-xs font-bold uppercase tracking-[0.12em] text-brand-600 hover:text-brand-800">
                {category.name}
              </Link>
            )}
            <h1 className="mt-3 text-[2rem] font-extrabold leading-tight sm:text-[2.75rem]">{post.title}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-sm font-semibold text-ink-700">By {authorName}</p>
              <PostMeta post={post} />
              {post.updatedAt && <p className="text-sm text-ink-400">Updated {post.updatedAt}</p>}
            </div>
          </div>
        </header>

        <div className="container-x max-w-6xl">
          <div className="mx-auto -mt-px max-w-4xl pt-8">
            <PostCover post={post} priority className="aspect-[21/9]! rounded-3xl" sizes="(min-width: 1024px) 56rem, 100vw" />
          </div>

          <div className="grid gap-12 py-10 sm:py-14 lg:grid-cols-[1fr_17rem]">
            <div className="min-w-0 lg:max-w-[46rem]">
              <p className="text-xl leading-relaxed text-ink-700">{post.intro}</p>

              <div className="my-8 lg:hidden">
                <TableOfContents blocks={post.body} hasFaq={post.faqs.length > 0} />
              </div>

              <div className="mt-8">
                <ArticleBody blocks={post.body} />
              </div>

              {/* In-article conversion point — helpful, not pushy */}
              <aside aria-label="Get professional help" className="my-12 rounded-2xl bg-ink-950 p-6 text-ink-200 sm:p-8">
                <p className="font-display text-xl font-bold text-white">Would rather leave it to a professional?</p>
                <p className="mt-2">
                  {primaryService
                    ? `Our plumbers handle ${primaryService.name.toLowerCase()} every day — diagnosed properly and priced before work begins.`
                    : "Our plumbers can diagnose the problem and fix it properly — with the price confirmed before work begins."}
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <CallButton phone={settings.phone} showNumber />
                  <ButtonLink
                    href={primaryService ? `/request-service?service=${primaryService.slug}` : "/request-service"}
                    variant="outline-light"
                    arrow
                  >
                    Request Service
                  </ButtonLink>
                </div>
              </aside>

              {post.faqs.length > 0 && (
                <section aria-labelledby="faq">
                  <h2 id="faq" className="text-2xl font-extrabold sm:text-[1.75rem]">
                    Frequently asked questions
                  </h2>
                  <div className="mt-6">
                    <FaqList faqs={post.faqs} />
                  </div>
                </section>
              )}

              {author && (
                <div className="mt-12 flex gap-4 rounded-2xl bg-ink-50 p-6 ring-1 ring-ink-100">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-600 font-display font-bold text-white" aria-hidden="true">
                    {author.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-display font-bold text-ink-900">{author.name}</p>
                    <p className="text-sm text-ink-500">{author.role}</p>
                    <p className="mt-2 text-sm text-ink-600">{author.bio}</p>
                  </div>
                </div>
              )}
            </div>

            <aside className="hidden space-y-6 lg:block lg:sticky lg:top-24 lg:self-start" aria-label="Article navigation">
              <TableOfContents blocks={post.body} hasFaq={post.faqs.length > 0} />
              <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-100">
                <p className="font-display font-bold text-ink-900">Need a plumber?</p>
                <a href={telHref(settings.phone.e164)} className="mt-1 flex items-center gap-2 font-display text-xl font-extrabold text-brand-700">
                  <Phone aria-hidden="true" className="size-5" /> {settings.phone.display}
                </a>
                <ButtonLink href="/request-service" variant="primary" size="sm" className="mt-4 w-full">
                  Request Service
                </ButtonLink>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {relatedServices.length > 0 && (
        <section aria-labelledby="rel-services" className="bg-ink-50 py-14">
          <div className="container-x max-w-6xl">
            <h2 id="rel-services" className="text-2xl font-extrabold">
              Related services
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedServices.map((s) => (
                <li key={s.id}>
                  <Link
                    href={servicePath(s)}
                    className="group flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-ink-100 transition-all hover:-translate-y-0.5 hover:shadow-card-hover hover:ring-brand-200"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon name={s.icon} className="size-5" />
                    </span>
                    <span className="flex-1 font-semibold text-ink-900">{s.name}</span>
                    <ArrowRight aria-hidden="true" className="size-4 text-brand-600 transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section aria-labelledby="rel-posts" className="py-16">
          <div className="container-x max-w-6xl">
            <h2 id="rel-posts" className="text-2xl font-extrabold">
              Related articles
            </h2>
            <ul className="mt-6 grid gap-6 md:grid-cols-3">
              {related.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} category={categories.find((c) => c.slug === p.categorySlug)} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <CtaBand settings={settings} />
    </>
  );
}
