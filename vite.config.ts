import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
// Backend the dev proxy forwards "/api" to. Override with DEV_API_PROXY_TARGET
// (e.g. http://localhost:3000) to point at a local backend.
const DEV_API_PROXY_TARGET =
  process.env.DEV_API_PROXY_TARGET || "https://ample-love-production.up.railway.app";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // Mirror the production Vercel rewrite (see vercel.json): route "/api"
    // through this dev origin so the httpOnly session cookie stays first-party
    // and survives Safari ITP locally too.
    proxy: {
      "/api": {
        target: DEV_API_PROXY_TARGET,
        changeOrigin: true,
        secure: true,
        // Strip the cookie's Domain attribute so it binds to localhost.
        cookieDomainRewrite: "",
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.ico", "logo.svg"],
      manifest: {
        name: "FC Career Hub",
        short_name: "CareerHub",
        description: "Gerencie sua carreira no futebol",
        theme_color: "#0a0a0a",
        background_color: "#0a0a0a",
        display: "standalone",
        start_url: "/",
        id: "/",
        icons: [
          {
            src: "/logo.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/logo.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
