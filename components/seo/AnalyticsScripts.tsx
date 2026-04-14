// components/seo/AnalyticsScripts.tsx
//
// Inyecta scripts de tracking opt-in: Google Analytics 4, Google Tag Manager,
// Google Ads conversion tracking y Meta Pixel. Todos los IDs vienen de
// `themeConfig.analytics.*` — si el ID esta vacio, el script NO se carga
// (zero overhead, zero cookies, zero privacy impact).
//
// SEGURIDAD: los IDs se serializan con JSON.stringify antes de interpolarse
// en los scripts inline. Esto escapa cualquier caracter peligroso y previene
// injection incluso en el caso teorico de que un admin con acceso a theme.config
// ponga valores maliciosos. En la practica, theme.config esta en el repo, es
// codigo trusted, pero la defensa en profundidad nunca sobra.
//
// USO: mount este componente una vez en `app/layout.tsx` dentro del <body>.
// Los scripts se cargan con strategy="afterInteractive" para no bloquear LCP.
//
// PRIVACIDAD: si `themeConfig.analytics.requireConsent === true`, los scripts
// esperan a que el usuario acepte un banner de cookies (TODO: implementar
// banner cuando salgas de demo — por ahora solo respeta el flag).

import Script from "next/script";
import { themeConfig } from "@/theme.config";

// Escapa un string para que sea seguro interpolarlo DENTRO de un script inline.
// JSON.stringify nos da las comillas + escape de caracteres especiales.
function safe(s: string): string {
  return JSON.stringify(s);
}

export default function AnalyticsScripts() {
  const { analytics } = themeConfig as unknown as {
    analytics?: {
      googleAnalyticsId?: string;
      googleTagManagerId?: string;
      googleAdsConversionId?: string;
      metaPixelId?: string;
      requireConsent?: boolean;
    };
  };

  if (!analytics) return null;
  if (analytics.requireConsent) return null;

  const gaId = (analytics.googleAnalyticsId ?? "").trim();
  const gtmId = (analytics.googleTagManagerId ?? "").trim();
  const adsId = (analytics.googleAdsConversionId ?? "").trim();
  const metaId = (analytics.metaPixelId ?? "").trim();

  // Early exit si no hay ningun pixel configurado — 0 scripts cargados.
  if (!gaId && !gtmId && !adsId && !metaId) return null;

  const gtmSnippet = gtmId
    ? `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+${safe(gtmId)}+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${safe(gtmId)});`
    : "";

  const ga4Snippet = gaId && !gtmId
    ? `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${safe(gaId)},{anonymize_ip:true});`
    : "";

  const adsSnippet = adsId && !gtmId
    ? `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('config',${safe(adsId.split("/")[0])});`
    : "";

  const metaSnippet = metaId
    ? `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${safe(metaId)});fbq('track','PageView');`
    : "";

  return (
    <>
      {gtmSnippet && (
        <Script id="gtm-init" strategy="afterInteractive">{gtmSnippet}</Script>
      )}
      {gaId && !gtmId && (
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
          strategy="afterInteractive"
        />
      )}
      {ga4Snippet && (
        <Script id="ga4-init" strategy="afterInteractive">{ga4Snippet}</Script>
      )}
      {adsSnippet && (
        <Script id="google-ads-init" strategy="afterInteractive">{adsSnippet}</Script>
      )}
      {metaSnippet && (
        <Script id="meta-pixel-init" strategy="afterInteractive">{metaSnippet}</Script>
      )}
    </>
  );
}
