import Link from "next/link";
import { Fragment } from "react";

const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/**
 * Renders plain text with inline Markdown-style links: "See [drain cleaning](/services/drain-cleaning)".
 * Internal links use next/link (prefetch); external links open safely in a new tab.
 * Text is rendered as React text nodes — never as raw HTML — so CMS content can't inject markup.
 */
export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK_RE)) {
    const [full, label, href] = match;
    const i = match.index ?? 0;
    if (i > last) parts.push(text.slice(last, i));
    const internal = href.startsWith("/");
    parts.push(
      internal ? (
        <Link key={i} href={href}>
          {label}
        </Link>
      ) : (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      ),
    );
    last = i + full.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
}
