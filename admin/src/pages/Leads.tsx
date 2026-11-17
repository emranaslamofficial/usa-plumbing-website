import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Phone, Mail, ArrowLeft, Trash2 } from "lucide-react";
import { api, fmtDate, qs } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Badge, Button, Card, Empty, ErrorBox, Field, PageHeader, Pager, Spinner, Table, Td, useErrorToast, useToast } from "../components/ui";

export const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "BOOKED", "COMPLETED", "INVALID", "SPAM", "CLOSED"] as const;

interface LeadRow {
  id: string;
  referenceId: string;
  name: string;
  phone: string;
  email: string | null;
  zip: string;
  status: string;
  source: string;
  createdAt: string;
  utmSource: string | null;
  service: { name: string } | null;
  serviceLabel: string | null;
  assignedTo: { id: string; name: string } | null;
}

const fmtPhone = (p: string) => (p.length === 10 ? `(${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}` : p);

export function LeadsPage() {
  const [params, setParams] = useSearchParams();
  const { can } = useAuth();
  const f = {
    q: params.get("q") ?? "",
    status: params.get("status") ?? "",
    source: params.get("source") ?? "",
    serviceId: params.get("serviceId") ?? "",
    assignedToId: params.get("assignedToId") ?? "",
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    sort: params.get("sort") ?? "createdAt",
    dir: params.get("dir") ?? "desc",
    page: Number(params.get("page") ?? 1),
  };
  const setF = (patch: Partial<typeof f>) => {
    const next = { ...f, page: 1, ...patch };
    setParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v !== "" && v !== undefined).map(([k, v]) => [k, String(v)])));
  };
  const filters = { ...f, to: f.to ? `${f.to}T23:59:59` : "" };
  const { data, isLoading, error } = useQuery({ queryKey: ["leads", filters], queryFn: () => api.page<LeadRow[]>(`/admin/leads${qs({ ...filters, pageSize: 25 })}`) });
  const { data: services } = useQuery({ queryKey: ["services-min"], queryFn: () => api.get<{ id: string; name: string }[]>("/admin/services") });
  const { data: users } = useQuery({ queryKey: ["assignable"], queryFn: () => api.get<{ id: string; name: string }[]>("/admin/users/assignable") });
  const counts = (data?.meta?.statusCounts ?? {}) as Record<string, number>;
  const sortBy = (col: string) => setF({ sort: col, dir: f.sort === col && f.dir === "desc" ? "asc" : "desc" });

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Every website form submission. Click a lead to update status, assign it and add notes."
        actions={
          can("leads:export") && (
            <a href={`/api/v1/admin/leads/export${qs({ ...filters, page: undefined })}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-4 text-sm font-medium ring-1 ring-slate-300 hover:bg-slate-50">
              <Download className="size-4" /> Export CSV
            </a>
          )
        }
      />
      <div className="mb-4 flex flex-wrap gap-1.5">
        <button onClick={() => setF({ status: "" })} className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${!f.status ? "bg-brand-600 text-white ring-brand-600" : "bg-white ring-slate-200"}`}>
          All
        </button>
        {LEAD_STATUSES.map((s) => (
          <button key={s} onClick={() => setF({ status: s })} className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${f.status === s ? "bg-brand-600 text-white ring-brand-600" : "bg-white ring-slate-200"}`}>
            {s.charAt(0) + s.slice(1).toLowerCase()} {counts[s] ? `(${counts[s]})` : ""}
          </button>
        ))}
      </div>
      <div className="mb-4 grid gap-2 rounded-xl bg-white p-3 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-6">
        <input className="input" placeholder="Search name, phone, email, ZIP, reference…" defaultValue={f.q} onKeyDown={(e) => e.key === "Enter" && setF({ q: (e.target as HTMLInputElement).value })} onBlur={(e) => e.target.value !== f.q && setF({ q: e.target.value })} aria-label="Search leads" />
        <select className="input" value={f.source} onChange={(e) => setF({ source: e.target.value })} aria-label="Form">
          <option value="">All forms</option>
          <option value="SERVICE_REQUEST_FORM">Request form</option>
          <option value="CONTACT_FORM">Contact form</option>
          <option value="PHONE">Phone</option>
          <option value="MANUAL">Manual</option>
        </select>
        <select className="input" value={f.serviceId} onChange={(e) => setF({ serviceId: e.target.value })} aria-label="Service">
          <option value="">All services</option>
          {services?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input" value={f.assignedToId} onChange={(e) => setF({ assignedToId: e.target.value })} aria-label="Assigned to">
          <option value="">Anyone</option>
          <option value="none">Unassigned</option>
          {users?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <input className="input" type="date" value={f.from} onChange={(e) => setF({ from: e.target.value })} aria-label="From date" />
        <input className="input" type="date" value={f.to} onChange={(e) => setF({ to: e.target.value })} aria-label="To date" />
      </div>
      <ErrorBox error={error} />
      {isLoading ? (
        <Spinner />
      ) : !data?.data.length ? (
        <div className="rounded-xl bg-white ring-1 ring-slate-200">
          <Empty title="No leads match these filters" />
        </div>
      ) : (
        <>
          <Table
            head={[
              <button key="d" onClick={() => sortBy("createdAt")}>Received {f.sort === "createdAt" ? (f.dir === "desc" ? "↓" : "↑") : ""}</button>,
              <button key="n" onClick={() => sortBy("name")}>Name {f.sort === "name" ? (f.dir === "desc" ? "↓" : "↑") : ""}</button>,
              "Phone",
              "Service",
              <button key="z" onClick={() => sortBy("zip")}>ZIP</button>,
              "Source",
              "Assigned",
              <button key="s" onClick={() => sortBy("status")}>Status</button>,
            ]}
          >
            {data.data.map((l) => (
              <tr key={l.id} className="cursor-pointer hover:bg-slate-50">
                <Td className="whitespace-nowrap text-slate-500">
                  <Link to={`/leads/${l.id}`} className="block">{fmtDate(l.createdAt, true)}</Link>
                </Td>
                <Td>
                  <Link to={`/leads/${l.id}`} className="font-medium text-slate-900 hover:text-brand-700">{l.name}</Link>
                  <span className="block text-xs text-slate-400">{l.referenceId}</span>
                </Td>
                <Td className="whitespace-nowrap">
                  <a href={`tel:+1${l.phone}`} className="text-brand-700 hover:underline">{fmtPhone(l.phone)}</a>
                </Td>
                <Td>{l.service?.name ?? l.serviceLabel}</Td>
                <Td>{l.zip}</Td>
                <Td className="text-xs text-slate-500">
                  {l.source === "CONTACT_FORM" ? "Contact form" : l.source === "SERVICE_REQUEST_FORM" ? "Request form" : l.source.toLowerCase()}
                  {l.utmSource && <span className="block">utm: {l.utmSource}</span>}
                </Td>
                <Td className="text-slate-600">{l.assignedTo?.name ?? "—"}</Td>
                <Td><Badge>{l.status}</Badge></Td>
              </tr>
            ))}
          </Table>
          <Pager page={data.meta!.page!} totalPages={data.meta!.totalPages!} total={data.meta!.total} onPage={(p) => setF({ page: p })} />
        </>
      )}
    </div>
  );
}

interface LeadDetail extends LeadRow {
  preferredDate: string | null;
  preferredTime: string | null;
  message: string | null;
  landingPage: string | null;
  sourcePath: string | null;
  referrer: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  deviceType: string;
  userAgent: string | null;
  contactMessage: { subject: string | null; message: string } | null;
  notes: { id: string; body: string; createdAt: string; author: { name: string } | null }[];
  events: { id: string; type: string; fromStatus: string | null; toStatus: string | null; detail: string | null; createdAt: string; actor: { name: string } | null }[];
}

export function LeadDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const nav = useNavigate();
  const { can } = useAuth();
  const { toast, confirm } = useToast();
  const onErr = useErrorToast();
  const [note, setNote] = useState("");
  const { data: l, isLoading, error } = useQuery({ queryKey: ["lead", id], queryFn: () => api.get<LeadDetail>(`/admin/leads/${id}`) });
  const { data: users } = useQuery({ queryKey: ["assignable"], queryFn: () => api.get<{ id: string; name: string }[]>("/admin/users/assignable") });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["lead", id] });
    void qc.invalidateQueries({ queryKey: ["leads"] });
  };
  const update = useMutation({ mutationFn: (body: Record<string, unknown>) => api.patch(`/admin/leads/${id}`, body), onSuccess: () => (toast("Lead updated"), refresh()), onError: onErr });
  const addNote = useMutation({ mutationFn: () => api.post(`/admin/leads/${id}/notes`, { body: note }), onSuccess: () => (setNote(""), toast("Note added"), refresh()), onError: onErr });

  if (isLoading) return <Spinner />;
  if (error || !l) return <ErrorBox error={error} />;
  const attribution: [string, string | null][] = [
    ["Landing page", l.landingPage],
    ["Submitted from", l.sourcePath],
    ["Referrer", l.referrer],
    ["UTM source", l.utmSource],
    ["UTM medium", l.utmMedium],
    ["UTM campaign", l.utmCampaign],
    ["UTM term", l.utmTerm],
    ["UTM content", l.utmContent],
    ["Device", l.deviceType],
  ];

  return (
    <div>
      <Link to="/leads" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" /> All leads
      </Link>
      <PageHeader
        title={l.name}
        description={`${l.referenceId} · received ${fmtDate(l.createdAt, true)}`}
        actions={
          can("leads:delete") && (
            <Button
              variant="secondary"
              onClick={async () => {
                if (!(await confirm("Delete this lead? It will be removed from the inbox and exports.", { danger: true, confirmLabel: "Delete lead" }))) return;
                try {
                  await api.del(`/admin/leads/${id}`);
                  toast("Lead deleted");
                  refresh();
                  nav("/leads");
                } catch (e) {
                  onErr(e);
                }
              }}
            >
              <Trash2 className="size-4 text-red-600" /> Delete
            </Button>
          )
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card title="Request">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Phone</dt><dd><a href={`tel:+1${l.phone}`} className="inline-flex items-center gap-1 font-semibold text-brand-700"><Phone className="size-4" />{fmtPhone(l.phone)}</a></dd></div>
              <div><dt className="text-slate-500">Email</dt><dd>{l.email ? <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 text-brand-700"><Mail className="size-4" />{l.email}</a> : "—"}</dd></div>
              <div><dt className="text-slate-500">Service</dt><dd className="font-medium">{l.service?.name ?? l.serviceLabel}</dd></div>
              <div><dt className="text-slate-500">ZIP</dt><dd>{l.zip}</dd></div>
              <div><dt className="text-slate-500">Preferred date</dt><dd>{l.preferredDate ? fmtDate(l.preferredDate) : "Any"}</dd></div>
              <div><dt className="text-slate-500">Preferred time</dt><dd>{l.preferredTime?.toLowerCase() ?? "Any"}</dd></div>
            </dl>
            {(l.contactMessage?.subject || l.message) && (
              <div className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
                {l.contactMessage?.subject && <p className="mb-1 font-semibold">{l.contactMessage.subject}</p>}
                {l.message}
              </div>
            )}
          </Card>
          <Card title="Notes">
            {can("leads:write") && (
              <form className="mb-4 space-y-2" onSubmit={(e) => (e.preventDefault(), note.trim() && addNote.mutate())}>
                <textarea className="input" rows={3} placeholder="Add an internal note (call outcome, quote, follow-up date…)" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button type="submit" loading={addNote.isPending} disabled={!note.trim()}>Add note</Button>
              </form>
            )}
            <ul className="space-y-3">
              {l.notes.map((n) => (
                <li key={n.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="whitespace-pre-wrap text-slate-800">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-500">{n.author?.name ?? "—"} · {fmtDate(n.createdAt, true)}</p>
                </li>
              ))}
              {!l.notes.length && <li className="text-sm text-slate-500">No notes yet.</li>}
            </ul>
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Status & assignment">
            <div className="space-y-4">
              <Field label="Status">
                <select className="input" value={l.status} disabled={!can("leads:write")} onChange={(e) => update.mutate({ status: e.target.value })}>
                  {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                </select>
              </Field>
              <Field label="Assigned to">
                <select className="input" value={l.assignedTo?.id ?? ""} disabled={!can("leads:write")} onChange={(e) => update.mutate({ assignedToId: e.target.value || null })}>
                  <option value="">Unassigned</option>
                  {users?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </Field>
            </div>
          </Card>
          <Card title="Attribution">
            <dl className="space-y-1.5 text-sm">
              {attribution.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="shrink-0 text-slate-500">{k}</dt>
                  <dd className="truncate text-right text-slate-800" title={v ?? ""}>{v || "—"}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card title="Timeline">
            <ol className="space-y-2 text-sm">
              {l.events.map((e) => (
                <li key={e.id}>
                  <span className="font-medium text-slate-800">
                    {e.type === "STATUS_CHANGED" ? `Status ${e.fromStatus?.toLowerCase()} → ${e.toStatus?.toLowerCase()}` : e.type === "ASSIGNED" ? `Assigned to ${e.detail}` : e.type === "CREATED" ? "Lead created" : "Note added"}
                  </span>
                  <span className="block text-xs text-slate-500">{e.actor?.name ?? "Website"} · {fmtDate(e.createdAt, true)}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
