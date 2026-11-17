/**
 * Visitor IP as seen by the Next.js server. Behind a proxy/CDN (Vercel, Cloudflare, nginx)
 * the first X-Forwarded-For entry is the client. Forwarded to the backend as X-Client-IP,
 * which the backend only trusts when the request carries the server API key.
 */
export function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (fwd || req.headers.get("x-real-ip") || "0.0.0.0").slice(0, 64);
}
