import Link from "next/link";
import { Phone, ArrowRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn, telHref } from "@/lib/utils";

type Variant = "call" | "primary" | "secondary" | "ghost" | "outline-light";
type Size = "sm" | "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold tracking-tight transition-all duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-offset-[3px]";

const variants: Record<Variant, string> = {
  call: "bg-accent-400 text-ink-950 shadow-cta hover:bg-accent-300 hover:-translate-y-0.5",
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:-translate-y-0.5",
  secondary: "bg-white text-ink-900 ring-1 ring-ink-200 hover:ring-brand-300 hover:text-brand-700 hover:-translate-y-0.5",
  ghost: "text-brand-700 hover:text-brand-800 hover:bg-brand-50",
  "outline-light": "text-white ring-1 ring-white/30 hover:bg-white/10 hover:ring-white/60",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-[0.95rem]",
  lg: "h-14 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type LinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size; arrow?: boolean };

export function ButtonLink({ variant = "primary", size = "md", arrow, className, children, ...rest }: LinkProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {children}
      {arrow && <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />}
    </Link>
  );
}

interface CallProps {
  phone: { display: string; e164: string };
  label?: ReactNode;
  showNumber?: boolean;
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Pulsing ring on the phone icon — use sparingly (emergency contexts). */
  attention?: boolean;
}

/** Click-to-call button. Always a real tel: link so it works on every device. */
export function CallButton({ phone, label = "Call Us Now", showNumber, variant = "call", size = "md", className, attention }: CallProps) {
  return (
    <a
      href={telHref(phone.e164)}
      className={buttonClass(variant, size, className)}
      aria-label={`Call us now at ${phone.display}`}
      data-cta="call"
    >
      <span className="relative inline-flex">
        {attention && (
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-current opacity-40 motion-safe:animate-pulse-ring" />
        )}
        <Phone aria-hidden="true" className="relative size-[1.1em] transition-transform group-hover:rotate-[-8deg]" />
      </span>
      <span>{label}</span>
      {showNumber && <span className="hidden font-bold tabular-nums sm:inline">· {phone.display}</span>}
    </a>
  );
}
