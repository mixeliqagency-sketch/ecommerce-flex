// Web App Manifest dinamico — Next.js convencion, reemplaza public/manifest.json.
// Lee todos los valores de themeConfig.install.* para que el PWA se rebrandee
// solo al cambiar theme.config.ts. NO hardcodear nada aca.
//
// Resultado: /manifest.webmanifest (Next.js lo expone automaticamente).

import type { MetadataRoute } from "next";
import { themeConfig } from "@/theme.config";

export default function manifest(): MetadataRoute.Manifest {
  const { install, brand } = themeConfig;
  return {
    name: install.pwaName || brand.name,
    short_name: install.pwaShortName || brand.name,
    description: install.pwaDescription || brand.description,
    start_url: "/",
    display: install.pwaDisplay,
    orientation: install.pwaOrientation,
    background_color: install.pwaBackgroundColor,
    theme_color: install.pwaThemeColor,
    categories: [...install.pwaCategories],
    lang: "es-AR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    prefer_related_applications: false,
  };
}
