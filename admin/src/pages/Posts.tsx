import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RotateCcw, Trash2, CalendarClock, EyeOff, Send, ExternalLink } from "lucide-react";
import { api, fmtDate, qs, slugify } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Badge, Button, Card, Empty, ErrorBox, Field, Modal, PageHeader, Pager, Spinner, Table, Td, Tabs, Toggle, fieldError, useErrorToast, useToast } from "../components/ui";
import { CheckList, FaqEditor, SeoPanel, seoToBody, type Seo } from "../components/editors";
import { BlockEditor, type Block } from "../components/BlockEditor";
import { MediaField } from "../components/MediaPicker";

const SITE = import.meta.env.VITE_SITE_URL ?? "http://localhost:3000";

interface PostRow { id: string; slug: string; title: string; status: string; publishedAt: string | null; updatedAt: string; deletedAt: string | null; isFeatured: boolean; category: { name: string }; author: { name: string } }

export function PostsList() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("trash") === "1" ? "trash" : "active";
  const status = params.get("status") ?? "";
  const q = params.get("q") ?? "";
  const page = Number(params.get("page") ?? 1);
  const qc = useQueryClient();
  const { can } = useAuth();
  const { toast, confirm } = useToast();
  const onErr = useErrorToast();
  const key = ["/admin/posts", tab, status, q, page];
  const { data, isLoading, error } = useQuery({ queryKey: key, queryFn: () => api.page<PostRow[]>(`/admin/posts${qs({ deleted: tab === "trash" ? "true" : undefined, status, q, page, pageSize: 25 })}`) });
  const upd = (patch: Record<string, string>) => setParams({ ...Object.fromEntries(params), page: "1", ...patch });
  const refresh = () => qc.invalidateQueries({ queryKey: ["/admin/posts"] });

  return (
    <div>
      <PageHeader
        title="Blog"
        description="Articles that answer customers' questions and link to your service pages."
        actions={can("content:write") && <Link to="/posts/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"><Plus className="size-4" /> New article</Link>}
      />
      <Tabs value={tab} onChange={(t) => setParams(t === "trash" ? { trash: "1" } : {})} tabs={[{ value: "active", label: "Articles" }, { value: "trash", label: "Trash" }]} />
      {tab === "active" && (
        <div className="mb-4 flex flex-wrap gap-2">
          <input className="input max-w-xs" placeholder="Search title or slug" defaultValue={q} onKeyDown={(e) => e.key === "Enter" && upd({ q: (e.target as HTMLInputElement).value })} aria-label="Search posts" />
          <select className="input max-w-[12rem]" value={status} onChange={(e) => upd({ status: e.target.value })} aria-label="Status">
            <option value="">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      )}
      <ErrorBox error={error} />
      {isLoading ? <Spinner /> : !data?.data.length ? <div className="rounded-xl bg-white ring-1 ring-slate-200"><Empty title={tab === "trash" ? "Trash is empty" : "No articles found"} /></div> : (
        <>
          <Table head={["Title", "Category", "Author", "Status", "Published", ""]}>
            {data.data.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <Td>
                  {tab === "trash" ? <span className="font-medium">{p.title}</span> : <Link to={`/posts/${p.id}`} className="font-medium text-slate-900 hover:text-brand-700">{p.title}</Link>}
                  <span className="block text-xs text-slate-400">/blog/{p.slug}</span>
                </Td>
                <Td>{p.category.name}</Td>
                <Td>{p.author.name}</Td>
                <Td><Badge>{p.status}</Badge></Td>
                <Td className="whitespace-nowrap text-slate-500">{fmtDate(p.publishedAt, p.status === "SCHEDULED")}</Td>
                <Td className="whitespace-nowrap text-right">
                  {tab === "trash" && can("content:delete") ? (
                    <>
                      <Button size="sm" variant="secondary" onClick={async () => { try { await api.post(`/admin/posts/${p.id}/restore`); toast("Restored as draft"); void refresh(); } catch (e) { onErr(e); } }}><RotateCcw className="size-4" /> Restore</Button>{" "}
                      <Button size="sm" variant="danger" onClick={async () => { if (!(await confirm(`Permanently delete “${p.title}”? This cannot be undone.`, { danger: true, confirmLabel: "Delete forever" }))) return; try { await api.del(`/admin/posts/${p.id}/permanent`); toast("Deleted permanently"); void refresh(); } catch (e) { onErr(e); } }}>Delete forever</Button>
                    </>
                  ) : p.status === "PUBLISHED" ? (
                    <a href={`${SITE}/blog/${p.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-brand-700">View <ExternalLink className="size-3" /></a>
                  ) : null}
                </Td>
              </tr>
            ))}
          </Table>
          <Pager page={data.meta!.page!} totalPages={data.meta!.totalPages!} total={data.meta!.total} onPage={(p) => upd({ page: String(p) })} />
        </>
      )}
    </div>
  );
}

interface PostForm {
  title: string; slug: string; excerpt: string; intro: string; body: Block[]; categoryId: string; authorId: string; status: string; publishedAt: string | null; featuredImageId: string | null;
  isFeatured: boolean; isPopular: boolean; tags: string; relatedServiceIds: string[]; faqs: { question: string; answer: string }[]; seo: Seo;
}
const EMPTY: PostForm = { title: "", slug: "", excerpt: "", intro: "", body: [{ type: "h2", id: "", text: "" }, { type: "p", text: "" }], categoryId: "", authorId: "", status: "DRAFT", publishedAt: null, featuredImageId: null, isFeatured: false, isPopular: false, tags: "", relatedServiceIds: [], faqs: [], seo: { robots: "index,follow" } };

const toLocalInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export function PostEditor() {
  const { id } = useParams();
  const isNew = id === "new";
  const nav = useNavigate();
  const qc = useQueryClient();
  const { toast, confirm } = useToast();
  const onErr = useErrorToast();
  const { can } = useAuth();
  const [form, setForm] = useState<PostForm>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [slugState, setSlugState] = useState<{ available: boolean; suggestion: string } | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedAt, setSchedAt] = useState("");
  const [media, setMedia] = useState<{ url: string; alt: string } | null>(null);
  const [keywords, setKeywords] = useState<{ keyword: string; role: string | null }[]>([]);
  const { data: cats } = useQuery({ queryKey: ["/admin/blog-categories"], queryFn: () => api.get<{ id: string; name: string }[]>("/admin/blog-categories?pageSize=200") });
  const { data: authors } = useQuery({ queryKey: ["/admin/authors"], queryFn: () => api.get<{ id: string; name: string }[]>("/admin/authors?pageSize=200") });
  const { data: services } = useQuery({ queryKey: ["/admin/services", "active"], queryFn: () => api.get<{ id: string; name: string }[]>("/admin/services") });
  const loaded = useQuery({ queryKey: ["post", id], enabled: !isNew, queryFn: () => api.get<any>(`/admin/posts/${id}`) });

  useEffect(() => {
    const p = loaded.data;
    if (!p) return;
    setMedia(p.featuredImage ? { url: p.featuredImage.url, alt: p.featuredImage.alt } : null);
    setKeywords(p.keywords);
    setForm({
      title: p.title, slug: p.slug, excerpt: p.excerpt, intro: p.intro, body: p.body, categoryId: p.categoryId, authorId: p.authorId, status: p.status, publishedAt: p.publishedAt, featuredImageId: p.featuredImageId,
      isFeatured: p.isFeatured, isPopular: p.isPopular, tags: p.tags.map((t: any) => t.tag.name).join(", "), relatedServiceIds: p.services.map((s: any) => s.serviceId), faqs: p.faqs.map((f: any) => ({ question: f.question, answer: f.answer })), seo: { ...p.seo },
    });
  }, [loaded.data]);
  useEffect(() => {
    if (!isNew) return;
    setForm((f) => ({ ...f, categoryId: f.categoryId || cats?.[0]?.id || "", authorId: f.authorId || authors?.[0]?.id || "" }));
  }, [cats, authors, isNew]);

  // Live duplicate-slug check
  useEffect(() => {
    if (!form.slug) return setSlugState(null);
    const t = setTimeout(async () => {
      try {
        setSlugState(await api.get(`/admin/posts/slug-check${qs({ slug: form.slug, id: isNew ? undefined : id })}`));
      } catch {
        /* ignore */
      }
    }, 350);
    return () => clearTimeout(t);
  }, [form.slug, id, isNew]);

  const set = <K extends keyof PostForm>(k: K, v: PostForm[K]) => setForm((f) => ({ ...f, [k]: v }));
  const err = (k: string) => fieldError(error, k);

  const body = (over: Partial<PostForm> = {}) => {
    const f = { ...form, ...over };
    return { ...f, slug: f.slug || undefined, tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean), faqs: f.faqs.filter((x) => x.question.trim()), body: f.body.filter((b) => !("text" in b) || b.text.trim()), seo: seoToBody(f.seo) };
  };

  async function save(over: Partial<PostForm> = {}, msg = "Saved") {
    setSaving(true);
    setError(null);
    try {
      const saved = isNew ? await api.post<{ id: string; status: string; publishedAt: string | null }>("/admin/posts", body(over)) : await api.put<{ id: string; status: string; publishedAt: string | null }>(`/admin/posts/${id}`, body(over));
      setForm((f) => ({ ...f, status: saved.status, publishedAt: saved.publishedAt }));
      toast(msg);
      void qc.invalidateQueries({ queryKey: ["/admin/posts"] });
      if (isNew) nav(`/posts/${saved.id}`, { replace: true });
    } catch (e) {
      setError(e);
      onErr(e);
    } finally {
      setSaving(false);
    }
  }

  if (!isNew && loaded.isLoading) return <Spinner />;
  const live = form.status === "PUBLISHED" || (form.status === "SCHEDULED" && form.publishedAt && new Date(form.publishedAt) <= new Date());

  return (
    <div>
      <PageHeader
        title={isNew ? "New article" : form.title || "Untitled"}
        description={
          <span className="flex items-center gap-2">
            <Link to="/posts" className="hover:underline">← All articles</Link> <Badge>{form.status}</Badge>
            {form.status === "SCHEDULED" && form.publishedAt && <span className="text-xs">publishes {fmtDate(form.publishedAt, true)}</span>}
          </span>
        }
        actions={
          <>
            {!isNew && can("content:delete") && (
              <Button variant="ghost" onClick={async () => { if (await confirm("Move this article to trash? You can restore it later.", { danger: true, confirmLabel: "Move to trash" })) { try { await api.del(`/admin/posts/${id}`); void qc.invalidateQueries({ queryKey: ["/admin/posts"] }); nav("/posts"); } catch (e) { onErr(e); } } }}>
                <Trash2 className="size-4 text-red-600" /> Trash
              </Button>
            )}
            <Button variant="secondary" loading={saving} onClick={() => void save(form.status === "PUBLISHED" ? {} : { status: form.status === "SCHEDULED" ? "SCHEDULED" : "DRAFT" }, form.status === "PUBLISHED" ? "Saved — live changes published" : "Draft saved")}>
              {form.status === "PUBLISHED" ? "Update" : "Save draft"}
            </Button>
            {can("content:publish") && (
              <>
                {form.status !== "PUBLISHED" && <Button variant="secondary" onClick={() => { setSchedAt(toLocalInput(form.publishedAt) || toLocalInput(new Date(Date.now() + 86400000).toISOString())); setSchedOpen(true); }}><CalendarClock className="size-4" /> Schedule</Button>}
                {live ? (
                  <Button variant="secondary" loading={saving} onClick={() => void save({ status: "DRAFT" }, "Unpublished — removed from the website")}><EyeOff className="size-4" /> Unpublish</Button>
                ) : (
                  <Button loading={saving} onClick={() => void save({ status: "PUBLISHED", publishedAt: null }, "Published — live on the website")}><Send className="size-4" /> Publish</Button>
                )}
              </>
            )}
          </>
        }
      />
      <ErrorBox error={error} />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card>
            <div className="space-y-4">
              <Field label="Title (H1)" required error={err("title")}>
                <input className="input text-lg font-semibold" value={form.title} onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} />
              </Field>
              <Field
                label="URL slug"
                error={err("slug")}
                hint={slugState && !slugState.available ? <span className="text-amber-700">Already used by another article. Suggested: <button type="button" className="underline" onClick={() => set("slug", slugState.suggestion)}>{slugState.suggestion}</button></span> : `/blog/${form.slug || "…"}`}
              >
                <input className="input" value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
              </Field>
              <Field label="Excerpt (listing cards)" counter={{ value: form.excerpt.length, max: 400, ideal: 200 }}><textarea className="input" rows={2} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} /></Field>
              <Field label="Introduction"><textarea className="input" rows={3} value={form.intro} onChange={(e) => set("intro", e.target.value)} /></Field>
            </div>
          </Card>
          <Card title="Article body">
            <BlockEditor value={form.body} onChange={(v) => set("body", v)} />
          </Card>
          <Card title="FAQ section"><FaqEditor value={form.faqs} onChange={(v) => set("faqs", v)} /></Card>
          <SeoPanel value={form.seo} onChange={(v) => set("seo", v)} errors={(error as any)?.details} keywords={isNew ? undefined : keywords} fallbackTitle={form.title} path={`/blog/${form.slug}`} />
        </div>
        <div className="space-y-6">
          <Card title="Details">
            <div className="space-y-4">
              <Field label="Category" required error={err("categoryId")}>
                <select className="input" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>{cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </Field>
              <Field label="Author" required error={err("authorId")}>
                <select className="input" value={form.authorId} onChange={(e) => set("authorId", e.target.value)}>{authors?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              </Field>
              <Field label="Tags" hint="Comma separated. New tags are created automatically."><input className="input" value={form.tags} onChange={(e) => set("tags", e.target.value)} /></Field>
              <MediaField label="Featured image" value={form.featuredImageId} media={media} onChange={(v) => set("featuredImageId", v)} />
              <Toggle label="Featured article" description="Shown at the top of the blog" checked={form.isFeatured} onChange={(v) => set("isFeatured", v)} />
              <Toggle label="Popular" description="Listed in “Popular articles” (editorial choice)" checked={form.isPopular} onChange={(v) => set("isPopular", v)} />
            </div>
          </Card>
          <Card title="Related services">
            <CheckList label="Link this article to services" hint="Shown under the article and as “Helpful guides” on those service pages." options={(services ?? []).map((s) => ({ value: s.id, label: s.name }))} value={form.relatedServiceIds} onChange={(v) => set("relatedServiceIds", v)} />
          </Card>
        </div>
      </div>

      <Modal open={schedOpen} onClose={() => setSchedOpen(false)} title="Schedule publication" footer={<><Button variant="secondary" onClick={() => setSchedOpen(false)}>Cancel</Button><Button onClick={() => { setSchedOpen(false); void save({ status: "SCHEDULED", publishedAt: new Date(schedAt).toISOString() }, "Scheduled"); }}>Schedule</Button></>}>
        <Field label="Publish on" hint="The article goes live automatically at this time (your local time).">
          <input className="input" type="datetime-local" value={schedAt} min={toLocalInput(new Date().toISOString())} onChange={(e) => setSchedAt(e.target.value)} />
        </Field>
      </Modal>
    </div>
  );
}

// ───────────── Pages ─────────────

interface PageRow { id: string; slug: string; title: string; status: string; isSystem: boolean; updatedAt: string }

export function PagesList() {
  const { data, isLoading, error } = useQuery({ queryKey: ["/admin/pages"], queryFn: () => api.get<PageRow[]>("/admin/pages") });
  const { can } = useAuth();
  return (
    <div>
      <PageHeader title="Pages" description="Standalone pages such as legal pages. New pages are published at yoursite.com/slug." actions={can("content:write") && <Link to="/pages/new" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"><Plus className="size-4" /> New page</Link>} />
      <ErrorBox error={error} />
      {isLoading ? <Spinner /> : (
        <Table head={["Title", "URL", "Status", "Updated"]}>
          {data?.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <Td><Link to={`/pages/${p.id}`} className="font-medium text-slate-900 hover:text-brand-700">{p.title}</Link> {p.isSystem && <Badge tone="SECONDARY">system</Badge>}</Td>
              <Td className="text-xs text-slate-500">/{p.slug}</Td>
              <Td><Badge>{p.status}</Badge></Td>
              <Td className="text-slate-500">{fmtDate(p.updatedAt)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

export function PageEditor() {
  const { id } = useParams();
  const isNew = id === "new";
  const nav = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const onErr = useErrorToast();
  const { can } = useAuth();
  const [form, setForm] = useState({ title: "", slug: "", intro: "", body: [] as Block[], status: "DRAFT", faqs: [] as { question: string; answer: string }[], seo: { robots: "index,follow" } as Seo, isSystem: false });
  const [error, setError] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);
  const loaded = useQuery({ queryKey: ["page", id], enabled: !isNew, queryFn: () => api.get<any>(`/admin/pages/${id}`) });
  useEffect(() => {
    const p = loaded.data;
    if (p) setForm({ title: p.title, slug: p.slug, intro: p.intro, body: p.body, status: p.status, faqs: p.faqs.map((f: any) => ({ question: f.question, answer: f.answer })), seo: { ...p.seo }, isSystem: p.isSystem });
  }, [loaded.data]);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function save(status?: string) {
    setSaving(true);
    setError(null);
    try {
      const { isSystem: _s, ...rest } = form;
      const b = { ...rest, status: status ?? form.status, slug: form.slug || undefined, seo: seoToBody(form.seo) };
      const saved = isNew ? await api.post<{ id: string }>("/admin/pages", b) : await api.put<{ id: string }>(`/admin/pages/${id}`, b);
      toast("Saved");
      if (status) set("status", status);
      void qc.invalidateQueries({ queryKey: ["/admin/pages"] });
      if (isNew) nav(`/pages/${saved.id}`, { replace: true });
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
        title={isNew ? "New page" : form.title}
        description={<Link to="/pages" className="hover:underline">← All pages</Link>}
        actions={<>
          <Button variant="secondary" loading={saving} onClick={() => void save()}>Save</Button>
          {can("content:publish") && (form.status === "PUBLISHED" ? <Button variant="secondary" onClick={() => void save("DRAFT")}>Unpublish</Button> : <Button loading={saving} onClick={() => void save("PUBLISHED")}>Publish</Button>)}
        </>}
      />
      <ErrorBox error={error} />
      <div className="space-y-6">
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title (H1)" required error={fieldError(error, "title")}><input className="input" value={form.title} onChange={(e) => { set("title", e.target.value); if (isNew) set("slug", slugify(e.target.value)); }} /></Field>
            <Field label="URL slug" hint={form.isSystem ? "System page — the URL is fixed" : `/${form.slug}`} error={fieldError(error, "slug")}><input className="input" disabled={form.isSystem} value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} /></Field>
            <Field label="Introduction" className="sm:col-span-2" hint="Tokens: {{businessName}} {{legalName}} {{email}} {{phone}} {{address}} are filled from Business Info."><textarea className="input" rows={3} value={form.intro} onChange={(e) => set("intro", e.target.value)} /></Field>
          </div>
        </Card>
        <Card title="Content"><BlockEditor value={form.body} onChange={(v) => set("body", v)} /></Card>
        <Card title="FAQs"><FaqEditor value={form.faqs} onChange={(v) => set("faqs", v)} /></Card>
        <SeoPanel value={form.seo} onChange={(v) => set("seo", v)} fallbackTitle={form.title} path={`/${form.slug}`} />
      </div>
    </div>
  );
}
