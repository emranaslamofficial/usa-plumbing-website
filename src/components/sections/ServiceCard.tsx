import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import type { ServiceSummary } from "@/types";
import { Icon } from "@/components/ui/Icon";
import { cn, servicePath, telHref } from "@/lib/utils";

/**
 * Card with two actions: Learn More (stretched link covering the card) and Call Now.
 * The call link sits above the stretched link via z-index so both remain clickable.
 */
export function ServiceCard({ service, phone }: { service: ServiceSummary; phone: { display: string; e164: string } }) {
  const href = servicePath(service);
  const emergency = service.isEmergency;
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-2xl p-6 shadow-card ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover",
        emergency ? "bg-ink-900 text-ink-200 ring-ink-800" : "bg-white ring-ink-100 hover:ring-brand-200",
      )}
    >
      <span
        className={cn(
          "grid size-12 place-items-center rounded-xl transition-colors duration-300",
          emergency ? "bg-accent-400 text-ink-950" : "bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white",
        )}
      >
        <Icon name={service.icon} className="size-6" />
      </span>
      <h3 className={cn("mt-5 text-lg font-bold", emergency && "text-white")}>
        <Link href={href} className="after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none">
          {service.name}
        </Link>
      </h3>
      <p className={cn("mt-2 flex-1 text-[0.95rem] leading-relaxed", emergency ? "text-ink-300" : "text-ink-500")}>
        {service.shortDescription}
      </p>
      <div className={cn("mt-6 flex items-center justify-between gap-3 border-t pt-4 text-sm font-semibold", emergency ? "border-white/10" : "border-ink-100")}>
        <span className={cn("inline-flex items-center gap-1.5", emergency ? "text-accent-300" : "text-brand-700")} aria-hidden="true">
          Learn more
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
        <a
          href={telHref(phone.e164)}
          className={cn(
            "relative z-10 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors",
            emergency ? "bg-accent-400 text-ink-950 hover:bg-accent-300" : "text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50",
          )}
          aria-label={`Call now about ${service.name}`}
        >
          <Phone aria-hidden="true" className="size-3.5" /> Call Now
        </a>
      </div>
    </article>
  );
}
