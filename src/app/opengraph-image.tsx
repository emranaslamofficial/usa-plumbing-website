import { ImageResponse } from "next/og";
import { api } from "@/lib/api";

export const alt = "Plumbing services";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social share image, generated at build time from site settings. */
export default async function OgImage() {
  const s = await api.getSiteSettings();
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
          background: "linear-gradient(135deg, #0f2145 0%, #1a49ab 60%, #2f74ec 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, fontWeight: 700, opacity: 0.9 }}>{s.businessName}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 950 }}>Fast, Reliable Plumbing Services</div>
          <div style={{ fontSize: 34, marginTop: 24, opacity: 0.85 }}>{`Serving ${s.serviceAreaLabel}`}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", background: "#ffc24d", color: "#08101f", padding: "16px 32px", borderRadius: 18, fontSize: 36, fontWeight: 800 }}>
            {`Call ${s.phone.display}`}
          </div>
          {s.emergency.available && <div style={{ display: "flex", fontSize: 30, opacity: 0.85 }}>{s.emergency.label}</div>}
        </div>
      </div>
    ),
    size,
  );
}
