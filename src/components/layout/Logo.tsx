import Link from "next/link";
import { cn } from "@/lib/utils";

/** Placeholder wordmark. Replace the SVG mark with the real logo (settings.logo) in Phase 2. */
export function Logo({ name, tone = "dark", className, src }: { name: string; tone?: "dark" | "light"; className?: string; src?: string }) {
  if (src) {
    return (
      <Link href="/" className={cn("inline-flex items-center", className)} aria-label={`${name} — home`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- logo is small & above the fold; dimensions come from CSS */}
        <img src={src} alt={name} className={cn("h-10 w-auto", tone === "light" && "brightness-0 invert")} />
      </Link>
    );
  }
  const [first, ...rest] = name.split(" ");
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label={`${name} — home`}>
      <span className="relative grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm ring-1 ring-brand-700/20 transition-transform duration-300 group-hover:-rotate-3">
        <svg viewBox="0 0 32 32" className="size-6 text-white" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 11h10a4 4 0 0 1 4 4v3" />
          <path d="M5 8v6M21 18h4v4h-8v-4h4" />
          <path d="M21 25.5c0 1.4-1 2.5-2 2.5s-2-1.1-2-2.5 2-3.5 2-3.5" className="text-accent-300" stroke="currentColor" />
        </svg>
      </span>
      <span className={cn("font-display text-lg font-extrabold leading-none tracking-tight", tone === "light" ? "text-white" : "text-ink-900")}>
        {first}
        <span className={tone === "light" ? "text-brand-300" : "text-brand-600"}>{rest.length ? ` ${rest.join(" ")}` : ""}</span>
      </span>
    </Link>
  );
}
