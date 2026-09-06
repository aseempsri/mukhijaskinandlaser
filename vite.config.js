import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const routeNames = [
  "treatments",
  "privacy-policy",
  "terms",
  "medical-disclaimer",
  "about-clinic",
  "dr-r-d-mukhija",
  "dr-gaurav-mukhija-2",
  "acne-scar-treatment-gorakhpur",
  "open-pores-treatment-gorakhpur",
  "mole-removal-gorakhpur",
  "vitiligo-treatment-gorakhpur",
  "before-after",
  "contact-us",
  "book-appointment",
  "doctor-dashboard",
  "404",
];
const legacyRoutes = routeNames.flatMap((route) => [`${route}.html`, `${route}/index.html`]);

function emitRouteFallbacks() {
  return {
    name: "emit-route-fallbacks",
    closeBundle() {
      const indexHtml = resolve("dist/index.html");
      for (const route of legacyRoutes) {
        const destination = resolve("dist", route);
        mkdirSync(dirname(destination), { recursive: true });
        copyFileSync(indexHtml, destination);
      }
      // GitHub Pages serves 404.html for unknown deep links — keep the SPA shell there.
      copyFileSync(indexHtml, resolve("dist/404.html"));
    },
  };
}

export default defineConfig(({ command }) => ({
  // Project Pages URL: https://aseempsri.github.io/mukhijaskinandlaser/
  base: command === "build" ? "/mukhijaskinandlaser/" : "/",
  plugins: [react(), emitRouteFallbacks()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://127.0.0.1:4000",
        changeOrigin: true,
      },
    },
  },
}));
