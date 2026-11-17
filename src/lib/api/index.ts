import "server-only";
import { cache } from "react";
import type { ContentApi } from "./types";
import { mockApi } from "./mock";
import { httpApi } from "./http";

/**
 * Single entry point for content. Pages import `api` from here and never know where data comes from.
 *
 *   DATABASE_URL set     → database, read in-process via the backend's public service (src/lib/api/direct.ts)
 *                          — the normal setup: website + admin + API in one server
 *   BACKEND_API_URL set  → a separately hosted backend over HTTP (src/lib/api/http.ts)
 *   neither              → built-in mock data (src/lib/api/mock) — handy for UI work without a database
 */
export const contentSource = process.env.DATABASE_URL ? "database" : process.env.BACKEND_API_URL ? "http" : "mock";
export const usingMockApi = contentSource === "mock";

// The database provider pulls in Prisma and the backend; load it only when it's actually used.
let directPromise: Promise<ContentApi> | null = null;
const loadDirect = () => (directPromise ??= import("./direct").then((m) => m.directApi));

const METHODS = Object.keys(mockApi) as (keyof ContentApi)[];

const provider: ContentApi =
  contentSource === "database"
    ? (Object.fromEntries(
        METHODS.map((k) => [k, async (...args: unknown[]) => ((await loadDirect())[k] as (...a: unknown[]) => unknown)(...args)]),
      ) as unknown as ContentApi)
    : contentSource === "http"
      ? httpApi
      : mockApi;

// Wrap every method in React's per-request cache so layout + page + metadata
// share one call per request.
export const api = Object.fromEntries(
  Object.entries(provider).map(([k, fn]) => [k, cache(fn as (...a: unknown[]) => unknown)]),
) as unknown as ContentApi;

export type { ContentApi, PostQuery } from "./types";
