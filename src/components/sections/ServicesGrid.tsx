import type { ServiceSummary } from "@/types";
import { ServiceCard } from "./ServiceCard";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

export function ServicesGrid({
  services,
  phone,
  className,
}: {
  services: ServiceSummary[];
  phone: { display: string; e164: string };
  className?: string;
}) {
  return (
    <RevealGroup as="ul" className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {services.map((s) => (
        <RevealItem as="li" key={s.id}>
          <ServiceCard service={s} phone={phone} />
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
