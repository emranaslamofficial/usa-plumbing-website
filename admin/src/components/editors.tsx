import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button, Card, Field } from "./ui";
import { MediaField } from "./MediaPicker";

/** Editable SEO metadata panel used by services, areas, posts and pages. */
export interface Seo {
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  robots?: string;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageId?: string | null;
  schemaJson?: Record<string, unknown> | null;
  ogImage?: { url: string; alt: string } | null;
}

export function seoToBody(s: Seo) {
  const { ogImage: _o, ...rest } = s;
  return { ...rest, robots: s.robots ?? "index,follow" };
}

export function SeoPanel({ value, onChange, errors, keywords, fallbackTitle, path }: { value: Seo; onChange: (s: Seo) => void; errors?: Record<string, string>; keywords?: { keyword: string; role: string | null }[]; fallbackTitle?: string; path?: string }) {
  const set = (k: keyof Seo, v: unknown) => onChange({ ...value, [k]: v === "" ? null : v });
  const title = value.metaTitle || fallbackTitle || "";
  return (
    <Card title="SEO">
      {keywords && (
        <div className="mb-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <span className="font-semibold">Assigned keywords: </span>
          {keywords.length ? keywords.map((k) => `${k.keyword}${k.role === "PRIMARY" ? " (primary)" : ""}`).join(", ") : "none — assign them in SEO → Keywords"}
        </div>
      )}
      {/* Google-style preview */}
      <div className="mb-5 rounded-lg ring-1 ring-slate-200 p-3">
        <p className="truncate text-xs text-emerald-700">{path ?? "/"}</p>
        <p className="truncate text-base text-[#1a0dab]">{title || "Page title"}</p>
        <p className="line-clamp-2 text-xs text-slate-600">{value.metaDescription || "Meta description shown in search results."}</p>
      </div>
      <div className="grid gap-4">
        <Field label="SEO title" error={errors?.["seo.metaTitle"]} counter={{ value: (value.metaTitle ?? "").length, max: 70, ideal: 60 }}>
          <input className="input" value={value.metaTitle ?? ""} onChange={(e) => set("metaTitle", e.target.value)} placeholder={fallbackTitle} />
        </Field>
        <Field label="Meta description" error={errors?.["seo.metaDescription"]} counter={{ value: (value.metaDescription ?? "").length, max: 170, ideal: 155 }}>
          <textarea className="input" rows={3} value={value.metaDescription ?? ""} onChange={(e) => set("metaDescription", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Canonical URL" hint="Leave empty to use this page's own URL." error={errors?.["seo.canonicalUrl"]}>
            <input className="input" type="url" placeholder="https://" value={value.canonicalUrl ?? ""} onChange={(e) => set("canonicalUrl", e.target.value)} />
          </Field>
          <Field label="Robots">
            <select className="input" value={value.robots ?? "index,follow"} onChange={(e) => set("robots", e.target.value)}>
              <option value="index,follow">index, follow (default)</option>
              <option value="noindex,follow">noindex, follow</option>
              <option value="index,nofollow">index, nofollow</option>
              <option value="noindex,nofollow">noindex, nofollow</option>
            </select>
          </Field>
        </div>
        <details className="rounded-lg ring-1 ring-slate-200 p-3">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">Social sharing (Open Graph) & schema</summary>
          <div className="mt-4 grid gap-4">
            <Field label="Open Graph title" counter={{ value: (value.ogTitle ?? "").length, max: 95 }}>
              <input className="input" value={value.ogTitle ?? ""} onChange={(e) => set("ogTitle", e.target.value)} placeholder="Defaults to the SEO title" />
            </Field>
            <Field label="Open Graph description" counter={{ value: (value.ogDescription ?? "").length, max: 200 }}>
              <textarea className="input" rows={2} value={value.ogDescription ?? ""} onChange={(e) => set("ogDescription", e.target.value)} />
            </Field>
            <MediaField label="Open Graph image (1200×630 recommended)" value={value.ogImageId ?? null} media={value.ogImage} onChange={(id) => set("ogImageId", id)} />
            <Field label="Extra schema (JSON-LD object)" hint="Advanced. Merged into this page's structured data." error={errors?.["seo.schemaJson"]}>
              <textarea
                key={value.schemaJson ? JSON.stringify(value.schemaJson) : "empty"}
                className="input font-mono text-xs"
                rows={4}
                defaultValue={value.schemaJson ? JSON.stringify(value.schemaJson, null, 2) : ""}
                onBlur={(e) => {
                  try {
                    set("schemaJson", e.target.value.trim() ? JSON.parse(e.target.value) : null);
                  } catch {
                    window.alert("Schema must be valid JSON");
                  }
                }}
              />
            </Field>
          </div>
        </details>
      </div>
    </Card>
  );
}

// ── Lists ──

function move<T>(arr: T[], i: number, d: number) {
  const next = [...arr];
  const j = i + d;
  if (j < 0 || j >= next.length) return next;
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function RowTools({ i, len, onMove, onRemove }: { i: number; len: number; onMove: (d: number) => void; onRemove: () => void }) {
  return (
    <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
      <Button type="button" variant="ghost" size="sm" onClick={() => onMove(-1)} disabled={i === 0} aria-label="Move up">
        <ArrowUp className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => onMove(1)} disabled={i === len - 1} aria-label="Move down">
        <ArrowDown className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onRemove} aria-label="Remove">
        <Trash2 className="size-4 text-red-600" />
      </Button>
    </div>
  );
}

export function StringListEditor({ label, value, onChange, multiline, placeholder, error }: { label: string; value: string[]; onChange: (v: string[]) => void; multiline?: boolean; placeholder?: string; error?: string }) {
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            {multiline ? (
              <textarea className="input" rows={3} value={item} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} />
            ) : (
              <input className="input" value={item} placeholder={placeholder} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} />
            )}
            <RowTools i={i} len={value.length} onMove={(d) => onChange(move(value, i, d))} onRemove={() => onChange(value.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
      <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => onChange([...value, ""])}>
        <Plus className="size-4" /> Add
      </Button>
    </div>
  );
}

export function PairListEditor({ label, value, onChange, keys, labels, error }: { label: string; value: Record<string, string>[]; onChange: (v: Record<string, string>[]) => void; keys: [string, string]; labels: [string, string]; error?: string }) {
  const [a, b] = keys;
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <div className="space-y-3">
        {value.map((item, i) => (
          <div key={i} className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
            <div className="grid flex-1 gap-2">
              <input className="input" placeholder={labels[0]} value={item[a] ?? ""} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, [a]: e.target.value } : x)))} />
              <textarea className="input" rows={2} placeholder={labels[1]} value={item[b] ?? ""} onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, [b]: e.target.value } : x)))} />
            </div>
            <RowTools i={i} len={value.length} onMove={(d) => onChange(move(value, i, d))} onRemove={() => onChange(value.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
      <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => onChange([...value, { [a]: "", [b]: "" }])}>
        <Plus className="size-4" /> Add
      </Button>
    </div>
  );
}

export const FaqEditor = ({ value, onChange }: { value: { question: string; answer: string }[]; onChange: (v: { question: string; answer: string }[]) => void }) => (
  <PairListEditor label="FAQs (also output as FAQPage schema)" value={value} onChange={onChange as never} keys={["question", "answer"]} labels={["Question", "Answer — supports [link text](/path)"]} />
);

/** Multi-select as a checkbox list. */
export function CheckList({ label, options, value, onChange, hint }: { label: string; options: { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; hint?: string }) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-slate-700">{label}</legend>
      {hint && <p className="mb-2 text-xs text-slate-500">{hint}</p>}
      <div className="grid max-h-56 gap-1 overflow-y-auto rounded-lg p-2 ring-1 ring-slate-200 sm:grid-cols-2">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
            <input type="checkbox" checked={value.includes(o.value)} onChange={(e) => onChange(e.target.checked ? [...value, o.value] : value.filter((v) => v !== o.value))} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];
