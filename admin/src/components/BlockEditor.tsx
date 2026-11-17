import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Heading2, Heading3, Image as ImageIcon, Link2, List, ListOrdered, Lightbulb, Pilcrow, Quote, Table2, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { Button, Modal, cn } from "./ui";
import { MediaPicker } from "./MediaPicker";

/** Mirrors the backend's ContentBlock schema (and the website's renderer). */
export type Block =
  | { type: "h2" | "h3"; id: string; text: string }
  | { type: "p"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "callout"; variant: "tip" | "warning" | "info"; title?: string; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "table"; caption?: string; headers: string[]; rows: string[][] }
  | { type: "image"; mediaId?: string; src: string; alt: string; width?: number; height?: number; caption?: string };

const ADDERS: { type: Block["type"]; label: string; icon: typeof Pilcrow; make: () => Block }[] = [
  { type: "h2", label: "Heading 2", icon: Heading2, make: () => ({ type: "h2", id: "", text: "" }) },
  { type: "h3", label: "Heading 3", icon: Heading3, make: () => ({ type: "h3", id: "", text: "" }) },
  { type: "p", label: "Paragraph", icon: Pilcrow, make: () => ({ type: "p", text: "" }) },
  { type: "ul", label: "Bullet list", icon: List, make: () => ({ type: "ul", items: [""] }) },
  { type: "ol", label: "Numbered list", icon: ListOrdered, make: () => ({ type: "ol", items: [""] }) },
  { type: "table", label: "Table", icon: Table2, make: () => ({ type: "table", headers: ["Column 1", "Column 2"], rows: [["", ""]] }) },
  { type: "image", label: "Image", icon: ImageIcon, make: () => ({ type: "image", src: "", alt: "" }) },
  { type: "quote", label: "Quote", icon: Quote, make: () => ({ type: "quote", text: "" }) },
  { type: "callout", label: "Callout", icon: Lightbulb, make: () => ({ type: "callout", variant: "tip", text: "" }) },
];

type Target = { id: string; label: string; path: string };

/** Picker that inserts a Markdown-style internal link: [text](/path) */
function LinkPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (path: string, label: string) => void }) {
  const { data } = useQuery({ queryKey: ["link-targets"], queryFn: () => api.get<Record<string, Target[]>>("/admin/keywords/targets"), enabled: open });
  const [q, setQ] = useState("");
  const groups: [string, string][] = [["service", "Services"], ["serviceArea", "Service areas"], ["post", "Blog posts"], ["page", "Pages"]];
  return (
    <Modal open={open} onClose={onClose} title="Insert internal link">
      <input className="input mb-3" placeholder="Search pages…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="space-y-3">
        {groups.map(([k, label]) => {
          const items = (data?.[k] ?? []).filter((t) => t.label.toLowerCase().includes(q.toLowerCase()));
          if (!items.length) return null;
          return (
            <div key={k}>
              <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
              <ul>
                {items.map((t) => (
                  <li key={t.id}>
                    <button type="button" className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-brand-50" onClick={() => onPick(t.path, t.label)}>
                      {t.label} <span className="text-xs text-slate-400">{t.path}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

/** Textarea with an "insert internal link" helper that wraps the selected text. */
function LinkableText({ value, onChange, rows = 3, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const insert = (path: string, label: string) => {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const text = value.slice(start, end) || label;
    onChange(`${value.slice(0, start)}[${text}](${path})${value.slice(end)}`);
    setOpen(false);
  };
  return (
    <div>
      <textarea ref={ref} className="input" rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <button type="button" onClick={() => setOpen(true)} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
        <Link2 className="size-3.5" /> Insert internal link (select text first)
      </button>
      <LinkPicker open={open} onClose={() => setOpen(false)} onPick={insert} />
    </div>
  );
}

function BlockBody({ b, set }: { b: Block; set: (b: Block) => void }) {
  const [pick, setPick] = useState(false);
  switch (b.type) {
    case "h2":
    case "h3":
      return (
        <div className="grid gap-2 sm:grid-cols-[1fr_12rem]">
          <input className={cn("input font-semibold", b.type === "h2" ? "text-lg" : "")} placeholder="Heading text" value={b.text} onChange={(e) => set({ ...b, text: e.target.value })} />
          <input className="input text-xs" placeholder="anchor-id (auto)" value={b.id} onChange={(e) => set({ ...b, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} title="Used by the table of contents" />
        </div>
      );
    case "p":
      return <LinkableText value={b.text} onChange={(text) => set({ ...b, text })} rows={4} placeholder="Paragraph text" />;
    case "ul":
    case "ol":
      return (
        <div>
          <textarea className="input" rows={Math.max(3, b.items.length + 1)} value={b.items.join("\n")} onChange={(e) => set({ ...b, items: e.target.value.split("\n") })} />
          <p className="mt-1 text-xs text-slate-500">One item per line. Links: [text](/path)</p>
        </div>
      );
    case "quote":
      return (
        <div className="grid gap-2">
          <textarea className="input italic" rows={3} placeholder="Quote" value={b.text} onChange={(e) => set({ ...b, text: e.target.value })} />
          <input className="input" placeholder="Source / attribution (optional)" value={b.cite ?? ""} onChange={(e) => set({ ...b, cite: e.target.value || undefined })} />
        </div>
      );
    case "callout":
      return (
        <div className="grid gap-2">
          <div className="grid gap-2 sm:grid-cols-[10rem_1fr]">
            <select className="input" value={b.variant} onChange={(e) => set({ ...b, variant: e.target.value as "tip" })}>
              <option value="tip">Tip</option>
              <option value="warning">Warning</option>
              <option value="info">Note</option>
            </select>
            <input className="input" placeholder="Title (optional)" value={b.title ?? ""} onChange={(e) => set({ ...b, title: e.target.value || undefined })} />
          </div>
          <LinkableText value={b.text} onChange={(text) => set({ ...b, text })} />
        </div>
      );
    case "table": {
      const cols = b.headers.length;
      return (
        <div className="space-y-2">
          <input className="input" placeholder="Caption (optional)" value={b.caption ?? ""} onChange={(e) => set({ ...b, caption: e.target.value || undefined })} />
          <div className="overflow-x-auto">
            <table className="text-sm">
              <thead>
                <tr>
                  {b.headers.map((h, i) => (
                    <th key={i} className="p-1">
                      <input className="input font-semibold" value={h} onChange={(e) => set({ ...b, headers: b.headers.map((x, j) => (j === i ? e.target.value : x)) })} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, ri) => (
                  <tr key={ri}>
                    {r.map((c, ci) => (
                      <td key={ci} className="p-1">
                        <input className="input" value={c} onChange={(e) => set({ ...b, rows: b.rows.map((row, j) => (j === ri ? row.map((x, k) => (k === ci ? e.target.value : x)) : row)) })} />
                      </td>
                    ))}
                    <td>
                      <Button type="button" variant="ghost" size="sm" onClick={() => set({ ...b, rows: b.rows.filter((_, j) => j !== ri) })} aria-label="Remove row">
                        <Trash2 className="size-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => set({ ...b, rows: [...b.rows, Array(cols).fill("")] })}>
              + Row
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={cols >= 10} onClick={() => set({ ...b, headers: [...b.headers, `Column ${cols + 1}`], rows: b.rows.map((r) => [...r, ""]) })}>
              + Column
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={cols <= 1} onClick={() => set({ ...b, headers: b.headers.slice(0, -1), rows: b.rows.map((r) => r.slice(0, -1)) })}>
              − Column
            </Button>
          </div>
        </div>
      );
    }
    case "image":
      return (
        <div className="grid gap-2">
          <div className="flex items-center gap-3">
            {b.src ? <img src={b.src} alt={b.alt} className="h-20 w-32 rounded object-cover ring-1 ring-slate-200" /> : <span className="grid h-20 w-32 place-items-center rounded bg-slate-50 text-xs text-slate-400">No image</span>}
            <Button type="button" variant="secondary" size="sm" onClick={() => setPick(true)}>
              {b.src ? "Change image" : "Choose image"}
            </Button>
          </div>
          <input className="input" placeholder="Alt text (required — describe the image)" value={b.alt} onChange={(e) => set({ ...b, alt: e.target.value })} />
          <input className="input" placeholder="Caption (optional)" value={b.caption ?? ""} onChange={(e) => set({ ...b, caption: e.target.value || undefined })} />
          <MediaPicker
            open={pick}
            onClose={() => setPick(false)}
            onPick={(m) => {
              const v = [...m.variants].sort((x, y) => y.width - x.width).find((x) => x.width <= 1600);
              set({ ...b, mediaId: m.id, src: v?.url ?? m.url, alt: b.alt || m.alt, width: m.width ?? undefined, height: m.height ?? undefined });
              setPick(false);
            }}
          />
        </div>
      );
  }
}

export function BlockEditor({ value, onChange }: { value: Block[]; onChange: (v: Block[]) => void }) {
  const update = (i: number, b: Block) => onChange(value.map((x, j) => (j === i ? b : x)));
  const moveBy = (i: number, d: number) => {
    const n = [...value];
    const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  const addAt = (i: number, b: Block) => onChange([...value.slice(0, i), b, ...value.slice(i)]);
  const label = (t: Block["type"]) => ADDERS.find((a) => a.type === t)?.label ?? t;

  const Adder = ({ at }: { at: number }) => (
    <div className="flex flex-wrap gap-1">
      {ADDERS.map((a) => (
        <button key={a.type} type="button" onClick={() => addAt(at, a.make())} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-brand-50 hover:text-brand-700" title={`Add ${a.label}`}>
          <a.icon className="size-3.5" /> {a.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">The article title is the page's H1. Use H2 for main sections and H3 for sub-sections — they build the table of contents automatically.</p>
      {value.map((b, i) => (
        <div key={i} className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label(b.type)}</span>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => moveBy(i, -1)} disabled={i === 0} aria-label="Move up">
                <ArrowUp className="size-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => moveBy(i, 1)} disabled={i === value.length - 1} aria-label="Move down">
                <ArrowDown className="size-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Delete block">
                <Trash2 className="size-4 text-red-600" />
              </Button>
            </div>
          </div>
          <BlockBody b={b} set={(nb) => update(i, nb)} />
        </div>
      ))}
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
        <p className="mb-2 text-xs font-medium text-slate-500">Add a block</p>
        <Adder at={value.length} />
      </div>
    </div>
  );
}
