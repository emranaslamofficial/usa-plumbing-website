import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ExternalLink, RotateCcw, Trash2 } from "lucide-react";
import { api, slugify } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Badge, Button, Card, Empty, ErrorBox, Field, PageHeader, Spinner, Table, Td, Tabs, Toggle, fieldError, useErrorToast, useToast } from "../components/ui";
import { CheckList, FaqEditor, PairListEditor, SeoPanel, StringListEditor, seoToBody, STATUS_OPTIONS, type Seo } from "../components/editors";
import { MediaField } from "../components/MediaPicker";

const SITE = import.meta.env.VITE_SITE_URL ?? "http://localhost:3000";

export const ICONS = ["siren", "drain", "sewer", "jet", "flame", "heater", "tankless", "search", "pipe", "slab", "toilet", "faucet", "disposal", "gas", "softener", "bath", "building", "home", "wrench"];

/** Shared list with Active/Trash tabs for services and service areas. */
function ContentList<T extends { id: string; status: string; deletedAt?: string | null }>({ endpoint, title, description, newPath, columns, viewPath }: { endpoint: string; title: string; description: string; newPath: string; columns: { label: string; render: (r: T) => React.ReactNode }[]; viewPath: (r: T) => string }) {
  const [tab, setTab] = useState<"active" | "trash">("active");
  const qc = useQueryClient();
  const { can } = useAuth();
  const { toast } = useToast();
  const onErr = useErrorToast();
  const { data, isLoading, error } = useQuery({ queryKey: [endpoint, tab], queryFn: () => api.get<T[]>(`${endpoint}${tab === "trash" ? "?deleted=true" : ""}`) });
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={can("content:write") && (
          <Link to={newPath} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">
            <Plus className="size-4" /> Add new
          </Link>
        )}
      />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "active", label: "Active" }, { value: "trash", label: "Trash" }]} />
      <ErrorBox error={error} />
      {isLoading ? <Spinner /> : !data?.length ? <div className="rounded-xl bg-white ring-1 ring-slate-200"><Empty title={tab === "trash" ? "Trash is empty" : "Nothing yet"} /></div> : (
        <Table head={[...columns.map((c) => c.label), "Status", ""]}>
          {data.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50">
              {columns.map((c) => <Td key={c.label}>{c.render(r)}</Td>)}
              <Td><Badge>{r.status}</Badge></Td>
              <Td className="whitespace-nowrap text-right">
                {tab === "trash" ? (
                  can("content:delete") && (
                    <Button size="sm" variant="secondary" onClick={async () => {
                      try { await api.post(`${endpoint}/${r.id}/restore`); toast("Restored as draft"); void qc.invalidateQueries({ queryKey: [endpoint] }); } catch (e) { onErr(e); }
                    }}><RotateCcw className="size-4" /> Restore</Button>
                  )
                ) : (
                  r.status === "PUBLISHED" && <a href={`${SITE}${viewPath(r)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-700">View <ExternalLink className="size-3" /></a>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

interface ServiceRow { id: string; name: string; slug: string; status: string; isFeatured: boolean; pathOverride: string | null; category: { name: string }; _count: { faqs: number; leads: number }; deletedAt: string | null }

export function ServicesList() {
  return (
    <ContentList<ServiceRow>
      endpoint="/admin/services"
      title="Services"
      description="Published services appear automatically in the website menu, service grids, footer, sitemap and request form."
      newPath="/services/new"
      viewPath={(r) => r.pathOverride ?? `/services/${r.slug}`}
      columns={[
        { label: "Service", render: (r) => <Link to={`/services/${r.id}`} className="font-medium text-slate-900 hover:text-brand-700">{r.name}</Link> },
        { label: "Category", render: (r) => r.category.name },
        { label: "Featured", render: (r) => (r.isFeatured ? "★" : "") },
        { label: "Leads", render: (r) => r._count.leads },
      ]}
    />
  );
}

type Feature = { title: string; description: string };
interface ServiceForm {
  name: string; slug: string; categoryId: string; icon: string; shortDescription: string; h1: string; intro: string[]; signsTitle: string; signs: string[]; featuresTitle: string; features: Feature[];
  ctaHeading: string | null; ctaText: string | null; pathOverride: string | null; featuredImageId: string | null; isFeatured: boolean; isEmergency: boolean; status: string; sortOrder: number;
  seo: Seo; faqs: { question: string; answer: string }[]; relatedServiceIds: string[]; serviceAreaIds: string[];
}

const EMPTY_SERVICE: ServiceForm = { name: "", slug: "", categoryId: "", icon: "wrench", shortDescription: "", h1: "", intro: [""], signsTitle: "", signs: [], featuresTitle: "", features: [], ctaHeading: null, ctaText: null, pathOverride: null, featuredImageId: null, isFeatured: false, isEmergency: false, status: "DRAFT", sortOrder: 0, seo: { robots: "index,follow" }, faqs: [], relatedServiceIds: [], serviceAreaIds: [] };

export function ServiceEditor() {
  const { id } = useParams();
  const isNew = id === "new";
  const nav = useNavigate();
  const qc = useQueryClient();
  const { toast, confirm } = useToast();
  const onErr = useErrorToast();
  const { can } = useAuth();
  const [form, setForm] = useState<ServiceForm>(EMPTY_SERVICE);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [media, setMedia] = useState<{ url: string; alt: string } | null>(null);
  const [keywords, setKeywords] = useState<{ keyword: string; role: string | null }[]>([]);
  const { data: cats } = useQuery({ queryKey: ["/admin/service-categories"], queryFn: () => api.get<{ id: string; name: string }[]>("/admin/service-categories?pageSize=200") });
  const { data: all } = useQuery({ queryKey: ["/admin/services", "active"], queryFn: () => api.get<{ id: string; name: string }[]>("/admin/services") });
  const { data: areas } = useQuery({ queryKey: ["/admin/service-areas", "active"], queryFn: () => api.get<{ id: string; slug: string; city: { name: string; state: { code: string } } }[]>("/admin/service-areas") });
  const loaded = useQuery({ queryKey: ["service", id], enabled: !isNew, queryFn: () => api.get<any>(`/admin/services/${id}`) });

  useEffect(() => {
    const s = loaded.data;
    if (!s) return;
    setSlugTouched(true);
    setMedia(s.featuredImage ? { url: s.featuredImage.url, alt: s.featuredImage.alt } : null);
    setKeywords(s.keywords);
    setForm({
      ...EMPTY_SERVICE, ...s,
      seo: { ...s.seo },
      faqs: s.faqs.map((f: any) => ({ question: f.question, answer: f.answer })),
      relatedServiceIds: s.relatedTo.map((r: any) => r.relatedServiceId),
      serviceAreaIds: s.areas.map((a: any) => a.serviceAreaId),
    });
  }, [loaded.data]);
  useEffect(() => {
    if (isNew && !form.categoryId && cats?.[0]) setForm((f) => ({ ...f, categoryId: cats[0].id }));
  }, [cats, isNew, form.categoryId]);

  const set = <K extends keyof ServiceForm>(k: K, v: ServiceForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const err = (k: string) => fieldError(error, k);

  async function save(status?: string) {
    setSaving(true);
    setError(null);
    const { seo, ...rest } = form;
    const body = { ...rest, status: status ?? form.status, slug: form.slug || undefined, intro: form.intro.filter((p) => p.trim()), signs: form.signs.filter((p) => p.trim()), features: form.features.filter((f) => f.title.trim()), faqs: form.faqs.filter((f) => f.question.trim()), seo: seoToBody(seo) };
    try {
      const saved = isNew ? await api.post<{ id: string }>("/admin/services", body) : await api.put<{ id: string }>(`/admin/services/${id}`, body);
      toast(status === "PUBLISHED" ? "Published — live on the website" : "Saved");
      void qc.invalidateQueries({ queryKey: ["/admin/services"] });
      void qc.invalidateQueries({ queryKey: ["service", saved.id] });
      if (isNew) nav(`/services/${saved.id}`, { replace: true });
    } catch (e) {
      setError(e);
      onErr(e);
    } finally {
      setSaving(false);
    }
  }

  if (!isNew && loaded.isLoading) return <Spinner />;
  return (
    <div>
      <PageHeader
        title={isNew ? "New service" : form.name}
        description={<Link to="/services" className="hover:underline">← All services</Link>}
        actions={
          <>
            {!isNew && can("content:delete") && (
              <Button variant="ghost" onClick={async () => { if (await confirm("Move this service to trash? It will disappear from the website.", { danger: true, confirmLabel: "Move to trash" })) { await api.del(`/admin/services/${id}`).catch(onErr); void qc.invalidateQueries({ queryKey: ["/admin/services"] }); nav("/services"); } }}>
                <Trash2 className="size-4 text-red-600" /> Trash
              </Button>
            )}
            <Button variant="secondary" loading={saving} onClick={() => void save()}>Save</Button>
            {can("content:publish") && form.status !== "PUBLISHED" && <Button loading={saving} onClick={() => void save("PUBLISHED")}>Publish</Button>}
          </>
        }
      />
      <ErrorBox error={error} />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Service name" required error={err("name")}>
                <input className="input" value={form.name} onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} />
              </Field>
              <Field label="URL slug" hint={`/services/${form.slug || "…"}`} error={err("slug")}>
                <input className="input" value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
              </Field>
              <Field label="Page heading (H1)" required error={err("h1")} className="sm:col-span-2">
                <input className="input" value={form.h1} onChange={(e) => set("h1", e.target.value)} />
              </Field>
              <Field label="Short description (cards)" required error={err("shortDescription")} className="sm:col-span-2" counter={{ value: form.shortDescription.length, max: 300, ideal: 160 }}>
                <textarea className="input" rows={2} value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
              </Field>
            </div>
          </Card>
          <Card title="Page content">
            <div className="space-y-5">
              <StringListEditor label="Description (paragraphs)" value={form.intro} onChange={(v) => set("intro", v)} multiline error={err("intro")} />
              <Field label="“Signs you need this” heading"><input className="input" value={form.signsTitle} onChange={(e) => set("signsTitle", e.target.value)} /></Field>
              <StringListEditor label="Signs / symptoms" value={form.signs} onChange={(v) => set("signs", v)} />
              <Field label="Features heading"><input className="input" value={form.featuresTitle} onChange={(e) => set("featuresTitle", e.target.value)} /></Field>
              <PairListEditor label="What's included" value={form.features as never} onChange={(v) => set("features", v as never)} keys={["title", "description"]} labels={["Title", "Description"]} />
            </div>
          </Card>
          <Card title="Call to action">
            <div className="grid gap-4">
              <Field label="CTA heading" hint="Defaults to “Schedule {service} today”."><input className="input" value={form.ctaHeading ?? ""} onChange={(e) => set("ctaHeading", e.target.value || null)} /></Field>
              <Field label="CTA text"><textarea className="input" rows={2} value={form.ctaText ?? ""} onChange={(e) => set("ctaText", e.target.value || null)} /></Field>
            </div>
          </Card>
          <Card title="FAQs"><FaqEditor value={form.faqs} onChange={(v) => set("faqs", v)} /></Card>
          <SeoPanel value={form.seo} onChange={(v) => set("seo", v)} errors={error instanceof Error ? (error as any).details : undefined} keywords={isNew ? undefined : keywords} fallbackTitle={form.name} path={form.pathOverride ?? `/services/${form.slug}`} />
        </div>
        <div className="space-y-6">
          <Card title="Publishing">
            <div className="space-y-4">
              <Field label="Status">
                <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)} disabled={!can("content:publish")}>
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Toggle label="Featured on homepage" checked={form.isFeatured} onChange={(v) => set("isFeatured", v)} />
              <Toggle label="Emergency service" description="Shown with emergency styling" checked={form.isEmergency} onChange={(v) => set("isEmergency", v)} />
              <Field label="Sort order"><input className="input" type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} /></Field>
            </div>
          </Card>
          <Card title="Organization">
            <div className="space-y-4">
              <Field label="Category" required error={err("categoryId")}>
                <select className="input" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                  {cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Icon">
                <select className="input" value={form.icon} onChange={(e) => set("icon", e.target.value)}>
                  {ICONS.map((i) => <option key={i}>{i}</option>)}
                </select>
              </Field>
              <MediaField label="Featured image" value={form.featuredImageId} media={media} onChange={(v) => set("featuredImageId", v)} />
              <Field label="Custom URL path (advanced)" hint="Only for dedicated landing pages, e.g. /emergency-plumbing">
                <input className="input" value={form.pathOverride ?? ""} onChange={(e) => set("pathOverride", e.target.value || null)} />
              </Field>
            </div>
          </Card>
          <Card title="Relationships">
            <div className="space-y-4">
              <CheckList label="Related services" options={(all ?? []).filter((s) => s.id !== id).map((s) => ({ value: s.id, label: s.name }))} value={form.relatedServiceIds} onChange={(v) => set("relatedServiceIds", v)} />
              <CheckList label="Offered in service areas" options={(areas ?? []).map((a) => ({ value: a.id, label: `${a.city.name}, ${a.city.state.code}` }))} value={form.serviceAreaIds} onChange={(v) => set("serviceAreaIds", v)} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ───────────── Service areas ─────────────

interface AreaRow { id: string; slug: string; status: string; city: { name: string; state: { code: string; name: string } }; _count: { services: number; faqs: number }; deletedAt: string | null }

export function AreasList() {
  return (
    <ContentList<AreaRow>
      endpoint="/admin/service-areas"
      title="Service Areas"
      description="Location landing pages. To prevent thin doorway pages, publishing requires at least two local intro paragraphs and two local plumbing considerations."
      newPath="/service-areas/new"
      viewPath={(r) => `/service-areas/${r.slug}`}
      columns={[
        { label: "City", render: (r) => <Link to={`/service-areas/${r.id}`} className="font-medium text-slate-900 hover:text-brand-700">{r.city.name}, {r.city.state.code}</Link> },
        { label: "URL", render: (r) => <span className="text-xs text-slate-500">/service-areas/{r.slug}</span> },
        { label: "Services", render: (r) => r._count.services },
      ]}
    />
  );
}

interface AreaForm {
  stateCode: string; stateName: string; cityName: string; lat: number | null; lng: number | null; slug: string; description: string; intro: string[]; localConsiderations: Feature[];
  nearbyAreas: string[]; zipCodes: string; status: string; sortOrder: number; seo: Seo; faqs: { question: string; answer: string }[]; services: { serviceId: string; isFeatured: boolean }[];
}
const EMPTY_AREA: AreaForm = { stateCode: "", stateName: "", cityName: "", lat: null, lng: null, slug: "", description: "", intro: ["", ""], localConsiderations: [{ title: "", description: "" }, { title: "", description: "" }], nearbyAreas: [], zipCodes: "", status: "DRAFT", sortOrder: 0, seo: { robots: "index,follow" }, faqs: [], services: [] };

export function AreaEditor() {
  const { id } = useParams();
  const isNew = id === "new";
  const nav = useNavigate();
  const qc = useQueryClient();
  const { toast, confirm } = useToast();
  const onErr = useErrorToast();
  const { can } = useAuth();
  const [form, setForm] = useState<AreaForm>(EMPTY_AREA);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [keywords, setKeywords] = useState<{ keyword: string; role: string | null }[]>([]);
  const { data: services } = useQuery({ queryKey: ["/admin/services", "active"], queryFn: () => api.get<{ id: string; name: string }[]>("/admin/services") });
  const loaded = useQuery({ queryKey: ["area", id], enabled: !isNew, queryFn: () => api.get<any>(`/admin/service-areas/${id}`) });
  useEffect(() => {
    const a = loaded.data;
    if (!a) return;
    setKeywords(a.keywords);
    setForm({
      stateCode: a.city.state.code, stateName: a.city.state.name, cityName: a.city.name, lat: a.city.lat, lng: a.city.lng, slug: a.slug, description: a.description, intro: a.intro, localConsiderations: a.localConsiderations,
      nearbyAreas: a.nearbyAreas, zipCodes: a.zipCodes.join(", "), status: a.status, sortOrder: a.sortOrder, seo: { ...a.seo }, faqs: a.faqs.map((f: any) => ({ question: f.question, answer: f.answer })), services: a.services,
    });
  }, [loaded.data]);
  const set = <K extends keyof AreaForm>(k: K, v: AreaForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const err = (k: string) => fieldError(error, k);
  const svcState = (sid: string) => form.services.find((s) => s.serviceId === sid);
  const toggleSvc = (sid: string, on: boolean) => set("services", on ? [...form.services, { serviceId: sid, isFeatured: false }] : form.services.filter((s) => s.serviceId !== sid));
  const toggleFeatured = (sid: string, on: boolean) => set("services", form.services.map((s) => (s.serviceId === sid ? { ...s, isFeatured: on } : s)));

  async function save(status?: string) {
    setSaving(true);
    setError(null);
    const body = {
      ...form, status: status ?? form.status, slug: form.slug || undefined, intro: form.intro.filter((p) => p.trim()), localConsiderations: form.localConsiderations.filter((c) => c.title.trim()),
      nearbyAreas: form.nearbyAreas.filter((a) => a.trim()), zipCodes: form.zipCodes.split(/[\s,]+/).filter(Boolean), faqs: form.faqs.filter((f) => f.question.trim()), seo: seoToBody(form.seo),
    };
    try {
      const saved = isNew ? await api.post<{ id: string }>("/admin/service-areas", body) : await api.put<{ id: string }>(`/admin/service-areas/${id}`, body);
      toast(status === "PUBLISHED" ? "Published — live on the website" : "Saved");
      void qc.invalidateQueries({ queryKey: ["/admin/service-areas"] });
      if (isNew) nav(`/service-areas/${saved.id}`, { replace: true });
    } catch (e) {
      setError(e);
      onErr(e);
    } finally {
      setSaving(false);
    }
  }

  if (!isNew && loaded.isLoading) return <Spinner />;
  return (
    <div>
      <PageHeader
        title={isNew ? "New service area" : `${form.cityName}, ${form.stateCode}`}
        description={<Link to="/service-areas" className="hover:underline">← All service areas</Link>}
        actions={
          <>
            {!isNew && can("content:delete") && (
              <Button variant="ghost" onClick={async () => { if (await confirm("Move this service area to trash?", { danger: true, confirmLabel: "Move to trash" })) { await api.del(`/admin/service-areas/${id}`).catch(onErr); void qc.invalidateQueries({ queryKey: ["/admin/service-areas"] }); nav("/service-areas"); } }}>
                <Trash2 className="size-4 text-red-600" /> Trash
              </Button>
            )}
            <Button variant="secondary" loading={saving} onClick={() => void save()}>Save</Button>
            {can("content:publish") && form.status !== "PUBLISHED" && <Button loading={saving} onClick={() => void save("PUBLISHED")}>Publish</Button>}
          </>
        }
      />
      <ErrorBox error={error} />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card title="Location">
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="City" required error={err("cityName")} className="sm:col-span-2"><input className="input" value={form.cityName} onChange={(e) => { set("cityName", e.target.value); if (isNew) set("slug", slugify(`${e.target.value}-${form.stateCode}`)); }} /></Field>
              <Field label="State code" required error={err("stateCode")}><input className="input uppercase" maxLength={2} value={form.stateCode} onChange={(e) => { set("stateCode", e.target.value.toUpperCase()); if (isNew) set("slug", slugify(`${form.cityName}-${e.target.value}`)); }} /></Field>
              <Field label="State name" required error={err("stateName")}><input className="input" value={form.stateName} onChange={(e) => set("stateName", e.target.value)} /></Field>
              <Field label="URL slug" hint={`/service-areas/${form.slug}`} className="sm:col-span-2" error={err("slug")}><input className="input" value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} /></Field>
              <Field label="Latitude"><input className="input" type="number" step="any" value={form.lat ?? ""} onChange={(e) => set("lat", e.target.value === "" ? null : Number(e.target.value))} /></Field>
              <Field label="Longitude"><input className="input" type="number" step="any" value={form.lng ?? ""} onChange={(e) => set("lng", e.target.value === "" ? null : Number(e.target.value))} /></Field>
              <Field label="ZIP codes served" hint="Comma or space separated" className="sm:col-span-4" error={err("zipCodes")}><input className="input" value={form.zipCodes} onChange={(e) => set("zipCodes", e.target.value)} /></Field>
            </div>
            <div className="mt-4"><StringListEditor label="Nearby communities also served" value={form.nearbyAreas} onChange={(v) => set("nearbyAreas", v)} /></div>
          </Card>
          <Card title="Local content (required to publish)">
            <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">Write content that is genuinely specific to this area — soil, water hardness, climate, housing age, local codes. Copy-pasted city pages are “doorway pages” and can hurt the whole site in Google.</p>
            <div className="space-y-5">
              <Field label="Short description (used in listings)"><textarea className="input" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
              <StringListEditor label="Intro paragraphs (min. 2)" value={form.intro} onChange={(v) => set("intro", v)} multiline error={err("intro")} />
              <PairListEditor label="Local plumbing considerations (min. 2)" value={form.localConsiderations as never} onChange={(v) => set("localConsiderations", v as never)} keys={["title", "description"]} labels={["Title", "Why it matters here"]} error={err("localConsiderations")} />
            </div>
          </Card>
          <Card title="FAQs"><FaqEditor value={form.faqs} onChange={(v) => set("faqs", v)} /></Card>
          <SeoPanel value={form.seo} onChange={(v) => set("seo", v)} errors={(error as any)?.details} keywords={isNew ? undefined : keywords} fallbackTitle={`Plumber in ${form.cityName}, ${form.stateCode}`} path={`/service-areas/${form.slug}`} />
        </div>
        <div className="space-y-6">
          <Card title="Publishing">
            <div className="space-y-4">
              <Field label="Status">
                <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)} disabled={!can("content:publish")}>
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Sort order"><input className="input" type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} /></Field>
            </div>
          </Card>
          <Card title="Services offered here">
            <p className="mb-2 text-xs text-slate-500">Tick services offered; star the ones to feature as “Popular in this area”.</p>
            <ul className="max-h-[28rem] space-y-1 overflow-y-auto">
              {services?.map((s) => {
                const st = svcState(s.id);
                return (
                  <li key={s.id} className="flex items-center justify-between gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(st)} onChange={(e) => toggleSvc(s.id, e.target.checked)} /> {s.name}</label>
                    {st && <button type="button" onClick={() => toggleFeatured(s.id, !st.isFeatured)} className={st.isFeatured ? "text-amber-500" : "text-slate-300 hover:text-amber-400"} aria-label="Toggle featured" aria-pressed={st.isFeatured}>★</button>}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
