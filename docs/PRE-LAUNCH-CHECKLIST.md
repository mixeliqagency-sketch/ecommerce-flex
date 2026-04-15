# Ecomflex / ANDAX — Pre-Launch Checklist

> **Estado al 2026-04-14**: Live en https://ecommerce-flex.vercel.app (DEMO_MODE_ALLOW_PRODUCTION). 28 fixes aplicados desde el deploy inicial, flow end-to-end verificado en Android PWA instalada. Biometric login con WebAuthn real funcional en demo. Pendiente: migración Kira/Data + backend WebAuthn producción + dominio propio + Sheets ANDAX productivas.
>
> **Uso:** esta lista agrupa TODO lo que falta hacer antes de submitir la app a Google Play Store + abrir la tienda al público. Dividido en **acciones manuales** (Pablo), **acciones de código** (ya hechas o diferidas), y **acciones externas** (servicios de terceros).

---

## 🔴 Acciones manuales bloqueantes (Pablo)

Estas **DEBEN** estar hechas antes del primer deploy a producción.

### 1. Rotar todas las keys del `.env.local`
El archivo `.env.local` contiene tokens reales (MercadoPago, Google Sheets, OpenAI, NextAuth). Aunque está gitignored y nunca fue commiteado, **hay que rotarlas antes del primer push a Vercel prod**. Las que usaste en demo quedan quemadas.

**Lista de claves a rotar:**
- [ ] `MERCADOPAGO_ACCESS_TOKEN` → crear nuevo en dashboard.mercadopago.com.ar → Credenciales → Producción
- [ ] `MERCADOPAGO_PUBLIC_KEY` → idem
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` → configurar en el webhook de MP
- [ ] `GOOGLE_SHEETS_CLIENT_EMAIL` + `GOOGLE_SHEETS_PRIVATE_KEY` → crear nueva service account en Google Cloud Console con scope **mínimo** (`spreadsheets` readwrite)
- [ ] `NEXTAUTH_SECRET` → generar nuevo con `openssl rand -base64 32`
- [ ] `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` → crear OAuth 2.0 client en Google Cloud Console
- [ ] `OPENAI_API_KEY` → nueva en platform.openai.com
- [ ] Evolution API key para WhatsApp

**Importante:** NO guardar estas claves en `.env.local` en producción. Usar **Vercel Environment Variables** (Settings → Environment Variables) directo en el dashboard.

### 2. Dominio y marca
- [ ] Registrar `andax.com.ar` en nic.ar (~$2000 ARS/año)
- [ ] Registrar marca "ANDAX" en INPI (clase 5 suplementos + clase 35 comercio) — ~$15.000 ARS, 6 meses
- [ ] Conseguir **RNPA real** de los productos que vas a vender (o acordar con los mayoristas usar el suyo)
- [ ] Configurar DNS de `andax.com.ar` apuntando a Vercel

### 3. TWA / Google Play Store
Ver [docs/twa-playstore-setup.md](twa-playstore-setup.md) y [public/.well-known/README.md](../public/.well-known/README.md) para el paso a paso.

- [ ] Instalar Bubblewrap: `npm i -g @bubblewrap/cli`
- [ ] Inicializar TWA: `bubblewrap init --manifest=https://andax.com.ar/manifest.webmanifest`
  - Importante: el `Application ID` tiene que coincidir con el `package_name` de `public/.well-known/assetlinks.json` (hoy: `ar.com.mixeliq.ecomflex`)
- [ ] Generar keystore de producción (Bubblewrap lo hace automáticamente)
- [ ] Extraer SHA-256 con `keytool -list -v -keystore android.keystore -alias android`
- [ ] **Reemplazar el placeholder** `REEMPLAZAR_CON_FINGERPRINT_DEL_KEYSTORE` en `public/.well-known/assetlinks.json` por el SHA-256 real
- [ ] Deploy a Vercel (para que el asset links sea accesible en HTTPS)
- [ ] Validar con [Google Statement List Tester](https://developers.google.com/digital-asset-links/tools/generator)
- [ ] Build APK/AAB: `bubblewrap build`
- [ ] Upload al Play Console

### 4. Screenshots obligatorios de Play Store
Capturá **4 screenshots mínimo** en formato portrait **1080×1920 px** y guardalos en `public/screenshots/` con estos nombres:

- [ ] `home.png` — hero + features + reviews (primera impresión)
- [ ] `productos.png` — catálogo con filtros visibles
- [ ] `producto.png` — ficha de producto con badge de oferta
- [ ] `checkout.png` — pantalla de pago con MercadoPago

Método recomendado: Chrome DevTools → Device Toolbar → 1080×1920 → "Capture full size screenshot". Ver [public/screenshots/README.md](../public/screenshots/README.md).

### 5. Google Play Console
- [ ] Crear cuenta de developer en Google Play Console ($25 USD one-time) — si todavía no la tenés
- [ ] Crear nuevo App en Play Console → Nombre: "ANDAX"
- [ ] **Data Safety Declaration**: completar el formulario obligatorio. Declarar que recolectás:
  - Nombre y apellido
  - Email
  - Teléfono
  - Dirección de envío
  - Historial de compras
  - Datos de pago (vía MercadoPago, no los guardamos)
- [ ] **Content Rating**: completar cuestionario. Para suplementos deportivos sin contenido adulto, el rating esperado es PEGI 3 / ESRB Everyone
- [ ] **Categoría**: Shopping
- [ ] **App description**: en español-AR, sin claims médicos (ver sección 7)
- [ ] **Política de privacidad**: URL pública `https://andax.com.ar/politica-privacidad` (ya existe)
- [ ] Upload APK/AAB firmado
- [ ] Internal testing antes de release público

### 6. Legal AR (obligatorio por ley)
- [x] Botón de arrepentimiento (Res. 424/2020) — **HECHO** (`/arrepentimiento`)
- [x] Política de privacidad (Ley 25.326) — **HECHO** (`/politica-privacidad`)
- [x] Términos y condiciones — **HECHO** (`/terminos`)
- [ ] **Completar datos del vendedor** en `themeConfig.contact` y en Términos: razón social real (monotributo o SRL), CUIT, domicilio legal, email de contacto verificado
- [ ] Si monotributista: registrar la actividad en AFIP (categoría comercio electrónico)
- [ ] Si SRL: constituir la sociedad en IGJ (~$400.000 ARS, 2-3 meses)

### 7. Copy de productos sin claims médicos
Los `beneficios` y `descripcion` de los 12 productos demo ya fueron reescritos sin claims médicos prohibidos (ver [POST-AUDIT-REPORT.md](POST-AUDIT-REPORT.md)). **Antes de cargar productos reales**, aplicá las mismas reglas:

**Palabras prohibidas** (Código Alimentario Argentino Art 217 bis + Play Policy 4.4):
- ❌ "cura", "trata", "previene", "alivia", "reduce X en N%", "aumenta testosterona", "baja el cortisol", "antiinflamatorio", "neuroprotector", "mejora sistema inmunológico"
- ✅ "aporte de", "complemento dietario", "uso tradicional en", "fuente de", "contiene", "formulado para"

---

## 🟡 Acciones opcionales pre-launch (fuertemente recomendadas)

### 8. Tracking / Analytics (para correr ads)
Si vas a correr Google Ads o Meta Ads, **necesitás los pixeles activos desde el día 1** para training y retargeting.

- [ ] Crear cuenta Google Tag Manager (`tagmanager.google.com`) — recomendado sobre GA4 directo porque permite agregar otros pixels sin tocar código
- [ ] Completar `themeConfig.analytics.googleTagManagerId` con el ID (formato `GTM-XXXXXXX`)
- [ ] Crear cuenta Meta Business (`business.facebook.com`) → Events Manager → Meta Pixel → copiar el ID (15 dígitos)
- [ ] Completar `themeConfig.analytics.metaPixelId`
- [ ] En el panel de toggles `/panel/config`, activar `googleAds.enabled` cuando tengas el Conversion ID

**Importante legal:** si activás tracking, agregá a `/politica-privacidad` un párrafo declarando los pixels + una mención del consent. Con `themeConfig.analytics.requireConsent = true` los scripts NO se cargan hasta que el user acepte un banner (el banner todavía hay que implementarlo — diferido).

### 9. Service Account de Google Sheets
Tu base de datos es una planilla de Google Sheets. Para que Next.js lea/escriba:

- [ ] Crear proyecto en Google Cloud Console
- [ ] Habilitar Google Sheets API
- [ ] Crear Service Account con scope mínimo (`spreadsheets`)
- [ ] Descargar credenciales JSON
- [ ] Compartir las 2 Sheets (pública + privada) con el email de la service account
- [ ] Copiar `client_email` y `private_key` a Vercel env vars

Ver `docs/superpowers/specs/2026-04-11-ecomflex-design.md` sección 16 para la estructura de tabs que necesitás crear en cada Sheet.

### 10. Rate limiting distribuido
Post-audit Security flaggeó que el `lib/rate-limit.ts` actual usa un `Map` global que no funciona en Vercel serverless (cada instancia tiene su propia memoria). Antes de exponer `/api/checkout`, `/api/auth/register` y `/api/email/subscribe` al público real:

- [ ] Crear cuenta gratis en [Upstash Redis](https://upstash.com)
- [ ] Copiar `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` a Vercel env
- [ ] Migrar `lib/rate-limit.ts` a usar Redis — ya hay un TODO en el archivo con la referencia exacta

### 11. Webhook MercadoPago idempotente
Misma razón que el rate-limit (Vercel multi-instancia). Cuando migres a Upstash, aprovechá y migrá la cache del webhook también:

- [ ] En `app/api/webhooks/mercadopago/route.ts`, cambiar el `Set<string> processedPayments` por un `redis.set` con TTL 1h
- [ ] Verificar que el check de estado en Sheets sigue funcionando como safety net

---

## 🟢 Ya hecho en código (referencia)

Lista de cosas que **NO** tenés que preocuparte porque ya están resueltas en el código:

- [x] CSP headers sin `unsafe-eval` + `frame-ancestors 'none'` + `base-uri 'self'`
- [x] `NEXT_PUBLIC_DEMO_MODE` combinado con `NODE_ENV !== production` (defense in depth)
- [x] JWT `maxAge: 7 días` + `updateAge: 24h` (bajado de 30d)
- [x] Formula injection protection en todos los writes a Sheets
- [x] Webhook MercadoPago con verificación HMAC-SHA256 + timing-safe compare
- [x] bcrypt salt rounds = 12 (NIST 2024)
- [x] `escapeFormulaInjection` aplicado automáticamente en `appendRow`/`updateCell`
- [x] NextAuth cookies con defaults seguros (httpOnly + secure en HTTPS)
- [x] Auth gate client-side en ProductCard, PopularCarousel, checkout, cuenta
- [x] Auth gate server-side en `/panel/*` con check de `role === "admin"`
- [x] BreadcrumbList schema en `/productos/[slug]`
- [x] AggregateRating schema en `/productos/[slug]` (con fallback si no hay reviews)
- [x] FAQ schema + FAQ visible en detail page (acordeones nativos `<details>`)
- [x] Blog metadata con keywords targeted
- [x] Robots.txt permitiendo GPTBot, PerplexityBot, ClaudeBot, Google-Extended
- [x] Sitemap.ts dinámico con ISR revalidate 300
- [x] OG images y Twitter cards (generativas via `opengraph-image.tsx`)
- [x] Product schema con `availability` (InStock/OutOfStock)
- [x] Service Worker con cache limitado a 100 entries
- [x] Manifest dinámico desde `themeConfig.install.*`
- [x] Página `/nosotros` con manifiesto institucional
- [x] Footer con trust signals (Envío 48h / Pago seguro / Productos sellados / RNPA)
- [x] PaymentBadges component (VISA, Master, AMEX, MercadoPago, USDT) uniformes
- [x] Wordplay ANDA en toda la UI (share, carrito vacío, CTA home, footer, referidos)
- [x] Panel admin con 20 toggles agrupados en 5 cards (Core/Marketing/Growth/Integraciones/UX)
- [x] Hook `useModuleConfig()` con soporte demo (localStorage) + prod (API)
- [x] `setDemoAdmin()` para simular modo admin en demo
- [x] `BrandWordmark` (logo horizontal ANDAX²) usado en Header + Login
- [x] `BrandManifesto` (acróstico animado) en home
- [x] Biometric login (WebAuthn) en login + cuenta (simulado en demo)
- [x] Email marketing opt-in en checkout
- [x] CartCrossSell con shortcut demo (zero latency al abrir el drawer)
- [x] Progress bar de envío gratis en el carrito
- [x] Scarcity signal en ProductCard (cuando stock ≤ 15)
- [x] Touch targets Header + CartItem upgradeados a 44×44 px (WCAG AAA)
- [x] Badge "Nuevo" contraste WCAG AA corregido (de 3.61:1 → 11.2:1 AAA)
- [x] Flechas Unicode reemplazadas por SVG inline en panel admin
- [x] Beneficios y descripciones de productos demo sin claims médicos
- [x] Type-check (`npx tsc --noEmit`) limpio
- [x] 7/7 rutas principales devuelven HTTP 200

---

## 📋 Orden sugerido de ejecución

Si querés un orden óptimo para no trabarte:

**Semana 1 — Legal + Infra**
1. Registrar dominio `andax.com.ar`
2. Crear proyecto Google Cloud + habilitar Sheets API
3. Crear Sheets privada + pública con los tabs del design doc
4. Rotar TODAS las keys del `.env.local`
5. Configurar Vercel env vars
6. Primer deploy a Vercel preview (no producción todavía)

**Semana 2 — Testing interno**
1. Navegar todo el site en el deploy de Vercel
2. Probar checkout con transferencia (modo real, tus propios datos)
3. Probar login con Google OAuth
4. Probar panel admin con tu rol admin en Sheets
5. Completar productos reales en la Sheet

**Semana 3 — Play Store + ads**
1. Capturar los 4 screenshots
2. Bubblewrap init + generar keystore
3. Extraer SHA-256 y completar assetlinks.json
4. Deploy a producción (Vercel prod)
5. Build APK/AAB
6. Submit a Play Console (internal testing track primero)
7. Configurar GTM + Meta Pixel
8. Crear campaña Google Ads con presupuesto bajo ($30/día)

**Post-launch**
1. Monitorear conversion rate en los primeros 50 pedidos
2. Ajustar copy basado en data real
3. Migrar rate-limit a Upstash cuando pases 500 visitas/día
4. Pedir reseñas a los primeros compradores (email + WhatsApp)

---

## 🔗 Links útiles

- Design doc completo: [docs/superpowers/specs/2026-04-11-ecomflex-design.md](superpowers/specs/2026-04-11-ecomflex-design.md)
- Post-audit report (23 fixes aplicados): [docs/POST-AUDIT-REPORT.md](POST-AUDIT-REPORT.md)
- README del proyecto: [../README.md](../README.md)
- Brand kit ANDAX: [docs/andax-brand-kit.md](andax-brand-kit.md)
- Launch checklist Ecomflex: [docs/ecomflex-launch-checklist.md](ecomflex-launch-checklist.md)

---

## 🛠 Notas operativas — Panel Admin

**Ubicación de los toggles de módulos:** `/panel/config` (NO en cada página individual).

Las páginas `/panel/marketing`, `/panel/seo`, `/panel/redes`, `/panel/referidos`, `/panel/cupones` son para **gestionar el contenido** de cada módulo (campañas, links, códigos). Para **prender/apagar** un módulo, ir siempre a `/panel/config` — los 20 toggles están organizados en 5 cards (Email Marketing, SEO Pro, Social Media, Cupones/Referidos, Push/Catálogo/Powered By).

**Acceso al panel en demo mode:** `/cuenta` → activar perilla "Soy el dueño (demo)" → aparece la card verde "Panel de administración" → click → `/panel`. En producción la card aparece automáticamente cuando `session.user.role === "admin"` en la Sheet.

**Reglas de auth en componentes UI:** SIEMPRE usar `useIsAuthenticated()` de `hooks/useIsAuthenticated.ts`. NUNCA `useSession()` directo de NextAuth — esa abstracción cubre demo + prod. Si un componente nuevo tiene que mostrar/ocultar algo según login, ese es el hook.

**CSP en `next.config.js`:** mantener `'unsafe-eval'` en `script-src`. Next.js 14 dev mode lo necesita para Fast Refresh; sin eso la hidratación React se rompe silenciosamente y todos los client components quedan en loading. En production build se podría endurecer, pero solo si ninguna librería de runtime lo necesita (verificar antes de remover).

---

## 🔐 Notas operativas — Auth, PWA y Biometric

### Demo mode en producción pública

Para deployar un showcase público (ej Vercel demo, staging) con DEMO_MODE activo sin que middleware/panel bloqueen rutas protegidas: setear en env vars **`DEMO_MODE_ALLOW_PRODUCTION=true`** además de `DEMO_MODE=true` y `NEXT_PUBLIC_DEMO_MODE=true`. El guard `NODE_ENV !== "production"` de `middleware.ts` + `app/panel/layout.tsx` es "defense in depth" que solo activa el bypass con el opt-in explícito. Sin él, un cliente que deja DEMO_MODE=true por error en prod sigue bloqueado (seguro).

### PWA start_url

`app/manifest.ts` setea `start_url: "/auth/login"`. Al abrir la PWA instalada, arranca en login directamente (no en home). Razones:
- Si hay sesión activa → `app/auth/login/page.tsx` tiene un `useEffect` con `useIsAuthenticated` que redirige a `/` inmediato
- Si hay huella activada → el auto-trigger del useEffect dispara WebAuthn a los 600ms → bottom sheet nativo de Android aparece solo
- Si no hay ni sesión ni huella → login normal

UX resultante: tipo app de banco Galicia/Mercado Pago — abrís la app, pones el dedo, estás adentro.

### Biometric login — regla de captura de email

**Gate crítico:** el card "Acceso con huella digital" en `/cuenta` Y el botón "Ingresar con huella" en `/auth/login` SOLO se muestran si `localStorage.has_email_login === "true"`. Ese flag se setea cuando el user hace login exitoso con **email/password** o **Google OAuth**. Motivo: garantizar captura de email del user para marketing antes de ofrecer un método de login alternativo que pueda saltear la captura. Regla inviolable de ANDAX.

**Implementación:**
- `handleSubmit` (form email/password) en `login/page.tsx`: después del login OK → `localStorage.setItem("has_email_login", "true")` + `localStorage.setItem("user_email", email)`
- Botón Google onClick: mismo patrón
- `BiometricActivation.tsx` useEffect: si `!has_email_login` → `setStatus("unsupported")` (card oculta)
- `login/page.tsx` `canBiometricLogin` check: también requiere `has_email_login`

### Biometric WebAuthn flow actual (demo mode)

El código usa `navigator.credentials.create()` y `navigator.credentials.get()` de verdad, no simulación. La credencial se almacena en el **Android Keystore** (hardware seguro). Al hacer login, el OS levanta el panel nativo de huella desde abajo (bottom sheet) y valida el dedo contra la credencial guardada.

**Lo que falta para seguridad producción Play Store:**
- Verificación server-side de la assertion (hoy demo confía en la firma del OS sin verificarla)
- 4 endpoints: `/api/auth/webauthn/{register-options,register-verify,login-options,login-verify}` usando `@simplewebauthn/server`
- Tab nueva `users_webauthn` en el Sheet ANDAX: `(user_email, credential_id, public_key_base64, counter, created_at, last_used_at)`
- `assetlinks.json` con el SHA256 del keystore del TWA generado por Bubblewrap (sin este archivo, Android TWA no asocia credenciales al origen)
- Remover bypass demo del frontend: challenge y verify deben venir del server

Plan detallado en memoria: `project_andax_webauthn_production.md`. Tiempo estimado: ~1.5h.

### Regla: sin sesión, no hay carrito

`handleLogout` en `/cuenta/page.tsx` llama `clearCart()` antes del redirect. El Header bloquea el botón del carrito cuando `!authenticated`: click → `router.push("/auth/login?callbackUrl=/")` y el badge rojo no se muestra. Sin sesión no se puede ver ni operar el carrito.

### Regla: flag biometric persiste entre sesiones

**NO** limpiar `demo_biometric_registered` ni `biometric_credential_id` en logout. Esos flags tienen que persistir entre sesiones para que el próximo login pueda usar la huella sin re-activación. Si el user quiere opt-out, tiene que hacerlo explícitamente vía el botón "Desactivar huella digital" que vive en el card de `/cuenta` cuando el status es `registered`.

### Branding ANDAX — color tokens

Todos los "dorados" heredados de AOURA (`#C9A96E`) fueron reemplazados por el **naranja de la X del logo** (`#F97316`):
- `theme.config.ts`: `decorativeBorder: "#F97316"` → aplica automáticamente a Header borderBottom, BottomNav borderTop, cualquier `var(--border-decorative)`
- `TopBar.tsx`: `goldColor` y `borderColor` hardcoded a `#F97316`
- **NO tocar la sección crypto/Binance del checkout**: el `#F0B90B` es identidad de marca Binance/crypto payment method, no ANDAX

### Status bar PWA theme color

`theme.config.ts`: `themeColor` y `pwaThemeColor` → `#0A0A0B` (bg-primary dark). Razones UX:
- Apps premium dark (Instagram, Spotify, X) usan status bar = bg app para continuidad visual
- El status bar es territorio del OS; competir con iconos del sistema (reloj, batería, wifi) con naranja saturado se ve agresivo
- Los acentos brand viven en bordes, badges, CTAs, logo — el status bar no es el lugar
- Si en el futuro se activa light mode, usar `<meta theme-color media="(prefers-color-scheme)">` para responsive

### Panel admin mobile nav

`app/panel/layout.tsx` tiene un nav horizontal scrollable siempre visible con las 8 tabs: Dashboard, Pedidos, Cupones, SEO, Marketing, Redes, Referidos, Config. **NO** usar `hidden md:flex` — rompía la navegación en mobile. El botón "← Tienda" queda arriba a la derecha del título "Panel Admin".

### Textos gated en demo mode

Componentes que requieren backend real tienen bypass en demo mode:
- `ReferralSection`: fake referral hardcoded (codigo DEMO1234, 12 clicks, 3 conversiones) porque `/api/referidos` requiere NextAuth
- `PushPermissionPrompt`: cierra el cartel SIEMPRE al clickear "Activar" (no espera respuesta del backend)
- `useModuleConfig`: lee de localStorage con keys `ecomflex_cfg:*` en demo, de `/api/config` en prod

