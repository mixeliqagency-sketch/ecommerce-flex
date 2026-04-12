# ECOMFLEX — Spec de Diseño Completo v3

**Fecha:** 2026-04-11
**Versión:** 3.0 (corregida tras 8 rondas de auditoría — 90+ hallazgos resueltos)
**Estado:** EN DISEÑO — Pendiente aprobación de Pablo
**Repo actual:** github.com/mixeliqagency-sketch/ecommerce-flex
**Base:** Next.js 14, Google Sheets (dual), MercadoPago, OpenAI, Tailwind CSS

---

## 1. VISIÓN DEL PRODUCTO

Ecomflex es una plataforma completa de negocio digital: e-commerce + marketing + IA + gestión, todo en una sola app.

**No es solo una tienda.** Es la herramienta que Pablo usa para vender suplementos (si AOURA fitness no funciona) y que después vende como servicio a emprendedores.

### Modelo de negocio
- **Uso propio primero:** tienda de suplementos de Pablo
- **Después vender como servicio:** Pablo le arma tiendas a clientes usando Ecomflex como base
- El cliente nunca toca código — Pablo le entrega la tienda funcionando
- Cobro: setup + mensual por gestión

### Nombre y marca
- **Nombre del producto:** Ecomflex
- **En el código:** todo referencia "ecomflex", cero rastros de AOURA
- **Para el cliente:** ve el nombre de SU negocio, no "Ecomflex"
- **Footer opcional:** "Powered by Ecomflex" (toggle on/off en config)

---

## 2. DECISIONES TÉCNICAS APROBADAS

| Decisión | Resultado | Motivo |
|---|---|---|
| Base de datos | Google Sheets (2 Sheets: pública + privada) | Gratis, el cliente puede editar productos. Datos sensibles separados. |
| Envío de emails | Gmail + n8n | Ya lo tiene, gratis, escalable si se envía de forma progresiva |
| App móvil | TWA (Bubblewrap) | Un solo código, presencia en Play Store, cambios web = cambios app |
| Asistente IA | Kira (OpenAI GPT-4o-mini con streaming) | Obligatorio. Se puede desactivar pero viene de serie |
| WhatsApp | Kira vía Evolution API + n8n | Ya funciona en producción. Integrado como opción dentro del chat de Kira |
| SMS | DESCARTADO | Nadie lo usa en Argentina 2026 |
| Arquitectura | App (tienda) + Panel admin separados | Tienda ultra rápida para el comprador, panel lazy-loaded para el dueño |
| Módulos | Todos encendidos por defecto, con toggles para apagar | Panel tipo "perillas" de encendido/apagado |
| Publicación en redes | Desde la app, IG + Twitter + TikTok | Usando estructura ABIERTO → AUTORIDAD → SOLUCIÓN para copies |
| Config visual | `theme.config.ts` (solo estilos) | Colores, fuentes, textos — build-time |
| Config módulos | Google Sheets tab "config" (solo toggles) | On/off de módulos — runtime con cache 5 min |

---

## 3. ARQUITECTURA

```
ecomflex/
├── app/
│   ├── (tienda)/          ← Lo que ve el COMPRADOR (público, ultra rápido)
│   │   ├── page.tsx             → Homepage
│   │   ├── productos/           → Catálogo + detalle producto (Server Component)
│   │   ├── checkout/            → Checkout + resultado pago
│   │   ├── tracking/            → Seguimiento de pedido
│   │   ├── blog/                → Artículos SEO (topic clusters)
│   │   ├── auth/                → Login / registro
│   │   ├── politica-privacidad/ → Política de privacidad (requerida Play Store)
│   │   ├── terminos/            → Términos y condiciones de compra
│   │   └── arrepentimiento/     → Botón de arrepentimiento (Res. 424/2020, obligatorio Argentina)
│   │
│   ├── panel/             ← Lo que ve el DUEÑO del negocio (protegido, lazy load)
│   │   ├── page.tsx             → Dashboard (ventas, métricas, resumen de Kira)
│   │   ├── productos/           → Gestión de productos (CRUD via Sheets)
│   │   ├── pedidos/             → Lista de pedidos + estados
│   │   ├── marketing/           → Email marketing + Social media + Cupones
│   │   ├── seo/                 → Estado SEO + blog editor
│   │   ├── kira/                → Chat con Kira + historial + insights
│   │   ├── resenas/             → Moderar reseñas
│   │   ├── referidos/           → Programa de referidos
│   │   └── config/              → Panel de toggles (encender/apagar módulos)
│   │
│   └── api/               ← Backend (API routes)
│       ├── auth/                → NextAuth (Google OAuth + email/password)
│       ├── productos/           → CRUD productos
│       ├── checkout/            → Crear preferencia MercadoPago + transferencia + crypto
│       ├── pedidos/             → Refund, actualizar estado
│       ├── email/               → Suscripción, newsletters (Gmail via n8n)
│       ├── social/              → Publicación en redes
│       ├── kira/                → Chat con streaming + insights
│       ├── analytics/           → Métricas del dashboard
│       ├── cupones/             → Validar, crear, listar cupones
│       ├── referidos/           → Links y tracking de referidos
│       ├── resenas/             → Crear y listar reseñas
│       ├── blog/                → CRUD artículos
│       ├── push/                → Suscripciones y envío push
│       ├── tracking/            → Consultar estado de pedido
│       ├── config/              → Leer/actualizar toggles de módulos
│       └── webhooks/            → MercadoPago (con verificación de firma)
│
├── components/
│   ├── tienda/            ← Componentes del comprador
│   ├── panel/             ← Componentes del panel admin
│   └── shared/            ← Componentes compartidos (iconos, botones, modales)
│
├── lib/
│   ├── sheets/            ← Acceso a Google Sheets (modularizado, 1 archivo por tab)
│   │   ├── client.ts           → Singleton auth + conexión (2 Sheets: pública + privada)
│   │   ├── products.ts         → CRUD productos
│   │   ├── orders.ts           → CRUD pedidos + updateOrderStatus()
│   │   ├── users.ts            → CRUD usuarios + roles
│   │   ├── reviews.ts          → CRUD reseñas
│   │   ├── subscribers.ts      → Suscriptores email + push subscriptions
│   │   ├── coupons.ts          → Cupones
│   │   ├── referrals.ts        → Referidos
│   │   ├── carts.ts            → Carritos abandonados
│   │   ├── queue.ts            → Cola de eventos (tab "cola")
│   │   ├── config.ts           → Toggles de módulos
│   │   ├── blog.ts             → CRUD artículos del blog
│   │   ├── keywords.ts         → Keyword map SEO
│   │   ├── metrics.ts          → Lectura de métricas agregadas
│   │   ├── emails-log.ts       → Historial de emails enviados
│   │   ├── social-log.ts       → Historial de publicaciones en redes
│   │   ├── helpers.ts          → appendRow(), getRows(), findRow()
│   │   └── cache.ts            → Cache strategy (ver sección 21)
│   ├── mercadopago.ts
│   ├── auth.ts
│   ├── utils.ts           ← calcSubtotal(), calcEnvio(), calcTransferPrice()
│   ├── validation.ts      ← Zod schemas
│   ├── analytics.ts
│   └── theme-css.ts
│
├── context/               ← Estado global (con useMemo en values)
├── types/                 ← TypeScript types
├── theme.config.ts        ← SOLO configuración visual (colores, fuentes, textos)
└── public/
    ├── .well-known/
    │   └── assetlinks.json  → Digital Asset Links para TWA
    ├── sw.js              → Service worker (cache limitado a 100 entries)
    └── manifest.json
```

### Principios de arquitectura
- Tienda y Panel separados — el comprador nunca carga código del panel
- Cada módulo es independiente — si apagás uno, cero código se carga
- Carpetas claras — un programador nuevo entiende todo en 5 minutos
- API routes organizadas por dominio — no archivos gigantes
- Route groups de Next.js `(tienda)/` para agrupar sin afectar URLs
- ESLint rule: prohibir importar desde `components/panel/` en `app/(tienda)/`
- `lib/sheets/` modularizado — máximo ~150 líneas por archivo

---

## 4. MÓDULOS DEL SISTEMA

> **Convención de endpoints:** Los dominios de negocio usan español (`/api/productos`, `/api/resenas`, `/api/cupones`, `/api/referidos`) y los dominios técnicos usan inglés (`/api/checkout`, `/api/tracking`, `/api/blog`, `/api/push`, `/api/social`, `/api/email`, `/api/analytics`, `/api/config`).

### 4.1 E-COMMERCE (ya existe, mejorar)
- Catálogo con filtros, búsqueda (con debounce 300ms), ordenamiento
- Carrito con +/- y cross-sell
- **Gestión de stock:** validar al agregar al carrito, decrementar al confirmar pago, mostrar "Agotado" si stock=0, alerta admin si stock bajo
- Checkout: MercadoPago + Transferencia bancaria (confirmación manual) + Crypto USDT (confirmación manual)
- Tracking de pedidos con actualización de estados
- Reseñas con fotos + badge "Compra verificada"
- Auth: Google OAuth + bcrypt (salt rounds ≥ 10) para email/password
- PWA instalable + TWA para Play Store (push funciona en Android; iOS limitado desde Safari 16.4)
- **Webhook idempotente:** verificar payment_id antes de procesar para evitar pedidos duplicados
- **Carrito abandonado:** email como primer campo del checkout (antes de pago) para capturar aunque no complete. Si el usuario se va antes del checkout (sin email), el carrito se registra en métricas pero NO se envía email. Para maximizar captación: popup de email al primer "Agregar al carrito" (configurable).
- **Reseñas del comprador:** email post-compra #3 incluye link directo a `/productos/[slug]#resenas`. En la página de producto, si el usuario tiene compra verificada, aparece formulario de reseña con foto. Si no, el formulario no se muestra.

**API Endpoints:**
- `GET /api/productos` — listar productos (ISR revalidate: 300)
- `GET /api/productos/[slug]` — detalle de producto (Server Component, SSR)
- `POST /api/checkout` — crear preferencia MercadoPago (valida stock antes)
- `POST /api/checkout/transferencia` — checkout por transferencia (estado: pendiente_pago, notifica admin)
- `POST /api/checkout/crypto` — checkout crypto USDT (muestra wallet + red, estado: pendiente_pago, confirmación manual)
- `POST /api/webhooks/mercadopago` — webhook IDEMPOTENTE: verifica x-signature + verifica payment_id único antes de procesar. Responde 200 inmediatamente, procesa async.
- `GET /api/tracking/[orderId]` — consultar estado de pedido
- `POST /api/pedidos/[orderId]/refund` — procesar reembolso vía MercadoPago Refund API (panel admin)
- `POST /api/resenas` — crear reseña (con foto, rate limited)
- `GET /api/resenas/[slug]` — listar reseñas de producto

**Ciclo de vida del pedido:**
```
creado → pendiente_pago → pagado → preparando → enviado → entregado
         pendiente_pago → cancelado (auto: 48h sin pago)
         pagado → reembolsado (admin)
         pagado → cancelado (admin, con reembolso automático)
         preparando → cancelado (admin, con reembolso automático)
         enviado → reembolsado (admin, post-entrega)
         entregado → reembolsado (admin, dentro de 10 días — Ley 24.240)
```
Todas las transiciones las ejecuta el admin desde `/panel/pedidos`, excepto `pendiente_pago → cancelado` que es automática (n8n Schedule revisa cada hora).

**Flujo de stock:**
1. Usuario agrega al carrito → se valida stock disponible (si stock=0, botón dice "Agotado")
2. Usuario llega a checkout → se re-valida stock (pudo cambiar)
3. Webhook confirma pago → se decrementa stock atómicamente
4. Si stock < umbral configurable → Kira alerta al admin vía Telegram

### 4.2 KIRA — Asistente IA (mejorar integración)
- Chat integrado en la tienda con **streaming** (tokens incrementales, no spinner)
- Conectada a TODOS los datos de Google Sheets
- Da insights proactivos al dueño: "Hoy vendiste $X, producto más vendido: Y, 3 carritos abandonados"
- Opción dentro del chat: "¿Preferís seguir por WhatsApp?" → continúa en WhatsApp vía Evolution API
- Kira en WhatsApp ya funciona (flujo `lwhG1psFNFtNol0C` en n8n)
- Modelo: GPT-4o-mini (80% más barato que 4o)
- Mensajes en memoria limitados a 50 (evitar memory leak)
- NO es opcional — viene siempre. El dueño puede desactivarla si quiere.

**API Endpoints:**
- `POST /api/kira/chat` — enviar mensaje y recibir respuesta (stream)
- `GET /api/kira/insights` — obtener resumen diario cacheado

### 4.3 EMAIL MARKETING (nuevo)
- **Popup de captación:** "Suscribite y llevá 10% OFF" — aparece a los 5 seg o al intentar salir
- **Welcome Series:** 5 emails en 7 días (descuento → historia → prueba social → objeciones → urgencia)
- **Carrito abandonado:** 3 emails (1h → 24h → 48h con incentivo extra)
- **Post-compra:** 4 emails (confirmación → tips de uso → pedir reseña → cross-sell)
- **Winback:** se activa a 60 días sin compra
- **Sunset/limpieza:** cada 90-120 días, eliminar inactivos
- **Newsletters:** configurables desde el panel
- Toggle on/off para cada sub-módulo
- Envío vía Gmail + n8n (cola en Sheets, NO Wait nodes)

**API Endpoints:**
- `POST /api/email/subscribe` — suscribir email (popup)
- `POST /api/email/unsubscribe` — desuscribir
- `POST /api/email/send-newsletter` — enviar newsletter (desde panel)
- `GET /api/email/stats` — estadísticas de emails

### 4.4 SOCIAL MEDIA MANAGER (nuevo)
- Publicar en Instagram, Twitter y TikTok desde el panel
- Estructura de copies: ABIERTO → AUTORIDAD → SOLUCIÓN
- Formato PUV para reels (mano mostrando producto + voz en off)
- Programar publicaciones
- Integración con n8n para publicación. Instagram: usar Blotato API (`BLOTATO_API_KEY`). Si Blotato no tiene API al momento de implementar, usar Instagram Graph API vía Facebook App aprobada.
- Twitter API v2 (requiere Developer Account aprobada)
- TikTok Content Posting API (requiere aprobación de TikTok — proceso de semanas, planificar con anticipación)
- Generación de copies con IA (GPT-4o-mini)
- Toggle on/off

**API Endpoints:**
- `POST /api/social/publish` — publicar en redes
- `POST /api/social/schedule` — programar publicación
- `GET /api/social/history` — historial de publicaciones

### 4.5 SEO PRO (nuevo)
- Schema FAQ en páginas de producto
- Schema BreadcrumbList en todas las páginas
- Blog con topic clusters (`/blog/[slug]`)
- Content chunking (secciones autónomas para LLMs)
- Robots.txt permitiendo GPTBot, PerplexityBot
- Google Tag / tracking de conversiones configurable
- Keyword map en Google Sheets (tab `keywords`)
- Toggle on/off

**API Endpoints:**
- `GET /api/blog` — listar artículos
- `GET /api/blog/[slug]` — artículo individual
- `POST /api/blog` — crear/editar artículo (panel)

### 4.6 CUPONES Y DESCUENTOS (nuevo)
- Crear cupones desde el panel (código + % descuento + fecha vencimiento + usos máximos)
- Tipos: primera compra, por volumen, por temporada, personalizado
- Los emails y redes usan estos cupones como gancho
- Almacenamiento en Google Sheets (tab `cupones`)

**API Endpoints:**
- `POST /api/cupones/validate` — validar cupón en checkout
- `GET /api/cupones` — listar cupones (panel)
- `POST /api/cupones` — crear cupón (panel)

### 4.7 PROGRAMA DE REFERIDOS (nuevo)
- Link único por cliente
- "Invitá a un amigo, ambos ganan 10% OFF"
- Tracking de referidos en Sheets (tab `referidos`)
- Toggle on/off

**API Endpoints:**
- `GET /api/referidos/[userId]` — obtener link de referido
- `POST /api/referidos/track` — registrar referido

### 4.8 NOTIFICACIONES PUSH (nuevo, TWA)
- Usa Web Push API con VAPID keys
- Service worker registra suscripción y la guarda en Sheets
- Tipos de notificación:
  - "Tu pedido fue enviado"
  - "Nuevo producto disponible"
  - "Tu cupón vence mañana"
- Se envían vía n8n (flujo Ecomflex Push Notifications)
- Configurables desde el panel
- Toggle on/off

**API Endpoints:**
- `POST /api/push/subscribe` — registrar suscripción push
- `POST /api/push/send` — enviar notificación (vía n8n webhook)

### 4.9 MODO CATÁLOGO (nuevo)
- Toggle que desactiva carrito y checkout
- Cuando está activo:
  - El botón "Agregar al carrito" se reemplaza por "Consultar por WhatsApp"
  - Las rutas `/checkout/*` redirigen al home
  - El ícono del carrito se oculta del header
  - Los precios se muestran pero sin opción de compra
- La venta se canaliza por WhatsApp (Kira)
- Ideal para clientes que recién arrancan o que venden servicios
- Toggle on/off

**API Endpoints:** Ninguno propio — usa la configuración leída de los endpoints de config (ver sección 5).

### 4.10 DASHBOARD / MÉTRICAS (nuevo)
- Ventas del día/semana/mes
- Productos más vendidos
- Carritos abandonados
- Emails enviados y abiertos
- Resumen diario de Kira con insights
- Visitas (fuente: Vercel Analytics o Google Analytics Data API)
- Datos desde Google Sheets (tab `metricas`, actualizado por flujo n8n diario)

**API Endpoints:**
- `GET /api/analytics/summary` — KPIs del dashboard
- `GET /api/analytics/top-products` — productos más vendidos
- `GET /api/analytics/abandoned-carts` — carritos abandonados

### 4.11 GOOGLE ADS TRACKING (nuevo)
- Integración con Google Ads para tracking de conversiones (Purchase, Add to Cart, Begin Checkout)
- Remarketing: pixel de seguimiento para retargeting
- Configurar Tracking ID desde el panel
- Apagado por defecto (requiere cuenta de Google Ads del cliente)
- Toggle on/off

**API Endpoints:** Ninguno propio — configuración vía tab "config" en Sheets. El tracking se inyecta client-side vía `<Script>` condicional.

---

## 5. PANEL DE CONTROL (Config con toggles)

> **Fuente de verdad única:** Los toggles se almacenan SOLO en Google Sheets (tab "config") y se leen en runtime con cache de 5 min. El archivo `theme.config.ts` contiene SOLO la configuración visual. El bloque de abajo muestra los DEFAULTS que se usan para inicializar el tab "config" en Sheets la primera vez.

```ts
// Defaults para inicializar tab "config" en Sheets:
modules: {
  dashboard: { enabled: true },        // siempre activo
  emailMarketing: { enabled: true, welcomeSeries: true, abandonedCart: true, postPurchase: true, winback: true, newsletters: true },
  socialMedia: { enabled: true, instagram: true, twitter: true, tiktok: true },
  seoPro: { enabled: true, blog: true, faqSchema: true, breadcrumbs: true, aiVisibility: true },
  googleAds: { enabled: false, trackingId: "", remarketing: false },
  kira: { enabled: true, whatsappFallback: true },
  cupones: { enabled: true },
  referidos: { enabled: true },
  pushNotifications: { enabled: true },
  modoCatalogo: { enabled: false },
  poweredBy: { enabled: true },
  stockAlert: { threshold: 5 },        // alerta cuando stock de un producto < 5 unidades
}
```

**API Endpoints de config:**
- `GET /api/config` — leer todos los toggles (cache 5 min)
- `PUT /api/config` — actualizar toggles (desde panel admin, requiere role admin)

---

## 6. THEME CONFIG (Personalización visual — SOLO estilos)

`theme.config.ts` contiene SOLO configuración visual. NO contiene toggles de módulos.

El dueño puede cambiar:
- Nombre de marca, tagline, logo
- Colores (primario, secundario, acento, peligro, éxito)
- Tipografías (heading + body, Google Fonts — solo se cargan las 2 configuradas)
- Border radius (cards, botones, pills)
- Borde decorativo
- Tema oscuro y claro (8 variables cada uno)
- Categorías de productos
- Moneda y umbral de envío gratis
- Datos de pago (MercadoPago, transferencia, crypto)
- Contacto y redes sociales
- SEO keywords
- Hero del homepage
- Features del homepage
- FAQ del asistente

---

## 7. GOOGLE PLAY STORE (TWA)

- Empaquetar la web como TWA usando Bubblewrap
- Cuenta de Play Store: Mixeliq (verificación en proceso, factura Telecentro enviada 2026-04-11)
- Un solo código — cambios en Vercel se reflejan en la app automáticamente
- Digital Asset Links: crear `public/.well-known/assetlinks.json` con SHA-256 del keystore
- Configurar header en `next.config.js` para servir assetlinks.json correctamente
- Manifest.json ya existe, mejorar con:
  - Screenshots de la app (mínimo 4)
  - Splash screen personalizado
  - Orientación portrait
  - Categoría: Shopping
- Política de privacidad en `/politica-privacidad` (página estática, requerida por Play Store)

---

## 8. CALIDAD DE CÓDIGO

### Requisitos para que un programador externo pueda mantenerlo:
- Comentarios en español en las partes clave
- TypeScript estricto en todo el proyecto
- Validación con Zod en cada función pública de Sheets
- Nombres de archivos y funciones descriptivos
- README.md con setup, estructura, y cómo agregar módulos
- Sin archivos gigantes — máximo ~200 líneas por componente
- `lib/sheets/` modularizado (no monolitos)
- Constantes para índices de columnas de cada tab (no row[0], row[8])
- Try/catch con retry exponencial en TODAS las funciones de Sheets
- .env.example actualizado con TODAS las variables necesarias
- Sin API keys hardcodeadas — todo en variables de entorno
- Funciones centralizadas: `calcSubtotal()`, `calcEnvio()`, `calcTransferPrice()` en `lib/utils.ts`
- Componentes compartidos para iconos SVG (no copy-paste entre Header y BottomNav)
- `useMemo` en todos los values de Context Providers

---

## 9. FLUJOS n8n NECESARIOS

### Ya existen (NO TOCAR, solo conectar o clonar):
| ID | Nombre | Uso en Ecomflex |
|---|---|---|
| `lwhG1psFNFtNol0C` | AOURA Kira WhatsApp | Kira responde clientes por WhatsApp |
| `k7NiC8fNgehcoLZ1` | Kira Voss Contenido | Base para clonar → Content Machine |
| `92NMZMS4cz6yN5f5` | Generador Videos Virales + Copies IA | Base para clonar → Reels Machine |
| `qyd3vC6Q5Py1QXcZ` | Agente Icebreaker | Base para clonar → Welcome Series |

### Clonar y adaptar (cambiar webhook URL y credenciales):
| Base | Nuevo nombre | Función |
|---|---|---|
| `k7NiC8fNgehcoLZ1` | Ecomflex Content Machine | Generar contenido IG/Twitter/TikTok con estructura ABIERTO→AUTORIDAD→SOLUCIÓN |
| `92NMZMS4cz6yN5f5` | Ecomflex Reels Machine | Generar guiones de reels formato PUV |
| `qyd3vC6Q5Py1QXcZ` | Ecomflex Welcome Series | 5 emails en 7 días para nuevos suscriptores |

### Crear nuevos (NINGUNO usa Wait nodes — todos usan cola en Sheets):
| Nombre | Trigger | Función |
|---|---|---|
| Ecomflex Email Queue Processor | Schedule (cada hora) | Revisa tab "cola" y envía emails pendientes (carrito abandonado, post-compra, winback) |
| Ecomflex Newsletter | Schedule (configurable) | Newsletter semanal con GPT + Gmail |
| Ecomflex Kira Insights | Schedule (diario 8AM) | Kira analiza datos y manda resumen al panel/Telegram |
| Ecomflex Push Notifications | Webhook desde la app | Enviar notificaciones push (pedido enviado, cupón, etc.) |
| Ecomflex Sunset Cleanup | Schedule (cada 30 días) | Revisar suscriptores inactivos 90+ días, eliminar o re-engagement |
| Ecomflex Sheets Backup | Schedule (semanal, domingo 3AM) | Exportar tabs críticos a JSON como respaldo |

### Total flujos n8n:
- **Existentes a conectar/clonar:** 4 (Kira WhatsApp y Kira Voss se conectan; Videos Virales e Icebreaker se clonan)
- **Clones a crear:** 3 (Content Machine, Reels Machine, Welcome Series)
- **Nuevos desde cero:** 6
- **TOTAL:** 13 intervenciones (4 existentes + 3 clones + 6 nuevos)

> **Nota sobre Winback:** El flujo `Ecomflex Email Queue Processor` maneja TODOS los emails automatizados incluyendo winback. No necesita flujo independiente — el Queue Processor revisa la cola y procesa según tipo (carrito_abandonado, post_compra, winback).

### Diseño resiliente (sin Wait nodes):
- La app escribe eventos en tab "Cola" (email, tipo, timestamp, estado: pendiente)
- `Ecomflex Email Queue Processor` revisa cada hora y procesa los pendientes
- Si n8n se reinicia, la cola persiste en Sheets — nada se pierde
- Consume cero RAM entre ejecuciones (solo durante el procesamiento)
- Configurar `--max-old-space-size=512` en n8n
- NO agregar HTTP auditors pesados a OpenAI (764MB RAM)

---

## 10. MIGRACIÓN DESDE AOURA

### Lo que se trae de AOURA:
- Toda la lógica de e-commerce (productos, carrito, checkout, pagos)
- Sistema de reseñas (mejorar con fotos)
- Asistente IA (renombrar asistente existente a Kira, conectar con datos de Sheets)
- PWA y service worker (agregar límite de 100 entries al cache)
- SEO base (sitemap, JSON-LD, OG images)
- Auth (Google + email/password)
- Modo oscuro/claro

### Lo que NO se trae:
- Sección fitness (ejercicios, rutinas, stretching, cardio)
- NIA nutricionista (se reemplaza por Kira con otro prompt)
- Heatmap de entrenamiento
- Smart weight progression
- Historial de entrenamientos

### Limpieza:
- Eliminar TODA referencia a "AOURA", "piper", "MiTienda" del código
- Eliminar TODO el código fitness (syncWorkout, syncRunSession, etc.)
- Reemplazar por "Ecomflex" en el repo y código interno
- El nombre visible al usuario final viene del theme.config.ts

---

## 11. PANEL DE CONTROL — Diseño de Interfaz

### `/panel/config` — Toggles de módulos

Panel visual con switches tipo on/off para cada módulo y sub-módulo.
- Los toggles se guardan en Google Sheets (tab "config") — **ÚNICA fuente de verdad**
- Se leen en runtime con cache de 5 minutos
- Los módulos apagados NO cargan código (Next.js dynamic imports + lazy loading)
- El dueño puede encender/apagar desde el panel sin tocar código
- Cada módulo padre tiene sub-toggles para control granular

### Módulos y sus toggles:

| Módulo | Default | Sub-toggles |
|---|---|---|
| E-commerce | ON (siempre) | — |
| Kira (Asistente IA) | ON | WhatsApp fallback |
| Email Marketing | ON | Welcome Series, Carrito Abandonado, Post-Compra, Winback, Newsletters |
| Redes Sociales | ON | Instagram, Twitter, TikTok |
| SEO PRO | ON | Blog, FAQ Schema, Breadcrumbs, AI Visibility |
| Google Ads Tracking | OFF | Tracking ID, Remarketing |
| Cupones | ON | — |
| Programa de Referidos | ON | — |
| Notificaciones Push | ON | — |
| Dashboard | ON (siempre) | — |
| Modo Catálogo | OFF | — |
| Powered by Ecomflex | ON | — |

---

## 12. DASHBOARD — Página principal del panel

### `/panel` — Vista general del negocio

#### Fila 1: KPIs principales (3 cards)
- **Ventas** — monto del día/semana/mes + variación %
- **Pedidos** — cantidad + nuevos hoy
- **Visitas** — total + variación % (fuente: Vercel Analytics API)

#### Fila 2: Resumen de Kira (card ancho completo)
- Resumen generado por GPT-4o-mini con acceso a todos los datos
- Incluye: ventas, producto más vendido, carritos abandonados, stock bajo, sugerencias
- Se cachea (no llama a OpenAI cada vez que se refresca)
- Se regenera 1 vez al día (8AM vía flujo n8n Kira Insights) o manualmente

#### Fila 3: Widgets (2 columnas)
- **Top Productos** — ranking de los más vendidos
- **Carritos Abandonados** — cantidad, recuperados, % de recuperación

#### Fila 4: Widgets (2 columnas)
- **Email Marketing** — enviados hoy, tasa apertura, nuevos suscriptores
- **Redes Sociales** — última publicación, views por plataforma

#### Comportamiento:
- Los widgets se ocultan si el módulo correspondiente está apagado
- Datos vienen de Google Sheets (tabs: pedidos, productos, suscriptores, metricas)
- Responsive: en mobile los widgets van en 1 columna

---

## 13. MARKETING — Email + Social + Cupones

### `/panel/marketing` — 3 tabs

#### Tab 1: Email Marketing
- Lista de suscriptores (nombre, email, fecha, estado)
- Historial de emails enviados con tasas de apertura
- Crear newsletter manual (editor simple + GPT genera copy)
- Ver carritos abandonados y estado de recuperación
- Configurar cupones para los emails

#### Tab 2: Redes Sociales
- Crear publicación nueva:
  1. Elegir producto o tema
  2. Kira genera copy con estructura ABIERTO → AUTORIDAD → SOLUCIÓN
  3. Elegir imagen (del catálogo o subir)
  4. Preview para IG/Twitter/TikTok
  5. Publicar ahora o programar
- Historial de publicaciones con métricas básicas
- Calendario de contenido visual

#### Tab 3: Cupones
- Crear cupón: código + % descuento + fecha vencimiento + usos máximos
- Ver cupones activos y cuántas veces se usaron
- Desactivar cupones
- Almacenamiento: Google Sheets (tab "cupones")

> **Nota:** Cupones se gestiona dentro de `/panel/marketing` (Tab 3) pero su API es independiente (`/api/cupones`) por escalabilidad.

---

## 14. KIRA EN EL PANEL

### `/panel/kira` — Cerebro del negocio

Kira en el panel NO es solo un chat. Es la interfaz inteligente del negocio:

#### Capacidades para el DUEÑO (panel):
- Dar resumen de ventas y métricas
- Generar contenido para redes (copies, ideas de reels)
- Sugerir acciones: reponer stock, lanzar cupón, enviar newsletter
- Responder preguntas sobre datos: "¿Cuál fue mi mejor día de ventas?"
- Redirigir a WhatsApp si el dueño prefiere hablar desde ahí

#### Capacidades para el COMPRADOR (tienda):
- Responder dudas sobre productos
- Recomendar productos basado en lo que está viendo
- Ayudar con el proceso de compra
- Ofrecer continuar por WhatsApp: "¿Preferís seguir por WhatsApp? [Abrir]"

#### Conexión con datos de Google Sheets:
- Kira tiene acceso a TODOS los datos:
  - Productos (nombre, precio, stock, categoría)
  - Pedidos (historial, estados, montos)
  - Reseñas (calificaciones, contenido)
  - Suscriptores (emails, fechas)
  - Métricas (ventas por día, carritos abandonados)
- Usa esta data proactivamente en sus respuestas

---

## 15. SEO PRO EN EL PANEL

### `/panel/seo` — Control de posicionamiento

- Estado actual del SEO (semáforo verde/amarillo/rojo por categoría)
- Checklist interactivo: Schema FAQ, BreadcrumbList, Blog, Core Web Vitals
- Editor de blog: crear artículos con ayuda de Kira (genera borrador, vos editás)
- Keyword map: qué keyword va en qué página (visualización desde Sheets tab `keywords`)
- Links directos a Google Search Console y PageSpeed Insights

---

## 16. GOOGLE SHEETS — Estructura de tabs

**IMPORTANTE:** Los tabs se dividen en DOS Google Sheets separadas por seguridad:
- **Sheet PÚBLICA** (el dueño puede ver/editar): `productos`, `blog`, `config`, `keywords`
- **Sheet PRIVADA** (solo acceso API): `usuarios`, `pedidos`, `resenas`, `suscriptores`, `cupones`, `referidos`, `carritos`, `cola`, `metricas`, `emails_log`, `social_log`

### Sheet PÚBLICA:

| Tab | Contenido | Usado por |
|---|---|---|
| `productos` | Catálogo completo (nombre, precio, stock, imagen, etc.) | Tienda + Panel |
| `blog` | Artículos del blog (título, contenido, slug, fecha, autor) | Blog SEO |
| `config` | Toggles de módulos (estado on/off) — ÚNICA fuente de verdad | Panel Config |
| `keywords` | Keyword map SEO (keyword, página destino, volumen, posición) | SEO Pro |

### Sheet PRIVADA:

| Tab | Contenido | Usado por |
|---|---|---|
| `usuarios` | Clientes registrados (email, nombre, hash password, role: admin/cliente) | Auth + Panel |
| `pedidos` | Historial de pedidos (cliente, items, monto, estado, fecha) | Panel + Kira |
| `resenas` | Reseñas de productos (rating, texto, foto URL, verificada) | Tienda + Panel |
| `suscriptores` | Lista de emails (popup/checkout). Columnas extra para push: endpoint, p256dh, auth | Email + Push |
| `cupones` | Cupones activos (código, descuento, vencimiento, usos max, usos actuales) | Checkout + Panel |
| `referidos` | Links de referidos y tracking (userId, code, referidos count, conversiones) | Referidos |
| `carritos` | Carritos abandonados (email, items JSON, timestamp, estado) | Email Marketing |
| `cola` | Eventos pendientes de procesar (tipo, datos, timestamp, estado: pendiente/procesado) | n8n Schedule |
| `metricas` | Datos agregados (ventas/día, carritos) — actualizado por flujo n8n Kira Insights | Dashboard + Kira |
| `emails_log` | Historial de emails enviados (tipo, destinatario, fecha, abierto) | Email Marketing |
| `social_log` | Historial de publicaciones en redes (plataforma, contenido, fecha, métricas) | Social Media |

---

## 17. VARIABLES DE ENTORNO

```env
# Google Sheets (Base de datos — DOS sheets)
GOOGLE_SHEETS_PUBLIC_ID=            # Sheet pública (productos, blog, config, keywords)
GOOGLE_SHEETS_PRIVATE_ID=           # Sheet privada (usuarios, pedidos, etc.)
GOOGLE_SHEETS_CLIENT_EMAIL=
GOOGLE_SHEETS_PRIVATE_KEY=

# NextAuth (Autenticación)
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# MercadoPago (Pagos)
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_PUBLIC_KEY=
MERCADOPAGO_WEBHOOK_SECRET=         # Para verificar firma de webhooks

# OpenAI (Kira - Asistente IA)
OPENAI_API_KEY=

# n8n (Flujos de automatización)
N8N_API_URL=
N8N_API_KEY=

# Email Marketing (Gmail via n8n)
GMAIL_SENDER_EMAIL=
GMAIL_SENDER_NAME=

# Redes Sociales
BLOTATO_API_KEY=                    # Instagram (publicación vía Blotato)
TWITTER_API_KEY=
TWITTER_API_SECRET=
TIKTOK_API_KEY=

# Google Ads (opcional)
GOOGLE_ADS_TRACKING_ID=

# Push Notifications (Web Push VAPID)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# WhatsApp (Evolution API via n8n)
WHATSAPP_NUMBER=

# Cloudflare R2 (almacenamiento de imágenes - reseñas con foto)
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=                     # ej: ecomflex
R2_PUBLIC_URL=                      # ej: https://pub-xxx.r2.dev

# Crypto (USDT - opcional)
CRYPTO_WALLET_ADDRESS=
CRYPTO_NETWORK=                     # ej: TRC20, BEP20

# Analytics (opcional)
VERCEL_ANALYTICS_ID=
```

---

## 18. MANIFIESTO PARA COMPRADORES DEL SERVICIO

### ¿Qué es Ecomflex?
Ecomflex es tu tienda online completa con marketing integrado, asistente de IA, y presencia en Google Play Store. Todo listo para vender desde el día 1.

### ¿Qué incluye?
1. **Tienda online profesional** — catálogo, carrito, checkout con MercadoPago
2. **App en Google Play** — tu tienda como app instalable en el celular
3. **Asistente IA (Kira)** — responde dudas de tus clientes 24/7 en la web y WhatsApp
4. **Email Marketing automático** — emails de bienvenida, recuperación de carritos, post-compra
5. **Publicación en redes** — publicá en Instagram, Twitter y TikTok desde un solo lugar
6. **SEO optimizado** — tu tienda aparece en Google y en las respuestas de ChatGPT
7. **Dashboard de métricas** — sabé cuánto vendiste, qué se vende más, qué mejorar
8. **Cupones y referidos** — herramientas para atraer y retener clientes
9. **Notificaciones push** — avisale a tus clientes de novedades directo al celular
10. **Modo oscuro/claro** — diseño moderno y profesional
11. **Modo catálogo** — ideal para negocios de servicios que solo quieren mostrar productos
12. **Tracking de Google Ads** — conectá tus campañas de publicidad y medí resultados
13. **100% personalizable** — colores, tipografía, logo, todo se adapta a tu marca

### ¿Qué necesita el cliente?
- Productos para vender (fotos + descripciones + precios)
- Cuenta de MercadoPago
- Logo de su marca
- Cuenta de Google (para autenticación)
- Opcional: cuentas de Instagram, Twitter, TikTok

### ¿Qué NO necesita el cliente?
- Saber programar
- Hosting propio
- Diseñador web
- Community manager (Kira + el sistema lo hace)

### ¿Cómo se gestiona?
- Los productos se editan desde una planilla de Google Sheets (como Excel)
- El marketing se gestiona desde el panel admin de la tienda
- Kira te avisa si algo necesita atención

---

## 19. AUDITORÍA TÉCNICA — HALLAZGOS APLICADOS

Auditoría realizada 2026-04-11: 8 rondas, 90+ hallazgos resueltos.
**Todas las correcciones ya están incorporadas en las secciones anteriores.**

### Resumen de lo corregido en esta versión (v2):

| Categoría | Correcciones aplicadas |
|---|---|
| Sheets | Separación en 2 Sheets (pública/privada). Tabs faltantes agregados: cola, carritos, keywords |
| Config | Una sola fuente de verdad: toggles SOLO en Sheets, theme.config.ts SOLO visual |
| Seguridad | Roles admin/cliente, webhook MercadoPago con firma, CSRF, panel protegido |
| n8n | Cola en Sheets en vez de Wait nodes. Flujos faltantes agregados: sunset, backup. Total: 13 |
| API | Endpoints definidos para todos los módulos (4.1-4.11) |
| Código | lib/sheets/ modularizado, Zod, try/catch, constantes de columnas, funciones centralizadas |
| Performance | Streaming Kira, 2 fuentes (no 8), Server Component en detalle producto, debounce búsqueda |
| TWA | Digital Asset Links (assetlinks.json) documentado |
| Módulos | 4.9 expandido (modo catálogo técnico), 4.11 creado (Google Ads), 4.8 expandido (push técnico) |
| Variables | 2 Sheet IDs, MERCADOPAGO_WEBHOOK_SECRET, CRYPTO_*, VERCEL_ANALYTICS_ID |
| Stock | Flujo completo: validar→decrementar→alertar. Botón "Agotado" |
| Legal | Botón arrepentimiento (Res. 424/2020), Términos, Privacidad. 3 páginas |
| Errores | Degradación graceful: alternativas cuando falla cada servicio |
| Cache | ISR en vez de in-memory (serverless no comparte memoria). Quota 300 req/min |
| Auth | bcrypt ≥ 10 rounds, roles admin/cliente, middleware por rol |
| Imágenes | URLs externas + Cloudflare R2 para reseñas. Next.js Image con remotePatterns |
| Idempotencia | Webhook MP verifica payment_id único. Responde 200 inmediato, procesa async |
| Reembolsos | POST /api/pedidos/[orderId]/refund vía MercadoPago Refund API |
| Redes sociales | TikTok requiere aprobación previa. Blotato a verificar. Documentado |
| Escalabilidad | Límites documentados: Sheets 300 req/min, Gmail 500/día, Vercel 100GB |

### Hallazgos pendientes de la auditoría de código (resolver durante implementación):

**P1 — Código existente a refactorizar:**
- google-sheets.ts monolito → dividir en lib/sheets/*
- Copy-paste masivo en funciones de lectura/escritura → helpers genéricos
- Índices mágicos (row[0], row[8]) → constantes
- Descuento transferencia hardcodeado 0.9 → centralizar
- ShareButton duplicado 3x en ProductCard
- Checkbox duplicado en FilterSidebar → componente CheckboxGroup
- Header.tsx 264 líneas → extraer SearchOverlay

**P2 — Optimizaciones:**
- CSP headers en next.config.js
- SVGs duplicados → componente de iconos
- useMemo en AssistantContext y CartContext values
- Limitar mensajes Kira a 50 en memoria
- Service Worker cache max 100 entries
- ReviewsProvider solo en páginas que lo usan
- Paralelizar llamadas en isVerifiedBuyer
- sharp mover a dependencies
- Eliminar @types/google.maps
- Rate limiting compatible con serverless

---

## 20. FASES DE IMPLEMENTACIÓN

### FASE 0: Limpieza y Fundamentos (1-2 semanas)
**Objetivo:** Base sólida sin deuda técnica

- [ ] Eliminar TODO el código fitness/AOURA/MiTienda
- [ ] Rebranding completo a Ecomflex
- [ ] Dividir google-sheets.ts en lib/sheets/* (módulos)
- [ ] Crear helpers genéricos: appendRow(), getRows(), findRow()
- [ ] Agregar try/catch + retry exponencial a TODAS las funciones de Sheets
- [ ] Agregar validación con Zod en cada función pública
- [ ] Crear constantes para índices de columnas por hoja
- [ ] Proteger /panel/* con middleware + sistema de roles (admin/cliente)
- [ ] Separar Sheets en pública + privada (2 SPREADSHEET_IDs)
- [ ] Cargar solo 2 fuentes (las configuradas en theme.config)
- [ ] Convertir detalle producto a Server Component (SSR para SEO)
- [ ] Implementar streaming para Kira (OpenAI stream: true)
- [ ] Centralizar constantes (calcSubtotal, calcEnvio, calcTransferPrice)
- [ ] Extraer SearchOverlay de Header.tsx
- [ ] Componente de iconos compartido (no SVGs duplicados)
- [ ] useMemo en values de todos los Context Providers
- [ ] Mover sharp a dependencies, eliminar @types/google.maps
- [ ] Agregar CSRF protection en formularios custom
- [ ] Rate limiting compatible con serverless
- [ ] Extraer ShareButton como componente compartido (duplicado 3x en ProductCard)
- [ ] Crear componente CheckboxGroup para FilterSidebar
- [ ] Implementar ISR (revalidate) en vez de cache in-memory para productos
- [ ] Crear .env.example actualizado con TODAS las variables
- [ ] Crear página /politica-privacidad
- [ ] Crear página /terminos (términos y condiciones)
- [ ] Crear página /arrepentimiento (botón de arrepentimiento, Res. 424/2020)
- [ ] Implementar error boundaries con mensajes amigables (sección 23)
- [ ] Configurar Next.js Image con remotePatterns para CDNs de imágenes
- [ ] Especificar bcrypt salt rounds ≥ 10 en auth.ts

### FASE 1: MVP Vendible (2-3 semanas)
**Objetivo:** Tienda funcional con panel admin básico

- [ ] Panel admin con dashboard básico (KPIs + Kira resumen)
- [ ] Kira conectada a todos los datos de Sheets
- [ ] Sistema de cupones (crear, validar, listar)
- [ ] Reseñas con fotos + badge "Compra verificada"
- [ ] Webhook MercadoPago IDEMPOTENTE (verificar firma + payment_id único)
- [ ] updateOrderStatus() con ciclo de vida completo (creado→pagado→enviado→entregado→reembolsado)
- [ ] POST /api/pedidos/[orderId]/refund para reembolsos
- [ ] Gestión de stock: validar al agregar, decrementar al pagar, alerta stock bajo
- [ ] Email como primer campo del checkout (capturar antes de abandono)
- [ ] Tab "Carritos" para detección de abandonados
- [ ] Popup de captación de emails
- [ ] Panel de toggles (config) con persistencia en Sheets
- [ ] TWA con Bubblewrap + assetlinks.json
- [ ] Debounce 300ms en búsqueda de productos
- [ ] Limitar mensajes Kira a 50 en memoria
- [ ] Service Worker cache limitado a 100 entries

### FASE 2: Marketing (2-3 semanas)
**Objetivo:** Email marketing + SEO + Blog

- [ ] Tab "Cola" en Sheets para eventos de email
- [ ] Flujo n8n: Ecomflex Email Queue Processor (cada hora)
- [ ] Clonar flujo Icebreaker → Ecomflex Welcome Series
- [ ] Email Marketing: Welcome Series, Carrito Abandonado, Post-Compra
- [ ] Flujo n8n: Ecomflex Newsletter
- [ ] Configurar winback dentro del Email Queue Processor (tipo: winback, 60+ días sin compra)
- [ ] Flujo n8n: Ecomflex Sunset Cleanup (suscriptores inactivos 90+ días)
- [ ] Blog con topic clusters (/blog/[slug])
- [ ] Schema FAQ + Schema BreadcrumbList
- [ ] SEO panel con checklist y editor de blog
- [ ] Tab "keywords" en Sheets para keyword map
- [ ] Backup semanal de Sheets via n8n (flujo Ecomflex Sheets Backup)
- [ ] CSP headers en next.config.js

### FASE 3: Growth (2-3 semanas)
**Objetivo:** Redes sociales + referidos + notificaciones

- [ ] Clonar flujos n8n: Content Machine + Reels Machine
- [ ] Social Media Manager (publicar en IG/Twitter/TikTok desde panel)
- [ ] Programa de referidos
- [ ] Notificaciones push (Web Push API + VAPID)
- [ ] Google Ads tracking (conversiones + remarketing)
- [ ] Modo catálogo (toggle)
- [ ] Dashboard avanzado con gráficos
- [ ] Kira Insights diarios vía Telegram (flujo n8n)
- [ ] Submit a Google Play Store

---

## 21. ESTRATEGIA DE CACHE (Vercel Serverless)

> **Problema:** Vercel serverless NO comparte memoria entre funciones. Cache in-memory es inútil bajo carga. Google Sheets tiene límite de 300 req/min por proyecto.

### Estrategia por tipo de dato:

| Dato | Estrategia | TTL | Motivo |
|---|---|---|---|
| Productos | ISR (Next.js `revalidate: 300`) | 5 min | Cambian poco, alto tráfico de lectura |
| Detalle producto | Server Component + ISR | 5 min | SEO crítico, debe ser SSR |
| Pedido por ID | HTTP Cache headers (`Cache-Control: private, max-age=30`) | 30 seg | Solo el dueño del pedido lo consulta |
| Config/toggles | ISR o `unstable_cache` de Next.js | 5 min | Cambian rara vez |
| Reseñas | ISR | 5 min | Cambian poco después de publicadas |
| Blog | ISR con `revalidate: 3600` | 1 hora | Contenido estático |

### NO usar cache in-memory para:
- Pedidos (cada serverless instance tiene su propia memoria)
- Usuarios (idem)
- Cualquier dato que necesite consistencia inmediata

### Revalidación on-demand:
- Cuando el admin actualiza productos desde el panel → llamar `revalidatePath('/productos')`
- Cuando se confirma un pago → revalidar la página de tracking
- Cuando se publica un artículo → revalidar `/blog`

### Google Sheets API quota (300 req/min):
- Con ISR, Next.js cachea las páginas y solo llama a Sheets cuando expira el TTL
- Bajo carga normal (100 usuarios): ~10-20 req/min a Sheets (lejos del límite)
- Bajo carga alta (1000+ usuarios): el ISR protege — Sheets solo se llama cada 5 min por ruta
- Si se supera la quota: retry con backoff exponencial (ya definido en sección 8)

---

## 22. LEGAL Y COMPLIANCE (Argentina)

### Obligatorio por ley:

1. **Botón de arrepentimiento** (Resolución 424/2020, Defensa del Consumidor)
   - OBLIGATORIO para todo e-commerce en Argentina
   - Debe ser visible y de fácil acceso en todas las páginas
   - Permite al comprador cancelar la compra dentro de 10 días corridos
   - Implementar como botón fijo o link en footer + página `/arrepentimiento`

2. **Política de privacidad** (`/politica-privacidad`)
   - Ya incluida en sección 7 (requerida por Play Store)
   - Debe cumplir con Ley 25.326 de Protección de Datos Personales
   - Declarar: qué datos se recopilan, para qué, cómo se protegen, derechos del usuario

3. **Términos y condiciones** (`/terminos`)
   - Política de devolución (10 días, Ley 24.240)
   - Medios de pago aceptados
   - Tiempos de envío estimados
   - Datos del vendedor (nombre/razón social, domicilio, CUIT si aplica)

4. **Facturación**
   - Emitir factura/ticket por cada venta (cuando Pablo tenga monotributo)
   - Flujo n8n de facturación AFIP ya existe como base (`8puVz37xbS6MVNkU`)

### Páginas legales a crear:
- `/politica-privacidad` — Política de privacidad
- `/terminos` — Términos y condiciones de compra
- `/arrepentimiento` — Formulario de arrepentimiento (botón de arrepentimiento)

### Cookie consent:
- Argentina no tiene ley específica de cookies (como GDPR europeo)
- Pero si se vende a clientes internacionales, incluir banner de cookies configurable (toggle on/off)

---

## 23. MANEJO DE ERRORES (UX)

### Qué ve el usuario cuando algo falla:

| Servicio caído | Lo que ve el usuario | Lo que pasa internamente |
|---|---|---|
| Google Sheets | Página cargada desde ISR cache (datos de hasta 5 min atrás) | Retry con backoff. Si persiste, mostrar banner: "Algunos datos pueden no estar actualizados" |
| OpenAI (Kira) | "Kira no está disponible en este momento. ¿Querés contactarnos por WhatsApp?" con link directo | Log del error. Kira se desactiva temporalmente. |
| MercadoPago | "El servicio de pagos no está disponible. Podés pagar por transferencia." con datos bancarios | Ocultar botón MercadoPago, mostrar solo transferencia/crypto |
| n8n | Los emails de cola no se envían hasta que n8n vuelva. La tienda sigue funcionando. | La cola en Sheets persiste. Cuando n8n vuelve, procesa todo lo pendiente. |
| Vercel | Error 500 estándar de Vercel | Service Worker muestra versión cacheada si existe |

### Principios de error handling:
- **Nunca mostrar errores técnicos** al comprador (no stack traces, no "500 Internal Server Error")
- **Siempre ofrecer alternativa:** si MercadoPago falla → transferencia. Si Kira falla → WhatsApp.
- **Degradación graceful:** la tienda debe funcionar (mostrar productos, permitir navegar) aunque fallen servicios secundarios
- **Alertar al admin:** errores críticos notifican vía Telegram (flujo n8n o log)

---

## 24. AUTENTICACIÓN Y ROLES

### Proveedores de auth:
- **Google OAuth** (recomendado, más seguro, sin passwords en Sheets)
- **Email/password** con bcrypt (salt rounds ≥ 10)
- **No se implementa** recuperación de password (complejidad alta, bajo valor). Si el usuario olvida su password → usar Google OAuth o contactar soporte.

### Roles:
| Rol | Acceso | Cómo se asigna |
|---|---|---|
| `cliente` | Tienda, checkout, tracking, cuenta, reseñas | Automático al registrarse |
| `admin` | Todo lo anterior + `/panel/*` completo | Manual en Sheet (columna `role`) |

### Flujo de registro:
1. Usuario elige Google OAuth o email/password
2. Se valida email (formato + no duplicado)
3. Si email/password: se hashea con bcrypt y se guarda en Sheet PRIVADA
4. Se asigna role `cliente` por defecto
5. Se redirige a la tienda

### Middleware:
```
/checkout/*    → requiere auth (cualquier rol)
/cuenta/*      → requiere auth (cualquier rol)
/tracking/*    → requiere auth (cualquier rol)
/panel/*       → requiere auth + role === "admin"
```

---

## 25. IMÁGENES Y ARCHIVOS

### Productos:
- Las imágenes de producto se almacenan como **URLs externas** en la columna `imagen_url` de la Sheet
- Fuentes válidas: Cloudflare R2 (ya usado en AOURA), URLs de MercadoLibre, cualquier CDN
- Next.js `<Image>` con `remotePatterns` configurados para todos los dominios
- Formatos: WebP preferido, fallback a JPG/PNG
- Tamaños responsivos con `sizes` prop para no descargar imágenes enormes en mobile

### Reseñas con fotos:
- El comprador sube foto desde el formulario de reseña
- Se almacena en Cloudflare R2 (bucket existente `aoura-fitness`, renombrar a `ecomflex`)
- Se guarda la URL en la columna `foto_url` del tab `resenas`
- Límite: 1 foto por reseña, máximo 2MB, JPG/PNG/WebP

### Imágenes del blog:
- Misma estrategia que productos: URLs externas en la Sheet
- El editor de blog en el panel permite pegar URL de imagen

---

## 26. LÍMITES Y ESCALABILIDAD

### Google Sheets:
| Recurso | Límite | Impacto | Mitigación |
|---|---|---|---|
| API requests | 300/min por proyecto | Tienda con mucho tráfico | ISR + revalidación on-demand |
| Celdas por Sheet | 10 millones | ~2-3 años de datos con rotación | Rotación mensual de logs (emails_log, social_log) |
| Filas por tab | 10 millones | Más que suficiente | Archivar pedidos viejos anualmente |
| Tamaño de celda | 50,000 caracteres | Items JSON en carritos | Limitar a 20 items por carrito |

### Gmail (envío de emails):
| Tipo de cuenta | Límite diario | Cuándo migrar |
|---|---|---|
| Gmail normal | 500 emails/día | Cuando un cliente envíe +400/día |
| Google Workspace | 2,000 emails/día | Siguiente paso si crece |
| SendGrid/Resend | 100-3,000/día (free) | Plan B si Gmail no alcanza |

### Vercel:
| Recurso | Free tier | Cuándo upgrade |
|---|---|---|
| Bandwidth | 100 GB/mes | Si imágenes de productos son pesadas |
| Serverless executions | 100K/mes | Si tráfico supera ~3,000 visitas/día |
| Image optimizations | 1,000/mes | Servir imágenes desde CDN propio (R2) |
| ISR revalidations | Sin límite | — |

### n8n (VPS 764MB):
- Máximo 6-7 flujos activos simultáneamente
- `--max-old-space-size=512`
- NO usar Wait nodes (usar cola en Sheets)
- Monitor de RAM: flujo que alerte por Telegram si RAM > 80%

### Concurrencia en Sheets:
- Google Sheets NO tiene locks — escrituras concurrentes pueden colisionar
- Mitigación: usar IDs únicos (crypto.randomUUID()), escrituras idempotentes
- Para operaciones críticas (decrementar stock): serializar vía endpoint único que procese secuencialmente
- A futuro si escala: migrar pedidos/usuarios a Supabase (PostgreSQL, gratis hasta 50K filas)

---

## 27. APROBACIÓN

- [ ] Visión del producto (Sección 1)
- [ ] Decisiones técnicas (Sección 2)
- [ ] Arquitectura general (Sección 3)
- [ ] Módulos del sistema (Sección 4, incluyendo 4.1-4.11)
- [ ] Panel de toggles (Secciones 5 y 11)
- [ ] Theme config visual (Sección 6)
- [ ] TWA / Play Store (Sección 7)
- [ ] Calidad de código (Sección 8)
- [ ] Flujos n8n (Sección 9)
- [ ] Migración desde AOURA (Sección 10)
- [ ] Dashboard (Sección 12)
- [ ] Marketing (Sección 13)
- [ ] Kira en el panel (Sección 14)
- [ ] SEO Pro en el panel (Sección 15)
- [ ] Estructura Google Sheets (Sección 16)
- [ ] Variables de entorno (Sección 17)
- [ ] Manifiesto para compradores (Sección 18)
- [ ] Auditoría aplicada (Sección 19)
- [ ] Fases de implementación (Sección 20)
- [ ] Estrategia de cache (Sección 21)
- [ ] Legal y compliance (Sección 22)
- [ ] Manejo de errores UX (Sección 23)
- [ ] Autenticación y roles (Sección 24)
- [ ] Imágenes y archivos (Sección 25)
- [ ] Límites y escalabilidad (Sección 26)
