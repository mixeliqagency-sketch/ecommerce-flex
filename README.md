# Ecomflex

> Plataforma e-commerce swap-and-ship con marketing integrado, IA y gestión. Next.js 14 + Google Sheets + MercadoPago + OpenAI.
>
> **Editás 1 archivo, cambiás de marca en segundos.**

![Stack](https://img.shields.io/badge/Next.js-14.2-black) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan) ![Audit](https://img.shields.io/badge/audit-8%20agents%20passed-green) ![WCAG](https://img.shields.io/badge/WCAG-AA%20%2B%20AAA%20touch-success)

> **Estado 2026-04-13**: Post-audit. 8 agentes expertos + auditores cruzados (security, dev, play store, SEO, marketing, UX, UI Pro). 23 fixes aplicados. Ver [docs/POST-AUDIT-REPORT.md](docs/POST-AUDIT-REPORT.md) y [docs/PRE-LAUNCH-CHECKLIST.md](docs/PRE-LAUNCH-CHECKLIST.md).

---

## ¿Qué es esto?

Ecomflex es una plataforma e-commerce completa pensada para lanzarse **varias veces**. No es un template que se clona y se fork-ea; es una plataforma donde cada marca nueva sale de **un solo archivo de configuración** (`theme.config.ts`) + datos de productos (Google Sheets o `lib/demo-data.ts`).

**Regla de oro:** cualquier cosa visible que pueda cambiar entre marcas vive en `theme.config.ts`. Los componentes nunca hardcodean strings, colores, precios ni datos de contacto. Si encontrás un hardcode, es un bug.

---

## Instalación rápida (5 minutos)

```bash
git clone <repo>
cd ecomflex
npm install
npm run setup        # Wizard interactivo: pregunta nombre, colores, contacto
npm run dev
```

Abrí http://localhost:3000 y ya tenés tu tienda funcionando **en modo DEMO** con 12 productos de muestra, popup de email, checkout con 3 métodos de pago, carrito, toast, panel admin, blog SEO y asistente IA.

> **Modo DEMO (`DEMO_MODE=true`)**: corre sin Google Sheets, sin NextAuth, sin MercadoPago. Datos 100% locales desde `lib/demo-data.ts`. Ideal para armar y probar antes de conectar nada real.

---

## Los archivos que editás (y nada más)

```
theme.config.ts      ← TODO lo visual + textos + marca + pagos + contacto
lib/demo-data.ts     ← Productos, reviews, blog posts en modo demo
.env.local           ← Claves de APIs reales (solo al salir de demo)
```

Eso es todo. `components/`, `app/`, `lib/sheets/` son la plataforma: no se tocan al crear una marca.

### Mapa "quiero cambiar X → edito Y"

| Quiero cambiar… | Edito… |
|---|---|
| Nombre, tagline, descripción SEO, URL del dominio | `theme.config.ts` → `brand` |
| Colores (primario, accent, success, danger) | `theme.config.ts` → `styles.colors` |
| Tema oscuro / claro (fondos, textos) | `theme.config.ts` → `styles.dark` / `styles.light` |
| Tipografías (fuentes de heading y body) | `theme.config.ts` → `styles.fonts` |
| Categorías de productos en el menú | `theme.config.ts` → `categories` |
| Moneda, símbolo, umbral de envío gratis | `theme.config.ts` → `currency` |
| CBU, alias, titular, descuento transferencia | `theme.config.ts` → `payments.transferencia.datos` |
| Wallet crypto USDT, red (BEP-20, TRC-20) | `theme.config.ts` → `payments.crypto` |
| WhatsApp, email, Instagram, horario | `theme.config.ts` → `contact` |
| Textos: "Agregar al carrito", "Checkout", "Ya realicé la transferencia", "Completa tu compra", popup de email, etc. | `theme.config.ts` → `copy.*` |
| Asistente IA (nombre, avatar, personalidad, FAQ) | `theme.config.ts` → `assistant` |
| Hero del home y "features" | `theme.config.ts` → `home` |
| Nombre de la app en Play Store / PWA, colores del icono | `theme.config.ts` → `install` |
| Productos demo (mientras DEMO_MODE=true) | `lib/demo-data.ts` → `DEMO_PRODUCTS` |
| Reviews demo | `lib/demo-data.ts` → `DEMO_REVIEWS` |
| Blog posts demo | `lib/demo-data.ts` → `DEMO_BLOG_POSTS` |

Si necesitás editar un componente porque encontraste un hardcode, **reportalo**: es un bug de la plataforma. Lo correcto es extraer el valor a `theme.config.ts` y leerlo desde ahí.

---

## PWA instalable + Play Store

La tienda se instala como **app** en el celular del cliente (PWA). Además se empaqueta como **TWA** (Trusted Web Activity) para publicar en Google Play Store con Bubblewrap.

- Manifest dinámico generado desde `themeConfig.install` en [app/manifest.ts](app/manifest.ts)
- Prompt de instalación en [components/layout/InstallPrompt.tsx](components/layout/InstallPrompt.tsx) (toggle en `themeConfig.install.showInstallPrompt`)
- Service worker con cache limitado a 100 entries en `public/sw.js`
- TWA ready — incluye `public/.well-known/assetlinks.json` para Digital Asset Links

Ver sección 7 del design doc para el proceso completo de Play Store.

---

## Arquitectura en 30 segundos

- **Tienda pública** (`app/(tienda)/`): catálogo, carrito, checkout, tracking, blog, legal
- **Panel admin** (`app/panel/`): dashboard, pedidos, cupones, email marketing, SEO, config, redes
- **API routes** (`app/api/`): productos, checkout (MP + transferencia + crypto), newsletter, webhooks
- **Base de datos:** Google Sheets (2 sheets: pública + privada) vía `lib/sheets/`
- **Asistente IA:** Kira (OpenAI GPT-4o-mini con streaming) conectada a todos los datos
- **Email marketing:** Gmail + n8n (cola en Sheets, welcome series, carritos abandonados, post-compra, winback)

Arquitectura completa: [docs/superpowers/specs/2026-04-11-ecomflex-design.md](docs/superpowers/specs/2026-04-11-ecomflex-design.md) (1100 líneas, 27 secciones).

---

## Módulos incluidos (toggles on/off)

Todos los módulos vienen encendidos por defecto y se apagan desde el panel `/panel/config` (persisten en Sheets tab `config`):

| Módulo | Descripción |
|---|---|
| E-commerce | Catálogo, carrito, checkout, tracking |
| Kira (asistente IA) | Chat en la tienda con streaming + fallback WhatsApp |
| Email Marketing | Popup 10% OFF, welcome series, carrito abandonado, post-compra, winback, newsletters |
| Social Media Manager | Publica en IG/Twitter/TikTok desde el panel con copys generados por IA |
| SEO Pro | Blog topic clusters, Schema FAQ, BreadcrumbList, AI visibility |
| Cupones | Código + % + vencimiento + usos máximos |
| Programa de referidos | Link único, 10% OFF para ambos |
| Notificaciones Push | Web Push API + VAPID |
| Google Ads Tracking | Conversiones + remarketing |
| Modo Catálogo | Apaga checkout — ideal para servicios, venta por WhatsApp |

---

## Cuándo salir de modo DEMO (pasar a producción)

1. Crear 2 Google Sheets (pública + privada) con los tabs descritos en el design doc sección 16
2. Editar `.env.local` con credenciales reales (Google Service Account, NextAuth, MercadoPago, OpenAI)
3. Remover `DEMO_MODE=true` y `NEXT_PUBLIC_DEMO_MODE=true`
4. Correr `npm run build && npm run start`
5. Deploy a Vercel: `npx vercel`

Checklist completo de lanzamiento: [docs/ecomflex-launch-checklist.md](docs/ecomflex-launch-checklist.md)

---

## Panel admin + flujo de roles

El código tiene dos zonas separadas:

```
app/
├── page.tsx, productos/, checkout/, cuenta/, blog/    ← Tienda pública
└── panel/                                              ← Admin (role-gated)
    ├── layout.tsx          ← Server-side check de admin role
    ├── config/             ← 20 toggles de módulos (5 cards agrupadas)
    ├── marketing/, pedidos/, cupones/, seo/, referidos/, redes-sociales/
    └── DemoAdminGate.tsx   ← Client gate adicional para DEMO_MODE
```

**En producción:** acceso al panel requiere `session.user.role === "admin"` en la Sheet `usuarios`. El admin lo asigna manualmente editando la celda `role` de su propia fila.

**En DEMO_MODE:** no hay NextAuth, así que el acceso se simula con una **perilla "Soy el dueño (demo)"** en `/cuenta`. Al activarla, se desbloquea la card "Panel de administración" en la misma página que linkea a `/panel`. Los toggles se persisten en `localStorage` con keys namespaceadas (`ecomflex_cfg:${modulo}:${prop}`).

**Los 20 toggles se consumen reactivamente** desde los componentes vía el hook `useModuleConfig()`. Ejemplo: `EmailCapturePopup` chequea `isEnabled("emailMarketing", "welcomeSeries")` antes de montarse. Si el admin apaga Welcome Series, el popup desaparece sin refresh.

---

## Seguridad + compliance

El proyecto pasó por un **audit de 8 agentes** (4 expertos + 4 auditores cruzados) con descarte de falsos positivos ~70%. Resultado:

- **CSP hardened**: `script-src` sin `unsafe-eval` + `frame-ancestors 'none'` + `base-uri 'self'` + `form-action 'self'`
- **JWT maxAge 7d** (bajado de 30d) + `updateAge 24h` para refresh automático
- **bcrypt salt rounds = 12** (NIST 2024 compliant)
- **Auth gates duales**: middleware NextAuth (server) + client gates con hook `useIsAuthenticated`
- **Defense in depth**: `NEXT_PUBLIC_DEMO_MODE` combinado con `NODE_ENV !== production`
- **Formula injection protection** en todos los writes a Google Sheets
- **Webhook MercadoPago** con verificación HMAC-SHA256 + state check en Sheets como safety net
- **WCAG AA** contraste validado en dark + light mode (incluyendo badges)
- **Touch targets ≥44px** (WCAG AAA) en todos los botones icon-only

### Legal Argentina
- `/politica-privacidad` (Ley 25.326 ARCO completo)
- `/terminos` (Ley 24.240 + política de devolución)
- `/arrepentimiento` (Res. 424/2020, obligatorio e-commerce AR)
- Claims de productos **sin violar Código Alimentario Art 217 bis** (sin "cura", "reduce cortisol", "aumenta testosterona", etc.)

Ver [docs/POST-AUDIT-REPORT.md](docs/POST-AUDIT-REPORT.md) para el detalle de los 23 fixes aplicados y los ~54 descartes justificados.

---

## Analytics y tracking (opt-in)

Componente `<AnalyticsScripts />` montado en el layout. Carga **solo si hay IDs configurados** en `themeConfig.analytics`:

```ts
analytics: {
  googleTagManagerId: "",      // "GTM-XXXXXXX"
  googleAnalyticsId: "",       // "G-XXXXXXXXXX"
  googleAdsConversionId: "",   // "AW-XXXXXXXXXX/XXXXXXXXX"
  metaPixelId: "",             // "15-digit ID"
  requireConsent: false,       // true → espera banner de cookies
}
```

Sin IDs → zero scripts cargados → zero cookies → zero overhead. **Privacidad por default.**

---

## Stack técnico

- **Next.js 14** — App Router, Server Components, ISR, API Routes
- **TypeScript** (strict mode)
- **Tailwind CSS** con variables CSS del `theme.config.ts`
- **NextAuth** — Google OAuth + email/password (bcrypt ≥10 rounds)
- **Google Sheets API** — base de datos via `googleapis`
- **MercadoPago SDK** — pagos con tarjeta y cuotas
- **OpenAI** — Kira (GPT-4o-mini con streaming)
- **Zod** — validación en todas las funciones públicas
- **n8n** (self-hosted) — flujos de email marketing, social, insights

---

## Scripts disponibles

```bash
npm run dev          # Next.js dev server
npm run build        # Build de producción
npm run start        # Start del build
npm run lint         # ESLint
npm run type-check   # TypeScript sin emitir
npm run setup        # Wizard de configuración inicial de marca
```

---

## Licencia

Uso privado. Creado por **Mixeliq** (mixeliq.agency@gmail.com).
