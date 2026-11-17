import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Production: built into ../public/admin and served by the Next.js site at /admin (same origin → secure cookies, no CORS).
// Development (npm run dev here): Vite proxies API and media requests to the Next.js server on :3000.
export default defineConfig({
  base: "/admin/",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
      "/media": "http://localhost:3000",
    },
  },
  build: { outDir: "dist", sourcemap: false },
});
