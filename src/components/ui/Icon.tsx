import {
  Bath,
  Building2,
  Clock,
  Droplets,
  Flame,
  Fuel,
  Gauge,
  House,
  Layers,
  ReceiptText,
  Recycle,
  Search,
  ShieldCheck,
  Siren,
  Sparkles,
  Toilet,
  Users,
  Waves,
  Wrench,
  Cylinder,
  ShowerHead,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "@/types";

/** Maps CMS-friendly icon keys to icon components. Admins pick from this list. */
const ICONS: Record<IconName, LucideIcon> = {
  siren: Siren,
  drain: Droplets,
  sewer: Waves,
  jet: Gauge,
  flame: Flame,
  heater: Cylinder,
  tankless: Sparkles,
  search: Search,
  pipe: Wrench,
  slab: Layers,
  toilet: Toilet,
  faucet: ShowerHead,
  disposal: Recycle,
  gas: Fuel,
  softener: Droplets,
  bath: Bath,
  building: Building2,
  home: House,
  shield: ShieldCheck,
  clock: Clock,
  users: Users,
  receipt: ReceiptText,
  wrench: Wrench,
};

export function Icon({ name, className, strokeWidth = 1.75 }: { name: IconName | string; className?: string; strokeWidth?: number }) {
  const Cmp = ICONS[name as IconName] ?? Wrench;
  return <Cmp aria-hidden="true" className={className} strokeWidth={strokeWidth} />;
}
