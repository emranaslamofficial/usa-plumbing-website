import Link from "next/link";
import type { BlogCategory, BlogPostSummary } from "@/types";
import { PostCover } from "./PostCover";
import { formatDate, cn } from "@/lib/utils";

export function PostMeta({ post, className }: { post: Pick<BlogPostSummary, "publishedAt" | "readingMinutes">; className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-2 text-sm text-ink-400", className)}>
      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      <span aria-hidden="true">·</span>
      <span>{post.readingMinutes} min read</span>
    </p>
  );
}

export function PostCard({
  post,
  category,
  variant = "default",
  headingLevel = "h3",
}: {
  post: BlogPostSummary;
  category?: BlogCategory;
  variant?: "default" | "featured";
  headingLevel?: "h2" | "h3";
}) {
  const H = headingLevel;
  const featured = variant === "featured";
  return (
    <article
      className={cn(
        "group relative flex h-full overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover",
        featured ? "flex-col md:grid md:grid-cols-2" : "flex-col",
      )}
    >
      <PostCover post={post} priority={featured} className={featured ? "md:aspect-auto md:h-full" : ""} sizes={featured ? "(min-width: 768px) 50vw, 100vw" : undefined} />
      <div className={cn("flex flex-1 flex-col", featured ? "p-6 sm:p-8 md:justify-center" : "p-6")}>
        {category && <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-600">{category.name}</p>}
        <H className={cn("mt-2 font-bold leading-snug", featured ? "text-2xl sm:text-3xl" : "text-lg")}>
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 after:content-[''] hover:text-brand-700">
            {post.title}
          </Link>
        </H>
        <p className={cn("mt-3 text-ink-500", featured ? "text-lg" : "line-clamp-3 text-[0.95rem]")}>{post.excerpt}</p>
        <div className="mt-auto pt-5">
          <PostMeta post={post} />
          {featured && <p className="mt-1 text-sm text-ink-500">By {post.authorName}</p>}
        </div>
      </div>
    </article>
  );
}
