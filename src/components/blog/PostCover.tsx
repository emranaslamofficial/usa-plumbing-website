import Image from "next/image";
import { Cylinder, Droplets, Toilet, Wrench, House } from "lucide-react";
import type { BlogPostSummary } from "@/types";
import { cn } from "@/lib/utils";

const THEMES: Record<string, { from: string; to: string; icon: typeof Wrench }> = {
  "drains-sewers": { from: "#1d5bd3", to: "#0f2145", icon: Droplets },
  "water-heaters": { from: "#f9ad1f", to: "#c2410c", icon: Cylinder },
  toilets: { from: "#2f74ec", to: "#1a356b", icon: Toilet },
  "pipes-leaks": { from: "#0e7490", to: "#0f2145", icon: Wrench },
  "homeowner-tips": { from: "#3f4e6a", to: "#08101f", icon: House },
};

/**
 * Featured image. Uses next/image (AVIF/WebP, lazy-loaded, responsive sizes) when the CMS
 * provides one; otherwise renders a lightweight branded cover so layout never breaks.
 */
export function PostCover({
  post,
  priority,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  className,
}: {
  post: Pick<BlogPostSummary, "title" | "categorySlug" | "featuredImage">;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  if (post.featuredImage) {
    return (
      <div className={cn("relative aspect-[16/9] overflow-hidden bg-ink-100", className)}>
        <Image src={post.featuredImage.src} alt={post.featuredImage.alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }
  const t = THEMES[post.categorySlug] ?? THEMES["homeowner-tips"];
  const Ico = t.icon;
  return (
    <div
      className={cn("relative aspect-[16/9] overflow-hidden", className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="absolute -right-10 -top-10 size-48 rounded-full bg-white/10" />
      <div className="absolute -bottom-16 -left-8 size-56 rounded-full bg-black/10" />
      <Ico className="absolute bottom-5 right-5 size-16 text-white/85 transition-transform duration-500 group-hover:scale-110" strokeWidth={1.4} />
    </div>
  );
}
