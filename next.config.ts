import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Images uploaded in the admin are stored in Vercel Blob in production
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Uploaded images live on the backend; serve them from the site's own domain so
  // next/image can optimize them and no extra host/CORS setup is needed.
  async rewrites() {
    const backend = process.env.BACKEND_API_URL?.replace(/\/$/, "");
    return backend ? [{ source: "/media/:path*", destination: `${backend}/media/:path*` }] : [];
  },
  async redirects() {
    return [
      // Emergency plumbing has its own dedicated landing page — avoid two URLs for the same intent.
      { source: "/services/emergency-plumbing", destination: "/emergency-plumbing", permanent: true },
    ];
  },
};

export default nextConfig;
