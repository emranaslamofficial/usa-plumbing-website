import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import {
  LayoutDashboard, Inbox, Wrench, MapPin, FileText, Folder, Tags, Files, Search, HelpCircle, Star, Image, Building2, Phone, Clock,
  Menu, PanelBottom, Users, ShieldCheck, ArrowRightLeft, History, Settings, LogOut, KeyRound, BarChart3, X, UserCircle, Share2, Award, PenLine,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { cn } from "./ui";

type Item = { to: string; label: string; icon: typeof LayoutDashboard; perm?: string };
const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard:view" },
      { to: "/analytics", label: "Analytics", icon: BarChart3, perm: "dashboard:view" },
      { to: "/leads", label: "Leads", icon: Inbox, perm: "leads:read" },
    ],
  },
  {
    title: "Content",
    items: [
      { to: "/services", label: "Services", icon: Wrench, perm: "content:read" },
      { to: "/service-areas", label: "Service Areas", icon: MapPin, perm: "content:read" },
      { to: "/posts", label: "Blog", icon: FileText, perm: "content:read" },
      { to: "/categories", label: "Categories", icon: Folder, perm: "content:read" },
      { to: "/tags", label: "Tags", icon: Tags, perm: "content:read" },
      { to: "/authors", label: "Authors", icon: PenLine, perm: "content:read" },
      { to: "/pages", label: "Pages", icon: Files, perm: "content:read" },
      { to: "/faqs", label: "FAQs", icon: HelpCircle, perm: "content:read" },
      { to: "/testimonials", label: "Testimonials", icon: Star, perm: "content:read" },
      { to: "/media", label: "Media", icon: Image, perm: "content:read" },
    ],
  },
  {
    title: "SEO",
    items: [
      { to: "/seo", label: "SEO Overview", icon: Search, perm: "content:read" },
      { to: "/keywords", label: "Keywords", icon: KeyRound, perm: "content:read" },
      { to: "/redirects", label: "Redirects", icon: ArrowRightLeft, perm: "seo:write" },
    ],
  },
  {
    title: "Settings",
    items: [
      { to: "/settings/business", label: "Business Info", icon: Building2, perm: "settings:write" },
      { to: "/settings/phones", label: "Phone Numbers", icon: Phone, perm: "settings:write" },
      { to: "/settings/hours", label: "Business Hours", icon: Clock, perm: "settings:write" },
      { to: "/settings/trust", label: "Trust Badges", icon: Award, perm: "settings:write" },
      { to: "/settings/navigation", label: "Navigation", icon: Menu, perm: "settings:write" },
      { to: "/settings/footer", label: "Footer", icon: PanelBottom, perm: "settings:write" },
      { to: "/settings/social", label: "Social Links", icon: Share2, perm: "settings:write" },
      { to: "/settings/system", label: "System", icon: Settings, perm: "system:write" },
    ],
  },
  {
    title: "Administration",
    items: [
      { to: "/users", label: "Users", icon: Users, perm: "users:manage" },
      { to: "/roles", label: "Roles & Permissions", icon: ShieldCheck, perm: "users:manage" },
      { to: "/audit-logs", label: "Audit Logs", icon: History, perm: "audit:read" },
    ],
  },
];

export function Layout() {
  const { user, can, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const nav = (
    <nav aria-label="Admin" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {GROUPS.map((g) => {
        const items = g.items.filter((i) => !i.perm || can(i.perm));
        if (!items.length) return null;
        return (
          <div key={g.title}>
            <p className="px-3 pb-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-slate-400">{g.title}</p>
            <ul className="space-y-0.5">
              {items.map((i) => (
                <li key={i.to}>
                  <NavLink
                    to={i.to}
                    end={i.to === "/"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors", isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")
                    }
                  >
                    <i.icon className="size-4 shrink-0" aria-hidden />
                    {i.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:transition-none", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-5">
          <span className="font-bold text-slate-900">
            Website <span className="text-brand-600">Admin</span>
          </span>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>
        {nav}
        <div className="border-t border-slate-200 p-3">
          <NavLink to="/account" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-slate-100">
            <UserCircle className="size-5 text-slate-400" aria-hidden />
            <span className="min-w-0">
              <span className="block truncate font-medium text-slate-800">{user?.name}</span>
              <span className="block truncate text-xs text-slate-500">{user?.role}</span>
            </span>
          </NavLink>
          <button onClick={() => void logout()} className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
            <LogOut className="size-4" aria-hidden /> Sign out
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-md p-1.5 hover:bg-slate-100">
            <Menu className="size-5" />
          </button>
          <span className="font-semibold">Admin</span>
        </header>
        <main key={location.pathname} className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
