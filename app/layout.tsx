import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import ClientShell from "@/components/layout/ClientShell";
import JsonLd from "@/components/seo/JsonLd";
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
  manifest: "/manifest.json",
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
        {/* Variables CSS generadas desde theme.config.ts en build-time (contenido estatico, no user input) */}
        <style>{THEME_STYLE}</style>
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
      </body>
    </html>
  );
}
