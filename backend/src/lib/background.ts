import { waitUntil } from "@vercel/functions";

/**
 * Runs work after the response is sent (emails, cache purges, cleanup).
 * On Vercel, serverless functions freeze once the response is sent, so the promise is
 * registered with waitUntil(). On a normal Node server it simply keeps running.
 */
export function background(task: Promise<unknown>) {
  const safe = task.catch(() => undefined);
  try {
    waitUntil(safe);
  } catch {
    /* not on Vercel */
  }
}
