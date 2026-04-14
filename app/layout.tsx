import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import ClientShell from "@/components/layout/ClientShell";
import JsonLd from "@/components/seo/JsonLd";
import AnalyticsScripts from "@/components/seo/AnalyticsScripts";
import { themeConfig } from "@/theme.config";
import { getThemeCSS } from "@/lib/theme-css";
import "./globals.css";

// Fuentes activas: Space Grotesk para titulos, Inter para cuerpo de texto
// Las variables CSS --font-heading y --font-body son referenciadas directamente en globals.css
const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600"],
});

const fontClasses = `${headingFont.variable} ${bodyFont.variable}`;

const { brand, seo } = themeConfig;

export const metadata: Metadata = {
  metadataBase: new URL(brand.url),
  title: {
    default: `${brand.name} — ${brand.tagline}`,
    template: `%s | ${brand.name}`,
  },
  description: brand.description,
  keywords: [...seo.keywords],
  // Manifest generado dinamicamente por app/manifest.ts (lee de themeConfig.install)
  manifest: "/manifest.webmanifest",
  themeColor: seo.themeColor,
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/icon-192.png", type: "image/png", sizes: "192x192" }],
  },
  authors: [{ name: brand.name }],
  creator: brand.creator,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: brand.name,
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
    images: [{ url: seo.ogImage, width: 1200, height: 630, alt: `${brand.name} — ${brand.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
    images: ["/twitter-image"],
  },
  robots: {
    index: true, follow: true,
    "max-snippet": -1,
    "max-image-preview": "large" as const,
    "max-video-preview": -1,
  },
};

// CSS estatico generado en build-time desde theme.config (no acepta input de usuario, seguro)
// Los fonts ya usan --font-heading y --font-body como variable names, no se necesita alias
const THEME_STYLE = getThemeCSS();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={fontClasses} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* THEME_STYLE es generado en build-time desde theme.config.ts (no hay
            user input — no hay riesgo XSS). Usamos inyeccion HTML directa porque
            el CSS contiene comillas dobles (ej [data-theme="light"]) que React
            escaparia como &quot; en SSR, rompiendo la hidratacion. */}
        <style dangerouslySetInnerHTML={{ __html: THEME_STYLE }} />
        {/* SW KILL SWITCH (2026-04-13): corre ANTES que cualquier otro JS.
            Detecta si hay un SW viejo controlando la pagina, lo desregistra,
            limpia todos los caches y hace un reload unico. Sin esto, el SW
            viejo sigue sirviendo HTML/JS stale con estado roto (ReviewCarousel
            stuck, ProductGrid stuck, Anda sin abrir). El flag en sessionStorage
            evita loop de reload. Se puede borrar este bloque en ~2 semanas
            cuando todos los browsers hayan migrado a la nueva version. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(sessionStorage.getItem('sw-killed-v3'))return;if(!('serviceWorker' in navigator))return;navigator.serviceWorker.getRegistrations().then(function(regs){if(regs.length===0){sessionStorage.setItem('sw-killed-v3','1');return;}Promise.all(regs.map(function(r){return r.unregister();})).then(function(){if('caches' in window){caches.keys().then(function(keys){return Promise.all(keys.map(function(k){return caches.delete(k);}));}).then(function(){sessionStorage.setItem('sw-killed-v3','1');location.reload();});}else{sessionStorage.setItem('sw-killed-v3','1');location.reload();}});});}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-bg-primary text-text-primary font-body" suppressHydrationWarning>
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": brand.name,
          "url": brand.url,
          "description": brand.description,
          "logo": { "@type": "ImageObject", "url": `${brand.url}/icon-512.png`, "width": 512, "height": 512 },
          "sameAs": Object.values(themeConfig.social).filter(Boolean),
          "contactPoint": { "@type": "ContactPoint", "contactType": "customer service", "availableLanguage": "Spanish" },
        }} />
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": brand.name,
          "url": brand.url,
          "potentialAction": {
            "@type": "SearchAction",
            "target": { "@type": "EntryPoint", "urlTemplate": `${brand.url}/productos?q={search_term_string}` },
            "query-input": "required name=search_term_string",
          },
        }} />
        <ClientShell>{children}</ClientShell>
        {/* Scripts de tracking opt-in — solo cargan si hay IDs en themeConfig.analytics */}
        <AnalyticsScripts />
      </body>
    </html>
  );
}
