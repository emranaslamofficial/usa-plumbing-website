import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, fmtDate, qs } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Badge, Button, Card, ErrorBox, Field, Modal, PageHeader, Pager, Spinner, Table, Td, Toggle, fieldError, useErrorToast, useToast } from "../components/ui";
import { MediaField } from "../components/MediaPicker";
import { StringListEditor } from "../components/editors";

function useSave() {
  const { toast } = useToast();
  const onErr = useErrorToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const run = async (fn: () => Promise<unknown>, msg = "Saved — the website updates within a minute") => {
    setSaving(true);
    setError(null);
    try {
      await fn();
      toast(msg);
    } catch (e) {
      setError(e);
      onErr(e);
    } finally {
      setSaving(false);
    }
  };
  return { saving, error, run };
}

// ── Business info ──

export function BusinessSettings() {
  const { data, isLoading } = useQuery({ queryKey: ["business"], queryFn: () => api.get<any>("/admin/settings/business") });
  const [f, setF] = useState<any>(null);
  const { saving, error, run } = useSave();
  useEffect(() => data && setF(data), [data]);
  if (isLoading || !f) return <Spinner />;
  const set = (k: string, v: unknown) => setF((x: any) => ({ ...x, [k]: v }));
  const text = (k: string, label: string, opts: { hint?: string; type?: string; span?: boolean; required?: boolean } = {}) => (
    <Field label={label} hint={opts.hint} required={opts.required} error={fieldError(error, k)} className={opts.span ? "sm:col-span-2" : ""}>
      <input className="input" type={opts.type ?? "text"} value={f[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
    </Field>
  );
  const save = () => run(() => {
    const { id: _i, updatedAt: _u, logo: _l, favicon: _f, ...body } = f;
    for (const k of ["licenseNumber", "priceRange"]) if (body[k] === "") body[k] = null;
    return api.put("/admin/settings/business", body);
  });
  return (
    <div>
      <PageHeader title="Business information" description="Shown across the website (header, footer, contact page, legal pages and search-engine schema). Nothing is hard-coded." actions={<Button loading={saving} onClick={() => void save()}>Save changes</Button>} />
      <ErrorBox error={error} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Identity">
          <div className="grid gap-4 sm:grid-cols-2">
            {text("businessName", "Business name", { required: true })}
            {text("legalName", "Legal name", { required: true })}
            {text("tagline", "Tagline", { span: true })}
            <Field label="Short description" className="sm:col-span-2"><textarea className="input" rows={3} value={f.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} /></Field>
            <MediaField label="Logo" value={f.logoId} media={f.logo} onChange={(v) => set("logoId", v)} />
            <MediaField label="Favicon (square PNG, 512×512)" value={f.faviconId} media={f.favicon} onChange={(v) => set("faviconId", v)} />
          </div>
        </Card>
        <Card title="Contact & address">
          <div className="grid gap-4 sm:grid-cols-2">
            {text("email", "Email", { type: "email", span: true, required: true })}
            {text("street", "Street address", { span: true })}
            {text("city", "City")}
            {text("region", "State")}
            {text("postalCode", "ZIP code")}
            {text("serviceAreaLabel", "Service area label", { hint: "e.g. “Houston, Dallas & Austin” — used in headlines", required: true })}
            <p className="text-xs text-slate-500 sm:col-span-2">Phone numbers are managed under Settings → Phone Numbers.</p>
          </div>
        </Card>
        <Card title="Emergency availability">
          <div className="space-y-4">
            <Toggle label="We offer emergency / after-hours service" description="Turn off if you don't — the website's 24/7 wording adjusts automatically." checked={f.emergencyAvailable} onChange={(v) => set("emergencyAvailable", v)} />
            <div className="grid gap-4 sm:grid-cols-2">
              {text("emergencyLabel", "Emergency label", { hint: "e.g. 24/7 Emergency Plumbing" })}
              {text("emergencyShortLabel", "Short label", { hint: "e.g. 24/7 Emergency" })}
            </div>
          </div>
        </Card>
        <Card title="Trust & compliance">
          <div className="grid gap-4">
            {text("licenseNumber", "License number", { hint: "Shown in the footer. Leave blank to hide." })}
            <Field label="Price range (schema)">
              <select className="input" value={f.priceRange ?? ""} onChange={(e) => set("priceRange", e.target.value || null)}>
                <option value="">—</option>{["$", "$$", "$$$", "$$$$"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Trust footnote" hint="Shown below trust badges marked with *. Only state what you can verify."><textarea className="input" rows={3} value={f.trustFootnote} onChange={(e) => set("trustFootnote", e.target.value)} /></Field>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Hours ──

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
type Day = { dayOfWeek: number; isClosed: boolean; opensAt: string | null; closesAt: string | null; note: string | null };

export function HoursSettings() {
  const { data, isLoading } = useQuery({ queryKey: ["hours"], queryFn: () => api.get<Day[]>("/admin/settings/hours") });
  const [days, setDays] = useState<Day[]>([]);
  const { saving, error, run } = useSave();
  useEffect(() => {
    if (data) setDays(DAYS.map((_, i) => data.find((d) => d.dayOfWeek === i) ?? { dayOfWeek: i, isClosed: true, opensAt: null, closesAt: null, note: null }));
  }, [data]);
  if (isLoading) return <Spinner />;
  const set = (i: number, patch: Partial<Day>) => setDays((d) => d.map((x) => (x.dayOfWeek === i ? { ...x, ...patch } : x)));
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <div>
      <PageHeader title="Business hours" description="Used for the website header/footer, contact page and opening-hours schema. Consecutive days with the same hours are grouped automatically (e.g. “Mon – Fri”)." actions={<Button loading={saving} onClick={() => void run(() => api.put("/admin/settings/hours", { days }))}>Save hours</Button>} />
      <ErrorBox error={error} />
      <Card>
        <ul className="divide-y divide-slate-100">
          {order.map((i) => {
            const d = days.find((x) => x.dayOfWeek === i);
            if (!d) return null;
            return (
              <li key={i} className="grid items-center gap-3 py-3 sm:grid-cols-[8rem_7rem_1fr_1fr_2fr]">
                <span className="font-medium text-slate-800">{DAYS[i]}</span>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!d.isClosed} onChange={(e) => set(i, { isClosed: !e.target.checked, opensAt: d.opensAt ?? "08:00", closesAt: d.closesAt ?? "17:00" })} /> Open</label>
                <input className="input" type="time" disabled={d.isClosed} value={d.opensAt ?? ""} onChange={(e) => set(i, { opensAt: e.target.value })} aria-label={`${DAYS[i]} opens`} />
                <input className="input" type="time" disabled={d.isClosed} value={d.closesAt ?? ""} onChange={(e) => set(i, { closesAt: e.target.value })} aria-label={`${DAYS[i]} closes`} />
                <input className="input" placeholder={d.isClosed ? "e.g. Emergency calls only" : "Optional note"} value={d.note ?? ""} onChange={(e) => set(i, { note: e.target.value || null })} aria-label={`${DAYS[i]} note`} />
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

// ── Footer ──

export function FooterSettingsPage() {
  const { data } = useQuery({ queryKey: ["footer"], queryFn: () => api.get<any>("/admin/settings/footer") });
  const [f, setF] = useState<any>(null);
  const { saving, error, run } = useSave();
  useEffect(() => data && setF(data), [data]);
  if (!f) return <Spinner />;
  const set = (k: string, v: unknown) => setF((x: any) => ({ ...x, [k]: v }));
  return (
    <div>
      <PageHeader title="Footer" description="Footer links are edited under Navigation (Quick links & Legal). Contact details come from Business Info." actions={<Button loading={saving} onClick={() => void run(() => api.put("/admin/settings/footer", { description: f.description || null, showServices: f.showServices, servicesLimit: f.servicesLimit, showServiceAreas: f.showServiceAreas, showHours: f.showHours, copyrightText: f.copyrightText || null }))}>Save</Button>} />
      <ErrorBox error={error} />
      <Card>
        <div className="max-w-xl space-y-4">
          <Field label="Footer description" hint="Defaults to the business short description."><textarea className="input" rows={3} value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
          <Toggle label="Show services column" checked={f.showServices} onChange={(v) => set("showServices", v)} />
          <Field label="Number of services to list"><input className="input w-32" type="number" min={1} max={30} value={f.servicesLimit} onChange={(e) => set("servicesLimit", Number(e.target.value))} /></Field>
          <Toggle label="Show service areas" checked={f.showServiceAreas} onChange={(v) => set("showServiceAreas", v)} />
          <Toggle label="Show business hours" checked={f.showHours} onChange={(v) => set("showHours", v)} />
          <Field label="Copyright text" hint="Defaults to “© {year} {legal name}. All rights reserved.”"><input className="input" value={f.copyrightText ?? ""} onChange={(e) => set("copyrightText", e.target.value)} /></Field>
        </div>
      </Card>
    </div>
  );
}

// ── System ──

export function SystemSettings() {
  const { data } = useQuery({ queryKey: ["system"], queryFn: () => api.get<Record<string, any>>("/admin/settings/system") });
  const [s, setS] = useState<Record<string, any> | null>(null);
  const { saving, error, run } = useSave();
  useEffect(() => {
    if (data) setS({ robots: { allowIndexing: true, disallow: ["/api/"], extra: "" }, leadNotifications: { emails: [] }, callTracking: { provider: "none", scriptUrl: null }, analytics: { ga4MeasurementId: null, gtmId: null }, ...data });
  }, [data]);
  if (!s) return <Spinner />;
  const set = (key: string, patch: Record<string, unknown>) => setS((x) => ({ ...x!, [key]: { ...x![key], ...patch } }));
  const saveKey = (key: string) => run(() => api.put(`/admin/settings/system/${key}`, s[key]));
  return (
    <div>
      <PageHeader title="System settings" />
      <ErrorBox error={error} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Search engines (robots.txt)" actions={<Button size="sm" loading={saving} onClick={() => void saveKey("robots")}>Save</Button>}>
          <div className="space-y-4">
            <Toggle label="Allow search engines to index the site" description="Turn off for a staging site. Production only." checked={s.robots.allowIndexing} onChange={(v) => set("robots", { allowIndexing: v })} />
            <StringListEditor label="Disallowed paths" value={s.robots.disallow} onChange={(v) => set("robots", { disallow: v })} placeholder="/private-path" />
          </div>
        </Card>
        <Card title="Lead notifications" actions={<Button size="sm" loading={saving} onClick={() => void saveKey("leadNotifications")}>Save</Button>}>
          <StringListEditor label="Email new leads to" value={s.leadNotifications.emails} onChange={(v) => set("leadNotifications", { emails: v.filter((x) => x !== undefined) })} placeholder="office@company.com" />
        </Card>
        <Card title="Call tracking" actions={<Button size="sm" loading={saving} onClick={() => void saveKey("callTracking")}>Save</Button>}>
          <div className="space-y-4">
            <p className="text-xs text-slate-500">The website already records clicks on every “Call Now” button. To count <em>completed</em> calls, connect a call-tracking provider and point its webhook to <code>/api/v1/webhooks/calls/&lt;provider&gt;</code> (signed with CALL_TRACKING_WEBHOOK_SECRET).</p>
            <Field label="Provider">
              <select className="input" value={s.callTracking.provider} onChange={(e) => set("callTracking", { provider: e.target.value })}>
                {["none", "callrail", "ctm", "twilio", "other"].map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Dynamic number insertion script URL" hint="Optional, https only. Loaded on the website to swap tracking numbers."><input className="input" value={s.callTracking.scriptUrl ?? ""} onChange={(e) => set("callTracking", { scriptUrl: e.target.value || null })} /></Field>
          </div>
        </Card>
        <Card title="Analytics" actions={<Button size="sm" loading={saving} onClick={() => void saveKey("analytics")}>Save</Button>}>
          <div className="space-y-4">
            <Field label="GA4 measurement ID" hint="G-XXXXXXX"><input className="input" value={s.analytics.ga4MeasurementId ?? ""} onChange={(e) => set("analytics", { ga4MeasurementId: e.target.value || null })} /></Field>
            <Field label="Google Tag Manager ID" hint="GTM-XXXXXX"><input className="input" value={s.analytics.gtmId ?? ""} onChange={(e) => set("analytics", { gtmId: e.target.value || null })} /></Field>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Users ──

interface UserRow { id: string; email: string; name: string; isActive: boolean; lastLoginAt: string | null; twoFactorEnabled: boolean; lockedUntil: string | null; role: { id: string; name: string } }

export function UsersPage() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const { toast, confirm } = useToast();
  const onErr = useErrorToast();
  const { data, isLoading } = useQuery({ queryKey: ["users"], queryFn: () => api.get<UserRow[]>("/admin/users") });
  const { data: roles } = useQuery({ queryKey: ["roles"], queryFn: () => api.get<{ id: string; name: string }[]>("/admin/roles") });
  const [edit, setEdit] = useState<{ id?: string; name: string; email: string; roleId: string; password: string; isActive: boolean } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["users"] });
  const save = async () => {
    if (!edit) return;
    setError(null);
    try {
      if (edit.id) await api.patch(`/admin/users/${edit.id}`, { name: edit.name, roleId: edit.roleId, isActive: edit.isActive, ...(edit.password ? { password: edit.password } : {}) });
      else await api.post("/admin/users", { name: edit.name, email: edit.email, roleId: edit.roleId, password: edit.password });
      toast("User saved");
      setEdit(null);
      void refresh();
    } catch (e) {
      setError(e);
    }
  };
  if (isLoading) return <Spinner />;
  return (
    <div>
      <PageHeader title="Users" description="Staff who can sign in to this admin. Passwords are hashed (Argon2id) and never visible." actions={<Button onClick={() => setEdit({ name: "", email: "", roleId: roles?.[0]?.id ?? "", password: "", isActive: true })}>Add user</Button>} />
      <Table head={["Name", "Email", "Role", "2FA", "Last sign-in", "Status", ""]}>
        {data?.map((u) => (
          <tr key={u.id}>
            <Td className="font-medium text-slate-900">{u.name}{u.id === me?.id && <span className="ml-1 text-xs text-slate-400">(you)</span>}</Td>
            <Td>{u.email}</Td>
            <Td>{u.role.name}</Td>
            <Td>{u.twoFactorEnabled ? <Badge tone="PUBLISHED">On</Badge> : <span className="text-xs text-slate-400">Off</span>}</Td>
            <Td className="text-slate-500">{fmtDate(u.lastLoginAt, true)}</Td>
            <Td>{u.lockedUntil && new Date(u.lockedUntil) > new Date() ? <Badge tone="SPAM">Locked</Badge> : u.isActive ? <Badge tone="PUBLISHED">Active</Badge> : <Badge tone="ARCHIVED">Inactive</Badge>}</Td>
            <Td className="whitespace-nowrap text-right">
              {u.lockedUntil && new Date(u.lockedUntil) > new Date() && <Button size="sm" variant="ghost" onClick={async () => { await api.patch(`/admin/users/${u.id}`, { unlock: true }).catch(onErr); void refresh(); }}>Unlock</Button>}
              <Button size="sm" variant="secondary" onClick={() => setEdit({ id: u.id, name: u.name, email: u.email, roleId: u.role.id, password: "", isActive: u.isActive })}>Edit</Button>
              {u.id !== me?.id && <Button size="sm" variant="ghost" onClick={async () => { if (await confirm(`Delete ${u.email}? Their notes and history are kept.`, { danger: true, confirmLabel: "Delete user" })) { await api.del(`/admin/users/${u.id}`).catch(onErr); void refresh(); } }}>Delete</Button>}
            </Td>
          </tr>
        ))}
      </Table>
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?.id ? "Edit user" : "Add user"} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={() => void save()}>Save</Button></>}>
        {edit && (
          <div className="space-y-4">
            <ErrorBox error={error} />
            <Field label="Name" error={fieldError(error, "name")}><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Email" error={fieldError(error, "email")}><input className="input" type="email" disabled={Boolean(edit.id)} value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></Field>
            <Field label="Role"><select className="input" value={edit.roleId} onChange={(e) => setEdit({ ...edit, roleId: e.target.value })}>{roles?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></Field>
            <Field label={edit.id ? "New password (leave blank to keep)" : "Temporary password"} hint="At least 12 characters with letters and a number. Share it securely; the user should change it." error={fieldError(error, "password")}>
              <input className="input" type="password" autoComplete="new-password" value={edit.password} onChange={(e) => setEdit({ ...edit, password: e.target.value })} />
            </Field>
            {edit.id && edit.id !== me?.id && <Toggle label="Active" description="Inactive users cannot sign in." checked={edit.isActive} onChange={(v) => setEdit({ ...edit, isActive: v })} />}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Roles ──

interface Role { id: string; name: string; description: string | null; isSystem: boolean; permissions: string[]; _count: { users: number } }
interface Perm { key: string; group: string; description: string }

export function RolesPage() {
  const qc = useQueryClient();
  const { can } = useAuth();
  const { toast, confirm } = useToast();
  const onErr = useErrorToast();
  const { data: roles, isLoading } = useQuery({ queryKey: ["roles"], queryFn: () => api.get<Role[]>("/admin/roles") });
  const { data: perms } = useQuery({ queryKey: ["perms"], queryFn: () => api.get<Perm[]>("/admin/roles/permissions") });
  const [edit, setEdit] = useState<{ id?: string; name: string; description: string; permissions: string[] } | null>(null);
  if (isLoading) return <Spinner />;
  const groups = [...new Set(perms?.map((p) => p.group))];
  const save = async () => {
    if (!edit) return;
    try {
      const body = { name: edit.name, description: edit.description || null, permissions: edit.permissions };
      if (edit.id) await api.put(`/admin/roles/${edit.id}`, body);
      else await api.post("/admin/roles", body);
      toast("Role saved");
      setEdit(null);
      void qc.invalidateQueries({ queryKey: ["roles"] });
    } catch (e) {
      onErr(e);
    }
  };
  return (
    <div>
      <PageHeader title="Roles & permissions" description="The Owner role always has every permission." actions={can("roles:manage") && <Button onClick={() => setEdit({ name: "", description: "", permissions: [] })}>New role</Button>} />
      <div className="grid gap-4 md:grid-cols-2">
        {roles?.map((r) => (
          <Card key={r.id} title={r.name} actions={can("roles:manage") && !r.isSystem && <div className="flex gap-1"><Button size="sm" variant="secondary" onClick={() => setEdit({ id: r.id, name: r.name, description: r.description ?? "", permissions: r.permissions })}>Edit</Button><Button size="sm" variant="ghost" onClick={async () => { if (await confirm(`Delete role ${r.name}?`, { danger: true })) { await api.del(`/admin/roles/${r.id}`).catch(onErr); void qc.invalidateQueries({ queryKey: ["roles"] }); } }}>Delete</Button></div>}>
            <p className="mb-2 text-sm text-slate-500">{r.description} · {r._count.users} user(s)</p>
            <div className="flex flex-wrap gap-1">{r.permissions.map((p) => <Badge key={p} tone="SECONDARY">{p}</Badge>)}</div>
          </Card>
        ))}
      </div>
      <Modal open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?.id ? "Edit role" : "New role"} wide footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={() => void save()}>Save</Button></>}>
        {edit && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
              <Field label="Description"><input className="input" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
            </div>
            {groups.map((g) => (
              <fieldset key={g}>
                <legend className="mb-1 text-sm font-semibold text-slate-800">{g}</legend>
                <div className="grid gap-1 sm:grid-cols-2">
                  {perms?.filter((p) => p.group === g).map((p) => (
                    <label key={p.key} className="flex items-start gap-2 text-sm">
                      <input type="checkbox" className="mt-1" checked={edit.permissions.includes(p.key)} onChange={(e) => setEdit({ ...edit, permissions: e.target.checked ? [...edit.permissions, p.key] : edit.permissions.filter((x) => x !== p.key) })} />
                      <span>{p.description} <code className="text-xs text-slate-400">{p.key}</code></span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Audit log ──

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["audit", page, entity], queryFn: () => api.page<any[]>(`/admin/audit-logs${qs({ page, entity, pageSize: 50 })}`) });
  return (
    <div>
      <PageHeader title="Audit log" description="Every change made in the admin, with who made it and when." />
      <select className="input mb-4 max-w-xs" value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }} aria-label="Filter by type">
        <option value="">All types</option>
        {["Lead", "Service", "ServiceArea", "Post", "Page", "Media", "Keyword", "User", "Role", "BusinessInfo", "BusinessHours", "Redirect", "SystemSetting"].map((e) => <option key={e}>{e}</option>)}
      </select>
      {isLoading ? <Spinner /> : (
        <>
          <Table head={["When", "Who", "Action", "Type", "Details"]}>
            {data?.data.map((a) => (
              <tr key={a.id}>
                <Td className="whitespace-nowrap text-slate-500">{fmtDate(a.createdAt, true)}</Td>
                <Td>{a.user?.name ?? "System"}</Td>
                <Td><Badge tone="SECONDARY">{a.action}</Badge></Td>
                <Td>{a.entity}</Td>
                <Td className="max-w-md text-xs text-slate-600">
                  {a.summary}
                  {a.diff && typeof a.diff === "object" && !Array.isArray(a.diff) && Object.keys(a.diff).length > 0 && (
                    <details className="mt-1"><summary className="cursor-pointer text-slate-400">changes</summary><pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-2">{JSON.stringify(a.diff, null, 2)}</pre></details>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
          {data?.meta && <Pager page={data.meta.page!} totalPages={data.meta.totalPages!} total={data.meta.total} onPage={setPage} />}
        </>
      )}
    </div>
  );
}

// ── My account: password & 2FA ──

export function AccountPage() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [setup, setSetup] = useState<{ otpauthUrl: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [disablePw, setDisablePw] = useState("");
  const { saving, error, run } = useSave();
  return (
    <div>
      <PageHeader title="My account" description={`${user?.name} · ${user?.email} · ${user?.role}`} />
      <ErrorBox error={error} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Change password">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void run(async () => { await api.post("/auth/password", pw); setPw({ currentPassword: "", newPassword: "" }); }, "Password changed — other sessions were signed out"); }}>
            <Field label="Current password"><input className="input" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
            <Field label="New password" hint="At least 12 characters with letters and a number." error={fieldError(error, "newPassword")}><input className="input" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
            <Button type="submit" loading={saving}>Update password</Button>
          </form>
        </Card>
        <Card title="Two-factor authentication">
          {user?.twoFactorEnabled ? (
            <div className="space-y-3">
              <p className="text-sm text-emerald-700">2FA is on. You'll be asked for a code from your authenticator app at sign-in.</p>
              <Field label="Confirm password to turn off"><input className="input" type="password" value={disablePw} onChange={(e) => setDisablePw(e.target.value)} /></Field>
              <Button variant="secondary" onClick={() => void run(async () => { await api.post("/auth/2fa/disable", { password: disablePw }); setDisablePw(""); await refresh(); }, "2FA turned off")}>Turn off 2FA</Button>
            </div>
          ) : setup ? (
            <div className="space-y-3 text-sm">
              <p>1. In Google Authenticator, 1Password, Authy or similar, add an account using this setup key:</p>
              <code className="block break-all rounded bg-slate-100 p-2 text-xs">{setup.secret}</code>
              <p className="text-xs text-slate-500">Or open this link on your phone: <a href={setup.otpauthUrl} className="break-all text-brand-700">{setup.otpauthUrl.slice(0, 48)}…</a></p>
              <p>2. Enter the 6-digit code it shows:</p>
              <input className="input max-w-[10rem] tracking-[0.3em]" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
              <Button onClick={() => void run(async () => { await api.post("/auth/2fa/enable", { code }); setSetup(null); setCode(""); await refresh(); toast("2FA enabled"); }, "2FA enabled")}>Verify & enable</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Add a second step at sign-in using an authenticator app. Strongly recommended for Owner and Administrator accounts.</p>
              <Button onClick={() => void run(async () => setSetup(await api.post("/auth/2fa/setup")), "Scan the setup key to continue")}>Set up 2FA</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
