"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ChevronDown, Menu, Phone, X, ArrowRight, Clock } from "lucide-react";
import type { NavLink, ServiceSummary } from "@/types";
import { Logo } from "./Logo";
import { CallButton, ButtonLink } from "@/components/ui/Button";
import { cn, servicePath, telHref } from "@/lib/utils";

interface Props {
  businessName: string;
  phone: { display: string; e164: string };
  services: ServiceSummary[];
  emergencyLabel?: string;
  hoursSummary: string;
  /** Header links managed in Admin → Navigation (the Services menu is built from published services). */
  nav: NavLink[];
  logo?: string;
}

export function Header({ businessName, phone, services, emergencyLabel, hoursSummary, nav, logo }: Props) {
  const NAV = nav;
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const servicesRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setMenuOpen(false);
    setServicesOpen(false);
  }, [pathname]);

  // Escape closes; lock page scroll while the mobile menu is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
      setServicesOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Click outside closes the services dropdown
  useEffect(() => {
    if (!servicesOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!servicesRef.current?.contains(e.target as Node)) setServicesOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [servicesOpen]);

  const openServices = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setServicesOpen(true);
  };
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setServicesOpen(false), 140);
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const regular = services.filter((s) => !s.isEmergency);

  return (
    <>
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] duration-300",
        scrolled ? "border-ink-100 bg-white/90 shadow-[0_6px_24px_-16px_rgb(15_26_49/0.35)] backdrop-blur-lg" : "border-transparent bg-white",
      )}
    >
      <div className={cn("container-x flex items-center justify-between gap-4 transition-[height] duration-300", scrolled ? "h-16" : "h-[4.5rem]")}>
        <Logo name={businessName} src={logo} />

        {/* Desktop navigation */}
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            <li>
              <div ref={servicesRef} className="relative" onMouseEnter={openServices} onMouseLeave={scheduleClose}>
                <button
                  type="button"
                  aria-expanded={servicesOpen}
                  aria-controls="services-menu"
                  onClick={() => setServicesOpen((v) => !v)}
                  className={cn(
                    "inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-[0.94rem] xl:px-3 font-semibold transition-colors hover:text-brand-700",
                    isActive("/services") ? "text-brand-700" : "text-ink-700",
                  )}
                >
                  Services
                  <ChevronDown aria-hidden="true" className={cn("size-4 transition-transform duration-200", servicesOpen && "rotate-180")} />
                </button>

                <AnimatePresence>
                  {servicesOpen && (
                    <m.div
                      id="services-menu"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18 }}
                      className="absolute left-1/2 top-full w-[min(46rem,90vw)] -translate-x-1/2 pt-3"
                    >
                      <div className="overflow-hidden rounded-2xl bg-white shadow-card-hover ring-1 ring-ink-100">
                        <ul className="grid grid-cols-2 gap-x-2 p-3 xl:grid-cols-3">
                          {regular.map((s) => (
                            <li key={s.id}>
                              <Link
                                href={servicePath(s)}
                                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                              >
                                {s.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-center justify-between gap-4 border-t border-ink-100 bg-ink-50 px-6 py-3.5">
                          <Link href="/services" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
                            View all plumbing services <ArrowRight aria-hidden="true" className="size-4" />
                          </Link>
                          <a href={telHref(phone.e164)} className="text-sm font-semibold text-ink-900 hover:text-brand-700">
                            Not sure? Call {phone.display}
                          </a>
                        </div>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </li>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-2.5 py-2 text-[0.94rem] font-semibold transition-colors hover:text-brand-700 xl:px-3",
                    isActive(item.href) ? "text-brand-700" : "text-ink-700",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a href={telHref(phone.e164)} className="hidden flex-col items-end leading-tight xl:flex" aria-label={`Call ${phone.display}`}>
            <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-ink-400">{emergencyLabel ?? "Call today"}</span>
            <span className="font-display text-lg font-extrabold tabular-nums text-ink-900">{phone.display}</span>
          </a>
          <span className="hidden sm:block">
            <CallButton phone={phone} label="Call Now" size="sm" className="lg:h-11 lg:px-5" />
          </span>
          {/* Compact call icon for the smallest screens */}
          <a
            href={telHref(phone.e164)}
            aria-label={`Call now at ${phone.display}`}
            className="grid size-11 place-items-center rounded-xl bg-accent-400 text-ink-950 sm:hidden"
          >
            <Phone aria-hidden="true" className="size-5" />
          </a>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="grid size-11 place-items-center rounded-xl text-ink-900 ring-1 ring-ink-200 transition-colors hover:bg-ink-50 lg:hidden"
          >
            <Menu aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>
    </header>

      {/* Mobile menu — rendered outside <header>: the header's backdrop-filter would otherwise
          become the containing block for these fixed elements once the page is scrolled. */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <m.div
              key="overlay"
              className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <m.div
              key="panel"
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl lg:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
            >
              <div className="flex h-[4.5rem] items-center justify-between border-b border-ink-100 px-4">
                <Logo name={businessName} src={logo} />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    menuButtonRef.current?.focus();
                  }}
                  aria-label="Close menu"
                  autoFocus
                  className="grid size-11 place-items-center rounded-xl ring-1 ring-ink-200 hover:bg-ink-50"
                >
                  <X aria-hidden="true" className="size-5" />
                </button>
              </div>

              <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-4 py-4">
                <ul className="flex flex-col gap-1">
                  {/* Services render last (order-last) so primary links stay above the fold */}
                  <li className="order-last mt-2 border-t border-ink-100 pt-2">
                    <Link href="/services" className="block rounded-lg px-3 py-3 text-lg font-semibold text-ink-900 hover:bg-ink-50">
                      All Services
                    </Link>
                    <ul className="mb-2 grid grid-cols-1 gap-0.5 border-l-2 border-brand-100 pl-3 min-[380px]:grid-cols-2">
                      {regular.map((s) => (
                        <li key={s.id}>
                          <Link href={servicePath(s)} className="block rounded-md px-2 py-2 text-sm text-ink-600 hover:bg-brand-50 hover:text-brand-700">
                            {s.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                  {NAV.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        className={cn(
                          "block rounded-lg px-3 py-3 text-lg font-semibold hover:bg-ink-50",
                          isActive(item.href) ? "text-brand-700" : "text-ink-900",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="space-y-3 border-t border-ink-100 bg-ink-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <CallButton phone={phone} showNumber className="w-full" size="lg" />
                <ButtonLink href="/request-service" variant="secondary" className="w-full" size="lg">
                  Request Service
                </ButtonLink>
                <p className="flex items-center justify-center gap-1.5 text-xs text-ink-500">
                  <Clock aria-hidden="true" className="size-3.5" /> {hoursSummary}
                </p>
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
