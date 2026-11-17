import type { BlogPost, ContentBlock } from "@/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function blockText(b: ContentBlock): string {
  switch (b.type) {
    case "ul":
    case "ol":
      return b.items.join(" ");
    case "callout":
      return `${b.title ?? ""} ${b.text}`;
    case "quote":
      return `${b.text} ${b.cite ?? ""}`;
    case "table":
      return [b.caption ?? "", ...b.headers, ...b.rows.flat()].join(" ");
    case "image":
      return b.caption ?? "";
    default:
      return b.text;
  }
}

/** ~225 wpm reading speed, minimum 1 minute. */
export function readingMinutes(post: Pick<BlogPost, "intro" | "body" | "faqs">) {
  const text = [post.intro, ...post.body.map(blockText), ...post.faqs.map((f) => `${f.question} ${f.answer}`)].join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 225));
}

export function servicePath(s: { slug: string; path?: string }) {
  return s.path ?? `/services/${s.slug}`;
}

export function telHref(e164: string) {
  return `tel:${e164}`;
}
