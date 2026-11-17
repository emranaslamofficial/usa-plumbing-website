import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { cn } from "@/lib/utils";

export interface Crumb {
  name: string;
  href: string;
}

/** Visible breadcrumbs + BreadcrumbList schema. "Home" is prepended automatically. */
export function Breadcrumbs({ items, tone = "light", className }: { items: Crumb[]; tone?: "light" | "dark"; className?: string }) {
  const all = [{ name: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className={className}>
        <ol className={cn("flex flex-wrap items-center gap-1 text-sm", tone === "dark" ? "text-ink-300" : "text-ink-500")}>
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={c.href} className="flex items-center gap-1">
                {last ? (
                  <span aria-current="page" className={cn("font-medium", tone === "dark" ? "text-white" : "text-ink-800")}>
                    {c.name}
                  </span>
                ) : (
                  <>
                    <Link href={c.href} className={cn("transition-colors", tone === "dark" ? "hover:text-white" : "hover:text-brand-700")}>
                      {c.name}
                    </Link>
                    <ChevronRight aria-hidden="true" className="size-3.5 opacity-60" />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbSchema(all)} />
    </>
  );
}
