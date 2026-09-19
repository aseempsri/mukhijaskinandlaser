import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
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
  const writeFallbacks = (outDir) => {
    const indexHtml = resolve(outDir, "index.html");
    if (!existsSync(indexHtml)) {
      console.warn(`[emit-route-fallbacks] ${indexHtml} missing — skipping route copies`);
      return;
    }
    for (const route of legacyRoutes) {
      const destination = resolve(outDir, route);
      mkdirSync(dirname(destination), { recursive: true });
      copyFileSync(indexHtml, destination);
    }
    copyFileSync(indexHtml, resolve(outDir, "404.html"));
  };

  return {
    name: "emit-route-fallbacks",
    apply: "build",
    enforce: "post",
    // writeBundle runs after assets/HTML are on disk (more reliable than closeBundle on Vite 8).
    writeBundle(options) {
      const outDir = options.dir ? resolve(options.dir) : resolve("dist");
      writeFallbacks(outDir);
    },
  };
}

export default defineConfig(({ command }) => ({
  // Hostinger/domain root. For GitHub Pages set VITE_BASE=/mukhijaskinandlaser/ when building.
  base: command === "build" ? process.env.VITE_BASE || "/" : "/",
  plugins: [react(), emitRouteFallbacks()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4000",
        changeOrigin: true,
      },
    },
  },
}));
