# Ecomflex Phase 2: Marketing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Every task executed by implementer agent + audited by spec reviewer + code quality reviewer before commit.

**Goal:** Activar el motor de marketing de Ecomflex: email marketing automatizado (welcome, carrito abandonado, post-compra, newsletter), SEO pro (blog, schemas, keyword map), y los flujos n8n que procesan la cola de eventos. Al terminar, la tienda puede captar, convertir y retener clientes sin intervencion manual.

**Architecture:** El patron central es "cola en Sheets": la app escribe eventos en el tab `Cola` y n8n los procesa cada hora (sin Wait nodes — resiliente a reinicios). Los modulos de email, newsletter, sunset cleanup y backup se construyen sobre este patron. El blog se agrega como Server Components con markdown simple (contenido en Sheets) para SEO maximo.

**Tech Stack:** Next.js 14, TypeScript, Google Sheets, Gmail (via n8n), OpenAI (copies), `marked` para blog, Schema.org JSON-LD.

**Spec de referencia:** `docs/superpowers/specs/2026-04-11-ecomflex-design.md` — Secciones 4.3 (Email Marketing), 4.5 (SEO PRO), 9 (Flujos n8n), 20 FASE 2

**Prerequisito:** Phase 0 + Phase 1 completadas. El repo tiene: lib/sheets/* modularizado, panel admin funcional, webhook MP idempotente, cupones integrados, carritos abandonados persistidos.

---

## File Structure

### Crear (modulos de datos):
- `lib/sheets/queue.ts` — Enqueue eventos a tab Cola, consumo via n8n
- `lib/sheets/subscribers.ts` — CRUD de suscriptores email
- `lib/sheets/blog.ts` — CRUD de posts de blog
- `lib/sheets/keywords.ts` — CRUD de keyword map para SEO
- `lib/sheets/emails-log.ts` — Historial de emails enviados (para metricas)

### Crear (API routes):
- `app/api/email/unsubscribe/route.ts` — POST para desuscripcion
- `app/api/email/stats/route.ts` — GET metricas de email (admin)
- `app/api/blog/route.ts` — GET listar posts + POST crear (admin)
- `app/api/blog/[slug]/route.ts` — GET post individual + PUT editar (admin)
- `app/api/newsletter/route.ts` — POST encolar newsletter (admin)

### Crear (paginas publicas):
- `app/(tienda)/blog/page.tsx` — Lista de articulos
- `app/(tienda)/blog/[slug]/page.tsx` — Articulo individual con schema
- `app/(tienda)/unsubscribe/page.tsx` — Confirmacion de desuscripcion

### Crear (paginas panel):
- `app/panel/seo/page.tsx` — Dashboard SEO con checklist + editor blog
- `app/panel/seo/blog/nuevo/page.tsx` — Crear articulo
- `app/panel/seo/blog/[slug]/page.tsx` — Editar articulo existente
- `app/panel/marketing/page.tsx` — Email marketing + newsletter manual

### Crear (componentes):
- `components/seo/BreadcrumbSchema.tsx` — Schema BreadcrumbList
- `components/seo/FaqSchema.tsx` — Schema FAQ para productos
- `components/seo/BlogPostSchema.tsx` — Schema Article
- `components/blog/BlogCard.tsx` — Card de articulo en lista
- `components/blog/BlogGrid.tsx` — Grid de posts
- `components/blog/MarkdownContent.tsx` — Renderiza markdown con estilos
- `components/panel/BlogEditor.tsx` — Editor con preview
- `components/panel/NewsletterForm.tsx` — Crear newsletter manual
- `components/panel/SeoChecklist.tsx` — Estado del SEO
- `components/panel/SubscribersTable.tsx` — Lista de suscriptores

### Modificar:
- `lib/sheets/constants.ts` — Agregar tabs Suscriptores, Blog, Keywords, EmailsLog
- `types/index.ts` — Agregar Subscriber, BlogPost, Keyword, EmailLog, QueueEvent
- `app/api/email/subscribe/route.ts` — Usar addSubscriber() + encolar welcome
- `app/api/checkout/route.ts` — Encolar post_purchase tras crear orden
- `app/api/checkout/transferencia/route.ts` — Idem
- `app/api/webhooks/mercadopago/route.ts` — Encolar post_purchase al marcar pagado
- `app/api/carritos/abandoned/route.ts` — Encolar secuencia abandoned_cart
- `app/sitemap.ts` — Incluir rutas de blog
- `public/robots.txt` o crear `app/robots.ts` — Permitir bots de LLMs
- `app/panel/layout.tsx` — Links a SEO y Marketing en nav

---

## Task 1: Tipos Phase 2 + constantes

**Files:**
- Modify: `types/index.ts` (agregar tipos al final)
- Modify: `lib/sheets/constants.ts` (agregar tabs)

- [ ] **Step 1: Agregar tipos**

Contenido a agregar al final de `types/index.ts`:

```typescript
// === PHASE 2: MARKETING ===

export interface Subscriber {
  id: string;
  email: string;
  fecha: string;
  source: string;
  estado: "activo" | "inactivo" | "rebote";
  ultima_actividad?: string;
}

export interface BlogPost {
  slug: string;
  titulo: string;
  descripcion: string;
  contenido: string;
  categoria: string;
  autor: string;
  fecha: string;
  imagen_url?: string;
  keywords: string[];
  publicado: boolean;
  tiempo_lectura?: number;
}

export interface Keyword {
  keyword: string;
  pagina_destino: string;
  volumen_estimado?: number;
  posicion?: number;
  intencion: "informacional" | "comercial" | "transaccional" | "navegacional";
}

export interface EmailLog {
  id: string;
  tipo: string;
  destinatario: string;
  asunto: string;
  fecha_envio: string;
  abierto?: boolean;
  fecha_apertura?: string;
  error?: string;
}

export type QueueEventType =
  | "welcome_series_start"
  | "abandoned_cart_1h"
  | "abandoned_cart_24h"
  | "abandoned_cart_48h"
  | "post_purchase_confirmation"
  | "post_purchase_tips"
  | "post_purchase_review_request"
  | "post_purchase_cross_sell"
  | "winback_60d"
  | "newsletter_send"
  | "sunset_cleanup";

export interface QueueEvent {
  id: string;
  tipo: QueueEventType;
  datos: Record<string, unknown>;
  timestamp: string;
  estado: "pendiente" | "procesado" | "fallido";
  intentos: number;
}
```

- [ ] **Step 2: Agregar tabs a constants.ts**

Agregar a `RANGES`:
```typescript
SUSCRIPTORES: "Suscriptores!A2:F",
BLOG: "Blog!A2:J",
KEYWORDS: "Keywords!A2:E",
EMAILS_LOG: "EmailsLog!A2:I",
```

Agregar a `COL`:
```typescript
SUSCRIPTOR: {
  ID: 0,
  EMAIL: 1,
  FECHA: 2,
  SOURCE: 3,
  ESTADO: 4,
  ULTIMA_ACTIVIDAD: 5,
},
BLOG_POST: {
  SLUG: 0,
  TITULO: 1,
  DESCRIPCION: 2,
  CONTENIDO: 3,
  CATEGORIA: 4,
  AUTOR: 5,
  FECHA: 6,
  IMAGEN_URL: 7,
  KEYWORDS: 8,
  PUBLICADO: 9,
},
KEYWORD: {
  KEYWORD: 0,
  PAGINA_DESTINO: 1,
  VOLUMEN: 2,
  POSICION: 3,
  INTENCION: 4,
},
EMAIL_LOG: {
  ID: 0,
  TIPO: 1,
  DESTINATARIO: 2,
  ASUNTO: 3,
  FECHA_ENVIO: 4,
  ABIERTO: 5,
  FECHA_APERTURA: 6,
  ERROR: 7,
},
```

- [ ] **Step 3: Type-check + commit**

```bash
cd C:\Users\Usuario\Desktop\ecommerce-template
npm run type-check
git add types/index.ts lib/sheets/constants.ts
git commit -m "feat: tipos Phase 2 (Subscriber, BlogPost, Keyword, EmailLog, QueueEvent) + constantes"
```

---

## Task 2: Modulo lib/sheets/queue.ts

**File:** Create `lib/sheets/queue.ts`

Crear modulo con funciones:
- `enqueue(tipo, datos)` — agrega evento al tab Cola con crypto.randomUUID() y estado "pendiente"
- `getPendingEvents()` — lee eventos con estado "pendiente" (usado por n8n via API si necesario)
- `markEventProcessed(eventId)` — actualiza estado a "procesado"
- `markEventFailed(eventId, error?)` — incrementa intentos; si >= 3 marca "fallido" permanente, si no "pendiente"

Seguir el patron existente: imports de `./helpers`, `./client`, `./constants`. Usar `colLetter(COL.COLA_EVENTO.ESTADO)` para updates. mapRowToEvent parsea `datos` como JSON con try/catch.

- [ ] **Step 1: Crear archivo**
- [ ] **Step 2: Type-check**
- [ ] **Step 3: Commit**

```bash
git add lib/sheets/queue.ts
git commit -m "feat: modulo queue.ts para encolar eventos async procesados por n8n"
```

---

## Task 3: Modulo lib/sheets/subscribers.ts

**File:** Create `lib/sheets/subscribers.ts`

Funciones:
- `mapRowToSubscriber(row)` — privado
- `getAllSubscribers()` — todos
- `getSubscriberByEmail(email)` — busqueda
- `addSubscriber(email, source)` — **idempotente**: si existe y estado != activo, lo reactiva; si no existe, crea con crypto.randomUUID(). Retorna el subscriber.
- `updateSubscriberStatus(email, estado)`
- `countActiveSubscribers()` — para metrics
- `getInactiveSubscribers(daysInactive)` — filtra por ultima_actividad o fecha < threshold, para sunset cleanup

Seguir patron de coupons.ts / carts.ts.

- [ ] **Step 1: Crear archivo**
- [ ] **Step 2: Type-check**
- [ ] **Step 3: Commit**

```bash
git add lib/sheets/subscribers.ts
git commit -m "feat: modulo subscribers.ts (CRUD idempotente + sunset filter)"
```

---

## Task 4: Modulos blog.ts + keywords.ts + emails-log.ts

**Files:**
- Create: `lib/sheets/blog.ts`
- Create: `lib/sheets/keywords.ts`
- Create: `lib/sheets/emails-log.ts`

### blog.ts funciones:
- `mapRowToBlogPost(row)` — privado, calcula `tiempo_lectura` con 200 palabras/min
- `estimateReadingTime(text)` — helper
- `getAllBlogPosts()` — todos incluidos borradores
- `getPublishedBlogPosts()` — solo publicados, ordenados por fecha desc
- `getBlogPostBySlug(slug)`
- `createBlogPost(post)` — verifica que no exista; usa `serializeSheetBool` para `publicado`
- `updateBlogPost(slug, updates)` — actualiza solo los campos provistos usando updateCell + colLetter

Usar `parseSheetBool`/`serializeSheetBool` para el campo `publicado`.

### keywords.ts funciones:
- `mapRowToKeyword(row)` — privado
- `getAllKeywords()`
- `addKeyword(keyword)` — append simple

### emails-log.ts funciones:
- `mapRowToLog(row)` — privado
- `logEmailSent(tipo, destinatario, asunto, error?)` — append, retorna ID
- `markEmailOpened(logId)` — actualiza columnas abierto y fecha_apertura
- `getEmailStats()` — retorna `{ enviados_hoy, enviados_semana, tasa_apertura_pct, total_enviados }`. Usar `startOfDayArgentina`.

- [ ] **Step 1: Crear los 3 archivos**
- [ ] **Step 2: Type-check**
- [ ] **Step 3: Commit**

```bash
git add lib/sheets/blog.ts lib/sheets/keywords.ts lib/sheets/emails-log.ts
git commit -m "feat: modulos blog.ts, keywords.ts, emails-log.ts"
```

---

## Task 5: Instalar dependencia marked

- [ ] **Step 1: Install**

```bash
cd C:\Users\Usuario\Desktop\ecommerce-template
npm install marked
```

`marked` ya trae tipos TypeScript. Es ligero (~30kb), cero dependencias.

- [ ] **Step 2: Type-check + commit**

```bash
npm run type-check
git add package.json package-lock.json
git commit -m "deps: agregar marked para rendering de markdown en blog"
```

---

## Task 6: Encolar eventos desde endpoints existentes

**Files modified:**
- `app/api/email/subscribe/route.ts` — usar `addSubscriber()` y encolar `welcome_series_start` si es nuevo
- `app/api/checkout/route.ts` — encolar `post_purchase_confirmation` tras createOrder
- `app/api/checkout/transferencia/route.ts` — idem
- `app/api/webhooks/mercadopago/route.ts` — encolar `post_purchase_tips`, `post_purchase_review_request`, `post_purchase_cross_sell` al confirmar pago
- `app/api/carritos/abandoned/route.ts` — encolar los 3 eventos `abandoned_cart_*` con `scheduledFor` en `datos` (now + 1h/24h/48h)

### Detalles:

**subscribe:** Reemplazar el appendRow directo por `addSubscriber(email, source)`. Detectar si el subscriber es nuevo comparando fecha con now (delta < 5000ms = nuevo). Si es nuevo, `enqueue("welcome_series_start", { email, subscriberId })`.

**webhook MP (processPayment):** Despues de `updateOrderStatus(externalReference, "pagado")` y del `decrementStock`, encolar los 3 eventos post-compra con `{ orderId, email }` como datos. No fallar si el enqueue falla — loggear.

**carritos abandoned:** Despues de `saveAbandonedCart`, si el email es truthy, encolar 3 eventos con `scheduledFor` ISO en el payload. n8n filtrara por `scheduledFor <= now`.

Leer cada archivo primero para entender la estructura exacta.

- [ ] **Step 1-5: Modificar los 5 archivos**
- [ ] **Step 6: Type-check + build**
- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: encolar eventos welcome, post-compra y carrito abandonado"
```

---

## Task 7: Pagina publica /blog (lista)

**Files:**
- Create: `app/(tienda)/blog/page.tsx`
- Create: `components/blog/BlogCard.tsx`
- Create: `components/blog/BlogGrid.tsx`

### BlogCard
Link a `/blog/[slug]`. Muestra imagen si existe, categoria, tiempo_lectura, titulo, descripcion (line-clamp-2), fecha formateada en es-AR. Estilos con CSS variables del tema.

### BlogGrid
Recibe `posts: BlogPost[]`. Grid responsive (1 col mobile, 2 tablet, 3 desktop). Mensaje "Todavia no hay articulos publicados" si vacio.

### /blog/page.tsx
Server component. `export const revalidate = 600`. Usa `getPublishedBlogPosts()`. Metadata con titulo y descripcion del brand. Header con h1 "Blog" + subtitulo + `<BlogGrid posts={posts} />`.

- [ ] **Step 1: Crear BlogCard**
- [ ] **Step 2: Crear BlogGrid**
- [ ] **Step 3: Crear blog/page.tsx**
- [ ] **Step 4: Build + type-check**
- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: pagina /blog publica con lista de articulos"
```

---

## Task 8: Pagina /blog/[slug] con markdown + schemas

**Files:**
- Create: `app/(tienda)/blog/[slug]/page.tsx`
- Create: `components/blog/MarkdownContent.tsx`
- Create: `components/seo/BlogPostSchema.tsx`
- Create: `components/seo/BreadcrumbSchema.tsx`
- Modify: `app/globals.css` (agregar estilos .prose-content)

### MarkdownContent
Client component que usa `marked.parse(markdown, { async: false })` y renderiza el HTML resultante. Configurar marked con `gfm: true, breaks: false`. El HTML se inyecta con dangerouslySetInnerHTML dentro de un div con className "prose-content" para aplicar estilos tipograficos.

**Seguridad:** el contenido markdown viene del admin (rol verificado), NO de usuarios anonimos. marked es seguro por default (no ejecuta HTML embebido como script tags). Aceptable para este caso de uso.

### BlogPostSchema
JSON-LD Article con headline, description, image, datePublished, author, publisher, mainEntityOfPage, keywords. Se injecta con script type="application/ld+json". El contenido lo genera el componente desde props (no es input de usuario que pase al DOM ejecutable).

### BreadcrumbSchema
JSON-LD BreadcrumbList con items como `ListItem`. Recibe `items: { name, url }[]`.

### /blog/[slug]/page.tsx
Server component con:
- `generateStaticParams()` — lista slugs publicados
- `generateMetadata()` — titulo, descripcion, openGraph con type: article
- `getBlogPostBySlug`, `notFound` si no existe o no publicado
- Renderiza `<BlogPostSchema post={post} />` + `<BreadcrumbSchema items={...} />` + article con titulo, metadata (categoria, tiempo_lectura, fecha), imagen destacada si existe, `<MarkdownContent markdown={post.contenido} />`, autor al final
- `export const revalidate = 600`

### globals.css
Agregar estilos .prose-content para h1-h3, p, a, ul/ol/li, code, pre, blockquote, img. Usar CSS variables del tema.

- [ ] **Step 1: Crear MarkdownContent**
- [ ] **Step 2: Agregar estilos a globals.css**
- [ ] **Step 3: Crear BlogPostSchema**
- [ ] **Step 4: Crear BreadcrumbSchema**
- [ ] **Step 5: Crear blog/[slug]/page.tsx**
- [ ] **Step 6: Build + type-check**
- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: pagina blog/[slug] con markdown rendering y schemas Article/Breadcrumb"
```

---

## Task 9: FAQ schema en productos + robots para LLMs + sitemap

**Files:**
- Create: `components/seo/FaqSchema.tsx`
- Modify: `app/(tienda)/productos/[slug]/page.tsx` — agregar FAQ generadas
- Create: `app/robots.ts` (eliminar public/robots.txt si existe)
- Modify: `app/sitemap.ts` — incluir blog

### FaqSchema
Recibe `items: { question, answer }[]`. Genera JSON-LD FAQPage con Question/acceptedAnswer/Answer. Retorna null si items vacio.

### En productos/[slug]/page.tsx
Generar FAQs dinamicas desde el producto (ver el producto.beneficios, dosis_recomendada, mejor_momento, precio). Solo incluir preguntas que tengan respuesta no vacia. Renderizar `<FaqSchema items={faqs} />`.

Leer el archivo actual para ver donde injectarlo (dentro del return, junto al JsonLd existente).

### app/robots.ts
Usar MetadataRoute.Robots de Next. Permitir GPTBot, PerplexityBot, ClaudeBot, Google-Extended explicitamente. Disallow /api/, /panel/, /checkout/, /cuenta/, /tracking/, /auth/. Sitemap apuntando a `${themeConfig.brand.url}/sitemap.xml`.

Si existe `public/robots.txt`, eliminarlo para evitar conflicto.

### app/sitemap.ts
Agregar blog root + blog posts al array que retorna. Usar `getPublishedBlogPosts()` y mapear a `{ url, lastModified, changeFrequency, priority }`. Leer el archivo actual para respetar su estructura.

- [ ] **Step 1: Crear FaqSchema**
- [ ] **Step 2: Agregar FAQs al detalle de producto**
- [ ] **Step 3: Crear app/robots.ts**
- [ ] **Step 4: Modificar app/sitemap.ts**
- [ ] **Step 5: Build + type-check**
- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: FAQ schema en productos + robots.ts con bots LLM + blog en sitemap"
```

---

## Task 10: Panel SEO con checklist + editor blog

**Files:**
- Create: `app/panel/seo/page.tsx`
- Create: `app/panel/seo/blog/nuevo/page.tsx`
- Create: `app/panel/seo/blog/[slug]/page.tsx`
- Create: `components/panel/SeoChecklist.tsx`
- Create: `components/panel/BlogEditor.tsx`
- Modify: `app/panel/layout.tsx` (agregar link SEO en nav)

### SeoChecklist
Componente simple. Recibe `items: { label, status: "ok"|"warning"|"error", detail? }[]`. Renderiza lista con icono por status (checkmark, exclamacion, cruz) y color.

### BlogEditor (client component)
Props: `initialPost?: Partial<BlogPost>`, `mode: "create" | "edit"`. Form con inputs para: titulo (con auto-slug en mode create), slug (disabled en edit), descripcion (max 160), categoria, autor, imagen_url, keywords (string separado por coma), publicado (toggle), contenido (textarea grande monospace para markdown).

Submit: POST /api/blog (create) o PUT /api/blog/[slug] (edit). En exito, router.push("/panel/seo") + router.refresh(). Maneja errores con state local.

Auto-slug: `titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80)`.

### /panel/seo/page.tsx
Server component. `revalidate = 300`. Usa getPublishedBlogPosts + getAllBlogPosts + getAllKeywords. Header con "SEO" + boton "Nuevo articulo" linkando a /panel/seo/blog/nuevo. Grid con 2 cards: SeoChecklist con items calculados (estado publicado, keywords, schemas), y lista de articulos con link a editar.

### /panel/seo/blog/nuevo/page.tsx
Simple: titulo "Nuevo articulo" + `<BlogEditor mode="create" />`.

### /panel/seo/blog/[slug]/page.tsx
Server component. getBlogPostBySlug, notFound si no existe. Titulo "Editar articulo" + `<BlogEditor mode="edit" initialPost={post} />`.

### panel/layout.tsx
Agregar link a /panel/seo y /panel/marketing en el nav.

- [ ] **Step 1: Crear SeoChecklist**
- [ ] **Step 2: Crear BlogEditor**
- [ ] **Step 3: Crear las 3 paginas del panel**
- [ ] **Step 4: Actualizar nav del panel**
- [ ] **Step 5: Build + type-check**
- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: panel SEO con checklist y editor de blog"
```

---

## Task 11: API /api/blog CRUD

**Files:**
- Create: `app/api/blog/route.ts`
- Create: `app/api/blog/[slug]/route.ts`

### /api/blog/route.ts
- GET publico: retorna `{ posts }` con `getPublishedBlogPosts()`
- POST admin: valida con zod schema (slug regex, titulo, descripcion max 160, contenido, categoria, autor, fecha, imagen_url opcional, keywords array, publicado boolean). Llama `createBlogPost()`. Maneja "ya existe" como 409.

### /api/blog/[slug]/route.ts
- GET publico: `getBlogPostBySlug`, 404 si no existe
- PUT admin: schema con todos los campos opcionales. Llama `updateBlogPost(slug, updates)`. 404 si no existe.

Patron: auth check con `getAuthSession()`, role admin, try/catch con ZodError/custom errors/500.

- [ ] **Step 1: Crear ambos endpoints**
- [ ] **Step 2: Type-check**
- [ ] **Step 3: Commit**

```bash
git add app/api/blog/
git commit -m "feat: endpoints /api/blog (GET publico + POST/PUT admin)"
```

---

## Task 12: Panel marketing (suscriptores + newsletter)

**Files:**
- Create: `app/api/email/stats/route.ts`
- Create: `app/api/newsletter/route.ts`
- Create: `components/panel/SubscribersTable.tsx`
- Create: `components/panel/NewsletterForm.tsx`
- Create: `app/panel/marketing/page.tsx`

### /api/email/stats
Admin only. Retorna `{ ...emailStats, suscriptores_activos }`. revalidate 300.

### /api/newsletter
Admin only. POST body: `{ asunto, contenido, segmento }` donde segmento es enum "todos"|"compradores"|"sin_compra". Llama `enqueue("newsletter_send", ...)` para que n8n lo procese. Devuelve success true.

### SubscribersTable
Server-rendered. Recibe `subscribers: Subscriber[]`. Tabla con email, source, estado (color-coded), fecha. Limite de 50 visibles con nota de total.

### NewsletterForm (client)
Inputs: asunto, segmento (select), contenido (textarea). Confirm antes de enviar. POST a /api/newsletter. Feedback visual de success/error.

### /panel/marketing/page.tsx
Server. 3 KPICards (suscriptores activos, enviados hoy, tasa apertura). Grid con NewsletterForm y SubscribersTable. revalidate 300.

- [ ] **Step 1: Crear los 2 endpoints**
- [ ] **Step 2: Crear los 2 componentes**
- [ ] **Step 3: Crear la pagina**
- [ ] **Step 4: Build + type-check**
- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: panel marketing con suscriptores, stats y newsletter form"
```

---

## Task 13: Unsubscribe endpoint + pagina publica

**Files:**
- Create: `app/api/email/unsubscribe/route.ts`
- Create: `app/(tienda)/unsubscribe/page.tsx`

### /api/email/unsubscribe
- POST: body `{ email }` validado con zod. Llama `updateSubscriberStatus(email, "inactivo")`. Devuelve success.
- GET: soporta links directos desde emails `?email=xxx`. Valida email, llama updateStatus, redirect a `/unsubscribe?email=xxx`. Si error, redirect con `?error=1`.

### /unsubscribe/page.tsx
Server. Recibe searchParams.email y searchParams.error. Muestra mensaje de exito o error en un card centrado.

- [ ] **Step 1: Crear endpoint**
- [ ] **Step 2: Crear pagina**
- [ ] **Step 3: Type-check + commit**

```bash
git add -A
git commit -m "feat: unsubscribe endpoint (POST + GET con redirect) y pagina"
```

---

## Task 14: Documentacion n8n + verificacion final

**Files:**
- Create: `docs/n8n-phase2-setup.md`

### docs/n8n-phase2-setup.md

Documento con instrucciones paso a paso para configurar los flujos n8n manualmente en EasyPanel:

1. **Ecomflex Email Queue Processor** (Schedule cada hora):
   - Read Google Sheets Cola!A2:F donde estado = "pendiente"
   - Para cada evento: verificar scheduledFor en datos (si existe y > now, skip)
   - Switch por tipo de evento con templates Gmail correspondientes
   - En exito: update estado = "procesado"
   - En error: increment intentos; si >= 3, estado = "fallido"

2. **Ecomflex Sheets Backup** (Schedule domingo 3AM):
   - Export Pedidos, Usuarios, Suscriptores a JSON
   - Upload a Drive folder o repo privado

3. **Ecomflex Sunset Cleanup** (Schedule mensual):
   - Encolar `sunset_cleanup` para que Queue Processor procese

Incluir screenshots placeholder y nombres de variables de entorno necesarias.

### Verificacion final

- [ ] npm run type-check (0 errores)
- [ ] npm run build (exitoso, todas las rutas)
- [ ] npm run lint (sin errores nuevos)
- [ ] Verificar rutas nuevas en build output:
  - /blog, /blog/[slug], /unsubscribe
  - /panel/seo, /panel/seo/blog/nuevo, /panel/seo/blog/[slug], /panel/marketing
  - /api/blog, /api/blog/[slug], /api/email/stats, /api/email/unsubscribe, /api/newsletter
- [ ] Commit final + push

```bash
git add docs/n8n-phase2-setup.md
git commit -m "docs: instrucciones de setup n8n para Phase 2"
git push origin main
```

---

## Tasks que quedan para configuracion manual / Phase 2.5

Los flujos n8n reales NO se crean en este plan porque requieren acceso al panel de n8n de Pablo. Quedan documentados en `docs/n8n-phase2-setup.md` para ejecucion manual:

1. Crear Ecomflex Email Queue Processor (clonar del flujo Icebreaker existente)
2. Crear Ecomflex Sheets Backup
3. Configurar templates Gmail para los 11 tipos de evento
4. Crear tabs en Google Sheets: Suscriptores, Blog, Keywords, EmailsLog (si no existen)

El admin (Pablo) debe ademas crear los tabs en las Google Sheets con los headers correctos antes de que los modulos funcionen en produccion.

---

## Summary Tasks

| Task | Descripcion | Archivos clave |
|------|-------------|----------------|
| 1 | Tipos + constantes Phase 2 | types/index.ts, constants.ts |
| 2 | lib/sheets/queue.ts | queue.ts |
| 3 | lib/sheets/subscribers.ts | subscribers.ts |
| 4 | blog + keywords + emails-log | 3 archivos |
| 5 | Instalar marked | package.json |
| 6 | Encolar eventos | 5 endpoints modificados |
| 7 | Pagina /blog publica | page + BlogCard + BlogGrid |
| 8 | /blog/[slug] con markdown + schemas | 4 archivos nuevos + globals.css |
| 9 | FAQ + robots + sitemap | FaqSchema + robots + sitemap |
| 10 | Panel SEO + blog editor | 3 paginas + 2 componentes |
| 11 | API /api/blog CRUD | 2 endpoints |
| 12 | Panel marketing | 2 endpoints + 2 componentes + 1 pagina |
| 13 | Unsubscribe | endpoint + pagina |
| 14 | Docs n8n + verificacion final | docs + build/push |

**Total: 14 tasks.** Al terminar, Ecomflex tendra marketing por email automatizado via cola en Sheets, SEO profesional con blog y schemas, panel admin de SEO + Marketing, y documentacion para que Pablo configure los flujos n8n manualmente.
