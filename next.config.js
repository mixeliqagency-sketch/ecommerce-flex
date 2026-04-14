/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "http2.mlstatic.com",
      },
      {
        // Cloudflare R2 public buckets (e.g. pub-abc123.r2.dev)
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        // LoremFlickr — fotos demo reales de Flickr con tags (modo DEMO_MODE=true)
        protocol: "https",
        hostname: "loremflickr.com",
      },
      {
        // LoremFlickr redirige a _.staticflickr.com para servir la imagen
        protocol: "https",
        hostname: "**.staticflickr.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          {
            key: "Content-Security-Policy",
            // CSP (2026-04-13): Next.js 14 en dev mode requiere unsafe-eval
            // para React Fast Refresh y HMR. Sin esto, la hidratacion React se
            // rompe silenciosamente y todos los client components quedan en
            // estado de loading. En prod build se puede endurecer si ninguna
            // libreria lo necesita. Mitigado por frame-ancestors + base-uri.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://api.mercadopago.com https://api.openai.com https://*.googleapis.com https://criptoya.com",
              "frame-src 'self' https://sdk.mercadopago.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      // Fuerza que el browser NO cachee el sw.js. Si el SW cambia (nuevo
      // CACHE_NAME, nueva estrategia, kill switch), el browser tiene que
      // descargar la version nueva al proximo request. Sin este header,
      // Chrome/Firefox cachean sw.js por 24h y el user queda atrapado con
      // la version vieja durante un dia entero.
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
