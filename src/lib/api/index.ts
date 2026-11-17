import "server-only";
import { cache } from "react";
import type { ContentApi } from "./types";
import { mockApi } from "./mock";
import { httpApi } from "./http";

/**
 * Single entry point for content. Pages import `api` from here and never know
 * whether data comes from the mock layer or the real backend.
 *
 *   BACKEND_API_URL unset  → mock data (src/lib/api/mock)
 *   BACKEND_API_URL set    → real backend (src/lib/api/http.ts)
 */
export const usingMockApi = !process.env.BACKEND_API_URL;

const provider: ContentApi = usingMockApi ? mockApi : httpApi;

// Wrap every method in React's per-request cache so layout + page + metadata
// share one call per request.
export const api = Object.fromEntries(
  Object.entries(provider).map(([k, fn]) => [k, cache(fn as (...a: unknown[]) => unknown)]),
) as unknown as ContentApi;

export type { ContentApi, PostQuery } from "./types";
