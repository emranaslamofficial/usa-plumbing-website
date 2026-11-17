import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Inbox, Sparkles, MessageSquare, FileText, CheckCircle2, PenLine, Wrench, MapPin, PhoneCall, CalendarClock } from "lucide-react";
import { api, fmtDate } from "../lib/api";
import { Badge, Card, ErrorBox, PageHeader, Spinner } from "../components/ui";

interface DashboardData {
  stats: Record<string, number>;
  recentLeads: { id: string; referenceId: string; name: string; zip: string; status: string; createdAt: string; source: string; service: { name: string } | null; serviceLabel: string | null }[];
  recentActivity: { id: string; action: string; entity: string; summary: string | null; createdAt: string; user: { name: string } | null }[];
}

export function Dashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ["dashboard"], queryFn: () => api.get<DashboardData>("/admin/dashboard"), refetchInterval: 60_000 });
  if (isLoading) return <Spinner />;
  if (error || !data) return <ErrorBox error={error} />;
  const s = data.stats;
  const tiles = [
    { label: "Total leads", value: s.totalLeads, icon: Inbox, to: "/leads" },
    { label: "New leads", value: s.newLeads, icon: Sparkles, to: "/leads?status=NEW", accent: s.newLeads > 0 },
    { label: "Contact requests", value: s.contactRequests, sub: s.unreadMessages ? `${s.unreadMessages} unread` : undefined, icon: MessageSquare, to: "/leads?source=CONTACT_FORM" },
    { label: "Call button clicks (30d)", value: s.callClicks30, icon: PhoneCall, to: "/analytics", sub: "clicks, not confirmed calls" },
    { label: "Blog posts", value: s.posts, icon: FileText, to: "/posts" },
    { label: "Published posts", value: s.published, icon: CheckCircle2, to: "/posts?status=PUBLISHED" },
    { label: "Draft posts", value: s.drafts, icon: PenLine, to: "/posts?status=DRAFT", sub: s.scheduled ? `${s.scheduled} scheduled` : undefined },
    { label: "Services", value: s.services, icon: Wrench, to: "/services" },
    { label: "Service areas", value: s.areas, icon: MapPin, to: "/service-areas" },
    { label: "Leads (30 days)", value: s.leads30, icon: CalendarClock, to: "/analytics" },
  ];
  return (
    <div>
      <PageHeader title="Dashboard" description="What's happening on your website." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {tiles.map((t) => (
          <Link key={t.label} to={t.to} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{t.label}</span>
              <t.icon className={t.accent ? "size-4 text-brand-600" : "size-4 text-slate-400"} aria-hidden />
            </div>
            <p className={t.accent ? "mt-2 text-2xl font-bold text-brand-700" : "mt-2 text-2xl font-bold text-slate-900"}>{t.value.toLocaleString()}</p>
            {t.sub && <p className="mt-0.5 text-xs text-slate-500">{t.sub}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Recent leads" actions={<Link to="/leads" className="text-sm font-medium text-brand-700 hover:underline">View all</Link>}>
          {data.recentLeads.length ? (
            <ul className="divide-y divide-slate-100">
              {data.recentLeads.map((l) => (
                <li key={l.id}>
                  <Link to={`/leads/${l.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-900">{l.name}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {l.service?.name ?? l.serviceLabel} · ZIP {l.zip} · {fmtDate(l.createdAt, true)}
                      </span>
                    </span>
                    <Badge>{l.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">No leads yet. Form submissions from the website appear here.</p>
          )}
        </Card>
        <Card title="Recent activity">
          <ul className="space-y-3">
            {data.recentActivity.map((a) => (
              <li key={a.id} className="text-sm">
                <span className="font-medium text-slate-800">{a.user?.name ?? "System"}</span> <span className="text-slate-500">{a.action.replace(/_/g, " ")}</span>{" "}
                <span className="text-slate-700">{a.entity}</span>
                {a.summary && <span className="text-slate-500"> — {a.summary}</span>}
                <span className="block text-xs text-slate-400">{fmtDate(a.createdAt, true)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

interface Analytics {
  days: number;
  clicksByType: Record<string, number>;
  callClicksByPage: { page: string; count: number }[];
  callClicksByDevice: { device: string; count: number }[];
  callClicksByPlacement: { placement: string; count: number }[];
  callClicksBySource: { source: string; count: number }[];
  leadsBySource: { source: string; count: number }[];
  leadsByUtm: { source: string; medium: string; campaign: string; count: number }[];
  daily: { day: string; calls: number; leads: number }[];
  confirmedCalls: number;
}

function Bars({ rows, label }: { rows: { name: string; count: number }[]; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Card title={label}>
      {rows.length ? (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.name} className="text-sm">
              <div className="flex justify-between gap-2">
                <span className="truncate text-slate-700">{r.name}</span>
                <span className="font-medium tabular-nums text-slate-900">{r.count}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No data yet.</p>
      )}
    </Card>
  );
}

export function AnalyticsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["analytics"], queryFn: () => api.get<Analytics>("/admin/analytics?days=30") });
  if (isLoading) return <Spinner />;
  if (error || !data) return <ErrorBox error={error} />;
  const max = Math.max(1, ...data.daily.map((d) => Math.max(d.calls, d.leads)));
  return (
    <div>
      <PageHeader title="Analytics" description="Last 30 days of conversion activity on the website." />
      <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
        <strong>Call clicks</strong> count taps on “Call Now” buttons — they are not confirmed phone calls. Confirmed calls ({data.confirmedCalls}) appear only once a call-tracking provider (CallRail, CTM, Twilio…) is connected in System settings.
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Call clicks", data.clicksByType.CALL ?? 0],
          ["Request-service clicks", data.clicksByType.REQUEST_SERVICE ?? 0],
          ["Leads", data.leadsBySource.reduce((a, b) => a + b.count, 0)],
          ["Confirmed calls", data.confirmedCalls],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">{l}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{v}</p>
          </div>
        ))}
      </div>
      <Card title="Daily call clicks vs. leads" className="mb-6">
        <div className="flex h-40 items-end gap-1" role="img" aria-label="Daily call clicks and leads chart">
          {data.daily.map((d) => (
            <div key={d.day} className="flex flex-1 items-end gap-px" title={`${d.day}: ${d.calls} call clicks, ${d.leads} leads`}>
              <div className="flex-1 rounded-t bg-brand-500" style={{ height: `${(d.calls / max) * 100}%`, minHeight: d.calls ? 2 : 0 }} />
              <div className="flex-1 rounded-t bg-amber-400" style={{ height: `${(d.leads / max) * 100}%`, minHeight: d.leads ? 2 : 0 }} />
            </div>
          ))}
        </div>
        <p className="mt-2 flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-brand-500" /> Call clicks</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-amber-400" /> Leads</span>
        </p>
      </Card>
      <div className="grid gap-6 md:grid-cols-2">
        <Bars label="Call clicks by page" rows={data.callClicksByPage.map((r) => ({ name: r.page, count: r.count }))} />
        <Bars label="Call clicks by button placement" rows={data.callClicksByPlacement.map((r) => ({ name: r.placement, count: r.count }))} />
        <Bars label="Call clicks by device" rows={data.callClicksByDevice.map((r) => ({ name: r.device, count: r.count }))} />
        <Bars label="Call clicks by traffic source (UTM)" rows={data.callClicksBySource.map((r) => ({ name: r.source, count: r.count }))} />
        <Bars label="Leads by form" rows={data.leadsBySource.map((r) => ({ name: r.source.replace(/_/g, " ").toLowerCase(), count: r.count }))} />
        <Bars label="Leads by campaign (source / medium / campaign)" rows={data.leadsByUtm.map((r) => ({ name: [r.source, r.medium, r.campaign].filter(Boolean).join(" / "), count: r.count }))} />
      </div>
    </div>
  );
}
