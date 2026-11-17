import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, AlertTriangle, CheckCircle2, Copy, Trash2 } from "lucide-react";
import { api, ApiError, fmtDate, qs } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Badge, Button, Card, Empty, ErrorBox, Field, Modal, PageHeader, Pager, Spinner, Table, Td, Tabs, useErrorToast, useToast } from "../components/ui";
import { ACCEPT, useUpload, type MediaItem } from "../components/MediaPicker";

type Target = { id: string; label: string; path: string };
interface KeywordRow {
  id: string; keyword: string; monthlyVolume: number | null; difficulty: number | null; cpc: number | null; intent: string | null; category: string | null; priority: string; targetHint: string | null;
  role: string | null; status: string; notes: string | null; isHome: boolean;
  service: { id: string; name: string } | null; serviceArea: { id: string; slug: string } | null; post: { id: string; title: string } | null; page: { id: string; title: string } | null;
}

const VIEWS = [
  ["all", "All"], ["unused", "Unused"], ["assigned", "Assigned"], ["service", "Service"], ["location", "Location"], ["blog", "Blog"], ["home", "Homepage"], ["ignored", "Ignored"],
] as const;

const targetLabel = (k: KeywordRow) => (k.isHome ? "Homepage" : k.service?.name ?? k.post?.title ?? k.page?.title ?? (k.serviceArea ? `/service-areas/${k.serviceArea.slug}` : null));

export function KeywordsPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view") ?? "all";
  const q = params.get("q") ?? "";
  const page = Number(params.get("page") ?? 1);
  const qc = useQueryClient();
  const { can } = useAuth();
  const { toast, confirm } = useToast();
  const onErr = useErrorToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [editing, setEditing] = useState<KeywordRow | null>(null);
  const { data, isLoading, error } = useQuery({ queryKey: ["keywords", view, q, page], queryFn: () => api.page<KeywordRow[]>(`/admin/keywords${qs({ view, q, page, pageSize: 50 })}`) });
  const { data: report } = useQuery({ queryKey: ["keywords-report"], queryFn: () => api.get<{ competing: KeywordRow[][]; missingPrimary: { type: string; id: string; label: string }[] }>("/admin/keywords/report/conflicts") });
  const counts = (data?.meta?.viewCounts ?? {}) as Record<string, number>;
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["keywords"] }); void qc.invalidateQueries({ queryKey: ["keywords-report"] }); };

  async function onImport(file: File) {
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api.upload<{ createdCount: number; updatedCount: number; skippedCount: number }>("/admin/keywords/import", fd);
      toast(`Imported: ${r.createdCount} new, ${r.updatedCount} updated, ${r.skippedCount} skipped (duplicates/notes)`);
      refresh();
    } catch (e) {
      onErr(e);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Keywords"
        description="Your SEO keyword plan. Each keyword targets at most one page, and each page has one primary keyword — this prevents pages competing with each other."
        actions={can("keywords:write") && (
          <>
            <Button variant="secondary" loading={importing} onClick={() => fileRef.current?.click()}><Upload className="size-4" /> Import CSV / XLSX</Button>
            <input ref={fileRef} type="file" accept=".csv,.xlsx" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void onImport(f); }} />
          </>
        )}
      />
      {report && (report.competing.length > 0 || report.missingPrimary.length > 0) ? (
        <Card className="mb-4" title="Keyword health">
          {report.competing.map((g, i) => (
            <p key={i} className="mb-1 flex items-start gap-2 text-sm text-amber-800"><AlertTriangle className="mt-0.5 size-4 shrink-0" /> Competing primaries: {g.map((k) => `“${k.keyword}” → ${targetLabel(k)}`).join(" vs ")}</p>
          ))}
          {report.missingPrimary.map((m) => (
            <p key={m.id} className="mb-1 flex items-start gap-2 text-sm text-slate-700"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" /> Published {m.type} “{m.label}” has no primary keyword.</p>
          ))}
        </Card>
      ) : report ? (
        <p className="mb-4 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="size-4" /> No keyword cannibalization detected, and every published page has a primary keyword.</p>
      ) : null}
      <Tabs value={view} onChange={(v) => setParams({ view: v })} tabs={VIEWS.map(([v, l]) => ({ value: v, label: `${l}${counts[v] !== undefined ? ` (${counts[v]})` : ""}` }))} />
      <input className="input mb-4 max-w-sm" placeholder="Search keywords" defaultValue={q} onKeyDown={(e) => e.key === "Enter" && setParams({ view, q: (e.target as HTMLInputElement).value })} aria-label="Search keywords" />
      <ErrorBox error={error} />
      {isLoading ? <Spinner /> : !data?.data.length ? <div className="rounded-xl bg-white ring-1 ring-slate-200"><Empty title="No keywords in this view">Import your keyword sheet to get started.</Empty></div> : (
        <>
          <Table head={["Keyword", "Volume", "KD", "CPC", "Intent / category", "Priority", "Target page", "Role", ""]}>
            {data.data.map((k) => (
              <tr key={k.id} className="hover:bg-slate-50">
                <Td className="font-medium text-slate-900">{k.keyword}{k.notes && <span className="block text-xs font-normal text-slate-400">{k.notes}</span>}</Td>
                <Td className="tabular-nums">{k.monthlyVolume?.toLocaleString() ?? "—"}</Td>
                <Td className="tabular-nums">{k.difficulty ?? "—"}</Td>
                <Td className="tabular-nums">{k.cpc != null ? `$${k.cpc.toFixed(2)}` : "—"}</Td>
                <Td className="text-xs text-slate-500">{k.intent?.toLowerCase() ?? "—"}<span className="block">{k.category}</span></Td>
                <Td><Badge>{k.priority}</Badge></Td>
                <Td className="text-sm">{targetLabel(k) ?? <span className="text-xs text-slate-400">{k.targetHint ? `hint: ${k.targetHint}` : "—"}</span>}</Td>
                <Td>{k.role ? <Badge>{k.role}</Badge> : <Badge>{k.status}</Badge>}</Td>
                <Td className="whitespace-nowrap text-right">
                  {can("keywords:write") && <>
                    <Button size="sm" variant="secondary" onClick={() => setEditing(k)}>Assign</Button>
                    <Button size="sm" variant="ghost" aria-label="Delete keyword" onClick={async () => { if (await confirm(`Delete keyword “${k.keyword}”?`, { danger: true, confirmLabel: "Delete" })) { await api.del(`/admin/keywords/${k.id}`).catch(onErr); refresh(); } }}><Trash2 className="size-4 text-red-600" /></Button>
                  </>}
                </Td>
              </tr>
            ))}
          </Table>
          <Pager page={data.meta!.page!} totalPages={data.meta!.totalPages!} total={data.meta!.total} onPage={(p) => setParams({ view, q, page: String(p) })} />
        </>
      )}
      {editing && <AssignModal k={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); toast("Keyword updated"); }} />}
    </div>
  );
}

function AssignModal({ k, onClose, onSaved }: { k: KeywordRow; onClose: () => void; onSaved: () => void }) {
  const { data: targets } = useQuery({ queryKey: ["link-targets"], queryFn: () => api.get<Record<string, Target[]>>("/admin/keywords/targets") });
  const current = k.isHome ? "home:home" : k.service ? `service:${k.service.id}` : k.serviceArea ? `serviceArea:${k.serviceArea.id}` : k.post ? `post:${k.post.id}` : k.page ? `page:${k.page.id}` : "";
  const [target, setTarget] = useState(current);
  const [role, setRole] = useState(k.role ?? "SECONDARY");
  const [status, setStatus] = useState(k.status);
  const [priority, setPriority] = useState(k.priority);
  const [notes, setNotes] = useState(k.notes ?? "");
  const [conflict, setConflict] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const onErr = useErrorToast();
  const groups: [string, string][] = [["home", "Homepage"], ["service", "Services"], ["serviceArea", "Service areas"], ["post", "Blog posts"], ["page", "Pages"]];

  async function save(force = false) {
    setSaving(true);
    try {
      const [type, id] = target.split(":");
      await api.patch(`/admin/keywords/${k.id}`, {
        target: target ? { type, id } : null,
        role: target ? role : null,
        ...(target ? {} : { status: status === "ASSIGNED" ? "UNASSIGNED" : status }),
        priority,
        notes: notes || null,
        force,
      });
      onSaved();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) setConflict(e.message);
      else onErr(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Assign “${k.keyword}”`} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button>{conflict ? <Button variant="danger" loading={saving} onClick={() => void save(true)}>Save anyway</Button> : <Button loading={saving} onClick={() => void save()}>Save</Button>}</>}>
      <div className="space-y-4">
        {k.targetHint && <p className="rounded-lg bg-slate-50 p-2 text-xs text-slate-600">Sheet suggests: <strong>{k.targetHint}</strong></p>}
        {conflict && <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200"><AlertTriangle className="size-4 shrink-0" /> {conflict}</p>}
        <Field label="Target page">
          <select className="input" value={target} onChange={(e) => { setTarget(e.target.value); setConflict(null); }}>
            <option value="">— Not assigned —</option>
            {groups.map(([g, label]) => (
              <optgroup key={g} label={label}>
                {targets?.[g]?.map((t) => <option key={t.id} value={`${g}:${t.id}`}>{t.label} ({t.path})</option>)}
              </optgroup>
            ))}
          </select>
        </Field>
        {target ? (
          <Field label="Role" hint="One primary keyword per page; the rest are secondary.">
            <select className="input" value={role} onChange={(e) => { setRole(e.target.value); setConflict(null); }}>
              <option value="PRIMARY">Primary</option>
              <option value="SECONDARY">Secondary</option>
            </select>
          </Field>
        ) : (
          <Field label="Status">
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="UNASSIGNED">Unassigned (backlog)</option>
              <option value="IGNORED">Ignored (not targeting)</option>
            </select>
          </Field>
        )}
        <Field label="Priority">
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </Field>
        <Field label="Notes"><textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

// ───────────── SEO overview ─────────────

interface SeoRow { type: string; id: string; label: string; path: string; status: string; issues: string[]; seo: { metaTitle: string | null; metaDescription: string | null; robots: string } }
const EDIT_PATH: Record<string, string> = { service: "/services/", serviceArea: "/service-areas/", post: "/posts/", page: "/pages/" };

export function SeoOverview() {
  const [onlyIssues, setOnlyIssues] = useState(true);
  const { data, isLoading, error } = useQuery({ queryKey: ["seo-overview"], queryFn: () => api.get<SeoRow[]>("/admin/seo/overview") });
  const rows = (data ?? []).filter((r) => !onlyIssues || r.issues.length);
  return (
    <div>
      <PageHeader title="SEO Overview" description="Titles, descriptions and indexing for every page. Sitemap and robots.txt are generated automatically from published content." actions={<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} /> Only show issues</label>} />
      <ErrorBox error={error} />
      {isLoading ? <Spinner /> : !rows.length ? <Card><p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="size-4" /> No SEO issues found.</p></Card> : (
        <Table head={["Page", "Type", "SEO title", "Issues", ""]}>
          {rows.map((r) => (
            <tr key={`${r.type}-${r.id}`} className="hover:bg-slate-50">
              <Td><span className="font-medium text-slate-900">{r.label}</span><span className="block text-xs text-slate-400">{r.path}</span></Td>
              <Td className="text-xs">{r.type} · <Badge>{r.status}</Badge></Td>
              <Td className="max-w-xs truncate text-sm text-slate-600">{r.seo.metaTitle ?? "—"}</Td>
              <Td>{r.issues.length ? <ul className="text-xs text-amber-800">{r.issues.map((i) => <li key={i}>• {i}</li>)}</ul> : <span className="text-xs text-emerald-700">OK</span>}</Td>
              <Td><Link to={`${EDIT_PATH[r.type]}${r.id}`} className="text-sm font-medium text-brand-700 hover:underline">Edit</Link></Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

// ───────────── Media library ─────────────

export function MediaLibrary() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const { can } = useAuth();
  const { toast, confirm } = useToast();
  const onErr = useErrorToast();
  const { upload, uploading } = useUpload();
  const ref = useRef<HTMLInputElement>(null);
  const [sel, setSel] = useState<MediaItem | null>(null);
  const [alt, setAlt] = useState("");
  const { data, isLoading, error } = useQuery({ queryKey: ["media", q, page], queryFn: () => api.page<MediaItem[]>(`/admin/media${qs({ q, page, pageSize: 48 })}`) });
  return (
    <div>
      <PageHeader
        title="Media"
        description="JPEG, PNG, WebP or AVIF. Images are checked, stripped of location metadata and resized into fast WebP versions automatically."
        actions={can("media:write") && <><Button loading={uploading} onClick={() => ref.current?.click()}><Upload className="size-4" /> Upload images</Button><input ref={ref} type="file" multiple accept={ACCEPT} hidden onChange={async (e) => { const files = [...(e.target.files ?? [])]; e.target.value = ""; for (const f of files) await upload(f); if (files.length) toast(`${files.length} uploaded — add alt text to each`); }} /></>}
      />
      <input className="input mb-4 max-w-sm" placeholder="Search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search media" />
      <ErrorBox error={error} />
      {isLoading ? <Spinner /> : !data?.data.length ? <div className="rounded-xl bg-white ring-1 ring-slate-200"><Empty title="No images yet" /></div> : (
        <>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {data.data.map((m) => (
              <li key={m.id}>
                <button onClick={() => { setSel(m); setAlt(m.alt); }} className="block w-full overflow-hidden rounded-xl bg-white text-left ring-1 ring-slate-200 hover:ring-2 hover:ring-brand-500">
                  <img src={m.variants[0]?.url ?? m.url} alt={m.alt} loading="lazy" className="aspect-video w-full bg-slate-100 object-cover" />
                  <span className="block truncate px-2.5 py-1.5 text-xs">{m.alt || <span className="text-amber-600">Missing alt text</span>}</span>
                </button>
              </li>
            ))}
          </ul>
          <Pager page={data.meta!.page!} totalPages={data.meta!.totalPages!} total={data.meta!.total} onPage={setPage} />
        </>
      )}
      <Modal open={Boolean(sel)} onClose={() => setSel(null)} title="Image details" wide footer={sel && can("media:write") && <>
        <Button variant="danger" onClick={async () => { if (await confirm("Delete this image? Pages using it will show no image.", { danger: true, confirmLabel: "Delete" })) { await api.del(`/admin/media/${sel.id}`).catch(onErr); setSel(null); void qc.invalidateQueries({ queryKey: ["media"] }); } }}>Delete</Button>
        <Button onClick={async () => { try { await api.patch(`/admin/media/${sel.id}`, { alt }); toast("Saved"); void qc.invalidateQueries({ queryKey: ["media"] }); setSel(null); } catch (e) { onErr(e); } }}>Save</Button>
      </>}>
        {sel && (
          <div className="grid gap-5 md:grid-cols-2">
            <img src={sel.url} alt={sel.alt} className="w-full rounded-lg ring-1 ring-slate-200" />
            <div className="space-y-3 text-sm">
              <Field label="Alt text" hint="Describe what's in the image for screen readers and search engines."><textarea className="input" rows={3} value={alt} onChange={(e) => setAlt(e.target.value)} /></Field>
              <p><span className="text-slate-500">File:</span> {sel.originalName}</p>
              <p><span className="text-slate-500">Size:</span> {sel.width}×{sel.height} · {(sel.sizeBytes / 1024).toFixed(0)} KB</p>
              <p><span className="text-slate-500">Uploaded:</span> {fmtDate(sel.createdAt)}</p>
              <p className="flex items-center gap-2"><span className="text-slate-500">URL:</span> <code className="truncate text-xs">{sel.url}</code> <button onClick={() => void navigator.clipboard.writeText(sel.url)} aria-label="Copy URL"><Copy className="size-4" /></button></p>
              <p className="text-xs text-slate-500">Responsive versions: {sel.variants.map((v) => `${v.width}px`).join(", ") || "original only"}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
