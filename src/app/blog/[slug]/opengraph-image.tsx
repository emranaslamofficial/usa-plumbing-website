import { ImageResponse } from "next/og";
import { api } from "@/lib/api";

export const alt = "Plumbing guide";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  return (await api.listAllPostSlugs()).map(({ slug }) => ({ slug }));
}

/** Per-article social image (used when the CMS provides no featured image). */
export default async function PostOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, s] = await Promise.all([api.getPost(slug), api.getSiteSettings()]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #08101f 0%, #1b3f88 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#ffc24d", letterSpacing: 2 }}>PLUMBING GUIDE</div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 800, lineHeight: 1.1, maxWidth: 1000 }}>{post?.title ?? "Plumbing tips"}</div>
        <div style={{ display: "flex", fontSize: 30, opacity: 0.85 }}>{s.businessName}</div>
      </div>
    ),
    size,
  );
}
