/** Thin fetch wrapper for the admin API. Session = httpOnly cookie; CSRF = double-submit header. */

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string> & Record<string, unknown>,
  ) {
    super(message);
  }
}

export interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown> & { page?: number; pageSize?: number; total?: number; totalPages?: number };
  error?: { code: string; message: string; details?: Record<string, string> };
}

const BASE = "/api/v1";

function csrfToken() {
  return document.cookie.split("; ").find((c) => c.startsWith("plumb_csrf="))?.split("=")[1] ?? "";
}

let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => (onUnauthorized = fn);

export async function request<T>(method: string, path: string, body?: unknown, opts: { raw?: boolean } = {}): Promise<Envelope<T>> {
  const isForm = body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(method !== "GET" ? { "X-CSRF-Token": csrfToken() } : {}),
    },
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  if (opts.raw) return { success: res.ok, data: res as unknown as T };
  let json: Envelope<T>;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(res.status, "BAD_RESPONSE", `Unexpected response (${res.status})`);
  }
  if (!res.ok || !json.success) {
    if (res.status === 401 && !path.startsWith("/auth/login")) onUnauthorized?.();
    throw new ApiError(res.status, json.error?.code ?? "ERROR", json.error?.message ?? "Request failed", json.error?.details as never);
  }
  return json;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path).then((r) => r.data),
  page: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}).then((r) => r.data),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body).then((r) => r.data),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body).then((r) => r.data),
  del: <T>(path: string) => request<T>("DELETE", path).then((r) => r.data),
  upload: <T>(path: string, form: FormData) => request<T>("POST", path, form).then((r) => r.data),
};

export const qs = (params: Record<string, string | number | boolean | undefined | null>) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== null && v !== "" && sp.set(k, String(v)));
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export const fmtDate = (d?: string | null, withTime = false) =>
  d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}) }) : "—";
