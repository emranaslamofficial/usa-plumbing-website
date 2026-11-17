import { createContext, useCallback, useContext, useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, X, Loader2, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { ApiError } from "../lib/api";

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

// ── Buttons ──

type Variant = "primary" | "secondary" | "danger" | "ghost";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  secondary: "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-slate-600 hover:bg-slate-100",
};

export function Button({ variant = "primary", loading, className, children, size = "md", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; size?: "sm" | "md" }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm",
        VARIANTS[variant],
        className,
      )}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

// ── Form fields ──

export function Field({ label, error, hint, children, className, required, counter }: { label: string; error?: string; hint?: ReactNode; children: ReactNode; className?: string; required?: boolean; counter?: { value: number; max: number; ideal?: number } }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 flex items-center justify-between gap-2 text-sm font-medium text-slate-700">
        <span>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        {counter && (
          <span className={cn("text-xs tabular-nums", counter.value > counter.max ? "text-red-600" : counter.ideal && counter.value > counter.ideal ? "text-amber-600" : "text-slate-400")}>
            {counter.value}/{counter.ideal ?? counter.max}
          </span>
        )}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description && <span className="block text-xs text-slate-500">{description}</span>}
      </span>
    </label>
  );
}

// ── Layout bits ──

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const BADGE: Record<string, string> = {
  PUBLISHED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-200",
  SCHEDULED: "bg-violet-50 text-violet-700 ring-violet-200",
  ARCHIVED: "bg-slate-100 text-slate-500 ring-slate-200",
  NEW: "bg-blue-50 text-blue-700 ring-blue-200",
  CONTACTED: "bg-sky-50 text-sky-700 ring-sky-200",
  QUALIFIED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  BOOKED: "bg-violet-50 text-violet-700 ring-violet-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  INVALID: "bg-amber-50 text-amber-700 ring-amber-200",
  SPAM: "bg-red-50 text-red-700 ring-red-200",
  CLOSED: "bg-slate-100 text-slate-600 ring-slate-200",
  ASSIGNED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  UNASSIGNED: "bg-amber-50 text-amber-700 ring-amber-200",
  IGNORED: "bg-slate-100 text-slate-500 ring-slate-200",
  PRIMARY: "bg-brand-50 text-brand-700 ring-brand-100",
  SECONDARY: "bg-slate-100 text-slate-600 ring-slate-200",
  HIGH: "bg-red-50 text-red-700 ring-red-200",
  MEDIUM: "bg-amber-50 text-amber-700 ring-amber-200",
  LOW: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  const key = tone ?? String(children);
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", BADGE[key] ?? "bg-slate-100 text-slate-700 ring-slate-200")}>{children}</span>;
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500" role="status">
      <Loader2 className="size-5 animate-spin" aria-hidden /> {label}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <Inbox className="size-10 text-slate-300" aria-hidden />
      <p className="mt-3 font-medium text-slate-700">{title}</p>
      {children && <div className="mt-1 text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null;
  const msg = error instanceof Error ? error.message : "Something went wrong";
  return (
    <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200" role="alert">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {msg}
    </div>
  );
}

export const fieldError = (error: unknown, field: string) => (error instanceof ApiError ? error.details?.[field] : undefined);

// ── Table ──

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export const Td = ({ children, className }: { children?: ReactNode; className?: string }) => <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;

export function Pager({ page, totalPages, onPage, total }: { page: number; totalPages: number; onPage: (p: number) => void; total?: number }) {
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
      <span>{total !== undefined && `${total} total`}</span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Modal ──

export function Modal({ open, onClose, title, children, wide, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={cn("w-full rounded-xl bg-white shadow-xl", wide ? "max-w-4xl" : "max-w-lg")}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

// ── Toasts & confirm ──

type Toast = { id: number; kind: "success" | "error"; text: string };
const ToastCtx = createContext<{ toast: (text: string, kind?: Toast["kind"]) => void; confirm: (text: string, opts?: { danger?: boolean; confirmLabel?: string }) => Promise<boolean> }>(null as never);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<{ text: string; danger?: boolean; confirmLabel?: string; resolve: (v: boolean) => void } | null>(null);
  const toast = useCallback((text: string, kind: Toast["kind"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  const confirm = useCallback((text: string, opts: { danger?: boolean; confirmLabel?: string } = {}) => new Promise<boolean>((resolve) => setDialog({ text, ...opts, resolve })), []);
  const close = (v: boolean) => {
    dialog?.resolve(v);
    setDialog(null);
  };
  return (
    <ToastCtx.Provider value={{ toast, confirm }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={cn("pointer-events-auto flex max-w-sm items-start gap-2 rounded-lg px-4 py-3 text-sm shadow-lg ring-1", t.kind === "success" ? "bg-white text-slate-800 ring-slate-200" : "bg-red-50 text-red-800 ring-red-200")}>
            {t.kind === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />}
            {t.text}
          </div>
        ))}
      </div>
      <Modal
        open={Boolean(dialog)}
        onClose={() => close(false)}
        title="Please confirm"
        footer={
          <>
            <Button variant="secondary" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button variant={dialog?.danger ? "danger" : "primary"} onClick={() => close(true)}>
              {dialog?.confirmLabel ?? "Confirm"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">{dialog?.text}</p>
      </Modal>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

/** Shows API errors as toasts. */
export function useErrorToast() {
  const { toast } = useToast();
  return (e: unknown) => toast(e instanceof Error ? e.message : "Something went wrong", "error");
}

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: ReactNode }[] }) {
  return (
    <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn("-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors", value === t.value ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800")}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
