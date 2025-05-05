import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectManifest: "auto",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "serviceWorker.js",
      injectManifest: {
        rollupFormat: "iife",
      },
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallback: "index.html",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        // sourcemap: true to show the original code in the service worker
      },
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "EduAR",
        short_name: "EduAR",
        description: "Educational AR",
        theme_color: "#ffffff",
        // icons: [
        //   {
        //     src: "pwa-192x192.png",
        //     sizes: "192x192",
        //     type: "image/png",
        //   },
        //   {
        //     src: "pwa-512x512.png",
        //     sizes: "512x512",
        //     type: "image/png",
        //   },
        // ],
      },
    }),
  ],
});
