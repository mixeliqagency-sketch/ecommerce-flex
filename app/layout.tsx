import type { Metadata } from "next";
import { Space_Grotesk, Inter, Poppins, Montserrat, Playfair_Display, Open_Sans, Roboto, Lato } from "next/font/google";
import ClientShell from "@/components/layout/ClientShell";
import JsonLd from "@/components/seo/JsonLd";
import { themeConfig } from "@/theme.config";
import { getThemeCSS } from "@/lib/theme-css";
import "./globals.css";

// Cargar fuentes populares — solo se descarga la que se usa en theme.config
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-Space-Grotesk", weight: ["400", "500", "600", "700"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-Inter", weight: ["400", "500", "600", "700"] });
const poppins = Poppins({ subsets: ["latin"], variable: "--font-Poppins", weight: ["400", "500", "600", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-Montserrat", weight: ["400", "500", "600", "700"] });
const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-Playfair-Display", weight: ["400", "500", "600", "700"] });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-Open-Sans", weight: ["400", "500", "600", "700"] });
const roboto = Roboto({ subsets: ["latin"], variable: "--font-Roboto", weight: ["400", "500", "700"] });
const lato = Lato({ subsets: ["latin"], variable: "--font-Lato", weight: ["400", "700"] });

const ALL_FONTS = [spaceGrotesk, inter, poppins, montserrat, playfairDisplay, openSans, roboto, lato];

// Mapeo de fuentes configuradas
const headingFontVar = `--font-${themeConfig.styles.fonts.heading.replace(/ /g, "-")}`;
const bodyFontVar = `--font-${themeConfig.styles.fonts.body.replace(/ /g, "-")}`;

const fontClasses = ALL_FONTS.map(f => f.variable).join(" ");

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
const THEME_STYLE = getThemeCSS() + `
  :root {
    --font-heading: var(${headingFontVar}), sans-serif;
    --font-body: var(${bodyFontVar}), sans-serif;
  }
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={fontClasses} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
