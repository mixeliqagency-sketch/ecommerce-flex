import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import ClientShell from "@/components/layout/ClientShell";
import JsonLd from "@/components/seo/JsonLd";
import { themeConfig } from "@/theme.config";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

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
    apple: [
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
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
    images: [
      {
        url: seo.ogImage,
        width: 1200,
        height: 630,
        alt: `${brand.name} — ${brand.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand.name} — ${brand.tagline}`,
    description: brand.description,
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large" as const,
    "max-video-preview": -1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-bg-primary text-text-primary font-body">
        {/* Schema Organization */}
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": brand.name,
          "url": brand.url,
          "description": brand.description,
          "logo": {
            "@type": "ImageObject",
            "url": `${brand.url}/icon-512.png`,
            "width": 512,
            "height": 512,
          },
          "sameAs": Object.values(themeConfig.social).filter(Boolean),
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "availableLanguage": "Spanish",
          },
        }} />
        {/* Schema WebSite — SearchBox */}
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": brand.name,
          "url": brand.url,
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${brand.url}/productos?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }} />
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
