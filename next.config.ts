import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// The admin panel (built into public/admin) is a single-page app talking to /api/v1 on this same domain.
const adminHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; img-src 'self' data: blob: https://*.public.blob.vercel-storage.com; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Backend (backend/src) dependencies are loaded by Node at runtime instead of being bundled:
  // native modules (sharp, argon2, pg) and packages with dynamic requires (express, exceljs, pino…).
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "sharp",
    "@node-rs/argon2",
    "express",
    "helmet",
    "cors",
    "cookie-parser",
    "express-rate-limit",
    "multer",
    "pino",
    "pino-http",
    "exceljs",
    "csv-parse",
    "nodemailer",
    "otpauth",
    "@vercel/blob",
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    // Images uploaded in the admin are stored in Vercel Blob in production
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin", headers: [...adminHeaders, { key: "Cache-Control", value: "no-store" }] },
      { source: "/admin/:path*", headers: adminHeaders },
      { source: "/admin/assets/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
  async rewrites() {
    const backend = process.env.BACKEND_API_URL?.replace(/\/$/, "");
    return {
      // Checked after real files (public/admin/assets/…) but before page routes,
      // so every /admin/* URL loads the admin app instead of the website's /[slug] pages.
      afterFiles: [
        { source: "/admin", destination: "/admin/index.html" },
        { source: "/admin/:path((?!assets/).*)", destination: "/admin/index.html" },
        // Only when using a separately hosted backend: serve its uploaded images from this domain
        ...(backend ? [{ source: "/media/:path*", destination: `${backend}/media/:path*` }] : []),
      ],
      beforeFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      // Emergency plumbing has its own dedicated landing page — avoid two URLs for the same intent.
      { source: "/services/emergency-plumbing", destination: "/emergency-plumbing", permanent: true },
    ];
  },
};

export default nextConfig;
