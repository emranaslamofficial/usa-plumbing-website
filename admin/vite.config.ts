import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The admin is served by the API at /admin in production (same origin → secure cookies, no CORS).
// In development the Vite server proxies API and media requests to the backend.
export default defineConfig({
  base: "/admin/",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4000",
      "/media": "http://localhost:4000",
    },
  },
  build: { outDir: "dist", sourcemap: false },
});
