import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2";
  tone?: "light" | "dark";
  className?: string;
  id?: string;
}

export function SectionHeading({ eyebrow, title, description, align = "left", as: Tag = "h2", tone = "light", className, id }: Props) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p
          className={cn(
            "mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]",
            tone === "dark" ? "text-accent-300" : "text-brand-600",
          )}
        >
          <span aria-hidden="true" className={cn("h-px w-6", tone === "dark" ? "bg-accent-300/60" : "bg-brand-300")} />
          {eyebrow}
        </p>
      )}
      <Tag
        id={id}
        className={cn("text-3xl font-extrabold leading-tight sm:text-4xl", tone === "dark" && "text-white")}
      >
        {title}
      </Tag>
      {description && (
        <p className={cn("mt-4 text-lg leading-relaxed", tone === "dark" ? "text-ink-200" : "text-ink-500")}>{description}</p>
      )}
    </div>
  );
}
