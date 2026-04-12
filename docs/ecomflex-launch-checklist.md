# Ecomflex — Checklist de Lanzamiento

**Propósito:** Guiar a Pablo paso a paso desde "código pusheado a main" hasta "tienda vendiendo real" y "app en Play Store". Todo lo que queda fuera del código.

**Cómo retomar esto:** En una sesión futura decir a Claude:

> **"Retomá la checklist de lanzamiento de Ecomflex — estoy en la fase X"**

o más específico:

> **"Necesito hacer el paso Y de la checklist de lanzamiento de Ecomflex"**

Claude debe leer este archivo (`docs/ecomflex-launch-checklist.md`) y guiarte desde el punto que digas.

---

## Estado del código al momento de escribir esta checklist

- Phases 0-3 completadas (69 commits)
- Todas las tasks auditadas con spec reviewer + code quality reviewer
- Build verde en Vercel
- Gaps conocidos documentados en memoria (`project_ecomflex.md`)

---

## FASE A — Setup de infraestructura (1-2 días)

Lo que hay que configurar antes de cargar un solo producto.

### A.1 — Google Sheets (1 hora)

- [ ] **Abrir las 2 Google Sheets** que ya usa el proyecto (pública + privada) — los IDs están en las env vars de Vercel (`GOOGLE_SHEETS_PUBLIC_ID` y `GOOGLE_SHEETS_PRIVATE_ID`).

- [ ] **Crear en la Sheet PÚBLICA** estos tabs nuevos con los headers en la fila 1:

  **Tab `Blog`** (10 columnas):
  ```
  slug | titulo | descripcion | contenido | categoria | autor | fecha | imagen_url | keywords | publicado
  ```

  **Tab `Keywords`** (5 columnas):
  ```
  keyword | pagina_destino | volumen_estimado | posicion | intencion
  ```

- [ ] **Crear en la Sheet PRIVADA** estos tabs nuevos:

  **Tab `Cola`** (6 columnas):
  ```
  id | tipo | datos | timestamp | estado | intentos
  ```

  **Tab `Suscriptores`** (6 columnas):
  ```
  id | email | fecha | source | estado | ultima_actividad
  ```

  **Tab `EmailsLog`** (8 columnas):
  ```
  id | tipo | destinatario | asunto | fecha_envio | abierto | fecha_apertura | error
  ```

  **Tab `Referidos`** (8 columnas):
  ```
  id | user_email | codigo | fecha_creacion | total_clicks | total_conversiones | total_ingresos | activo
  ```

  **Tab `PushSubs`** (8 columnas):
  ```
  id | email | endpoint | p256dh | auth | user_agent | fecha | estado
  ```

  **Tab `SocialLog`** (9 columnas):
  ```
  id | platform | contenido | imagen_url | scheduled_for | estado | external_id | fecha_creacion | error
  ```

  **Tab `Cupones`** (7 columnas) — si no existe ya:
  ```
  codigo | descuento_porcentaje | fecha_vencimiento | usos_maximos | usos_actuales | activo | descripcion
  ```

  **Tab `Config`** (3 columnas) — si no existe ya (en la Sheet pública):
  ```
  modulo | propiedad | valor
  ```

  **Tab `Carritos`** (5 columnas) — si no existe ya:
  ```
  id | email | items | timestamp | estado
  ```

- [ ] **Verificar** que `COL.PEDIDO.ITEMS_JSON` esté en columna G (índice 6). Si los pedidos antiguos guardaban un texto, el mapper ya tiene fallback a `[]` (no rompe).

### A.2 — Variables de entorno en Vercel (30 min)

Ir a Vercel → Project → Settings → Environment Variables. Verificar o agregar:

#### Google Sheets
- [ ] `GOOGLE_SHEETS_PUBLIC_ID` — ID de la Sheet pública
- [ ] `GOOGLE_SHEETS_PRIVATE_ID` — ID de la Sheet privada
- [ ] `GOOGLE_SHEETS_CLIENT_EMAIL` — email del service account
- [ ] `GOOGLE_SHEETS_PRIVATE_KEY` — clave del service account (IMPORTANTE: usar `tr -d '\n'` al copiar — feedback aprendido en memoria)

#### NextAuth
- [ ] `NEXTAUTH_URL` — URL del deploy (ej: `https://ecomflex.vercel.app`)
- [ ] `NEXTAUTH_SECRET` — generar con `openssl rand -base64 32`

#### Google OAuth
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`

#### Admins
- [ ] `ADMIN_EMAILS` — lista separada por coma de emails con acceso al panel (empezar con tu email)

#### MercadoPago
- [ ] `MERCADOPAGO_ACCESS_TOKEN` — token de producción (NO el de test)
- [ ] `MERCADOPAGO_PUBLIC_KEY`
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` — del panel de MercadoPago → Developers → Webhooks

#### OpenAI (Kira)
- [ ] `OPENAI_API_KEY`

#### n8n
- [ ] `N8N_API_URL` — ej: `https://mixeliq-n8n.llbavt.easypanel.host`
- [ ] `N8N_API_KEY`

#### Gmail (via n8n)
- [ ] `GMAIL_SENDER_EMAIL`
- [ ] `GMAIL_SENDER_NAME`

#### Push Notifications (Phase 3)
- [ ] Generar VAPID keys:
  ```bash
  npx web-push generate-vapid-keys
  ```
- [ ] `VAPID_PUBLIC_KEY`
- [ ] `VAPID_PRIVATE_KEY`
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — **mismo valor que VAPID_PUBLIC_KEY** (duplicado con prefijo para que el browser lo lea)

#### Social Media (Phase 3)
- [ ] `BLOTATO_API_KEY` (opcional — solo si tenés cuenta)
- [ ] `TWITTER_BEARER_TOKEN` (requiere Developer Account)
- [ ] `TIKTOK_ACCESS_TOKEN` (requiere aprobación — semanas)

#### Cloudflare R2 (para fotos de reseñas)
- [ ] `R2_ACCESS_KEY_ID`
- [ ] `R2_SECRET_ACCESS_KEY`
- [ ] `R2_BUCKET_NAME`
- [ ] `R2_PUBLIC_URL`

#### Crypto (opcional)
- [ ] `CRYPTO_WALLET_ADDRESS`
- [ ] `CRYPTO_NETWORK`

- [ ] **Redeploy** el proyecto en Vercel después de agregar las variables (Settings → Deployments → Redeploy).

### A.3 — MercadoPago webhook (15 min)

- [ ] Ir a MercadoPago → Developers → Tu aplicación → Webhooks
- [ ] Agregar URL: `https://TU-DOMINIO.vercel.app/api/webhooks/mercadopago`
- [ ] Eventos: `Pagos` (payment)
- [ ] Copiar el Secret Key y ponerlo en `MERCADOPAGO_WEBHOOK_SECRET` en Vercel
- [ ] Hacer una compra de prueba con tarjeta test y verificar que el pedido se marca como pagado

### A.4 — Dominio custom (opcional, 30 min)

- [ ] Comprar dominio en Hostinger (~$12/año) — ej: `mitienda.com.ar`
- [ ] En Vercel → Project → Settings → Domains → Add
- [ ] Vercel te da un CNAME o A record
- [ ] En Hostinger → DNS → agregar el registro
- [ ] Esperar 5-30 min para propagación
- [ ] Verificar que `https://mitienda.com.ar` funciona con SSL
- [ ] Actualizar `NEXTAUTH_URL` en Vercel con el dominio nuevo
- [ ] Actualizar `theme.config.ts` → `brand.url` con el dominio nuevo y redeploy

---

## FASE B — Flujos n8n (2-3 horas)

Sin esto, los emails, push notifications y posts en redes NO se envían. El código los encola, n8n los procesa.

**Referencias:**
- `docs/n8n-phase2-setup.md` — Email queue processor, Sheets backup, Sunset cleanup
- `docs/n8n-phase3-setup.md` — Social Media Publisher, Push Sender, Kira Insights Diario

### B.1 — Flujos de Phase 2

- [ ] **Ecomflex Email Queue Processor** (Schedule cada hora):
  - Lee tab `Cola` filtrando `estado = pendiente`
  - Switch por tipo de evento (welcome_series_start, abandoned_cart_*, post_purchase_*, newsletter_send, etc.)
  - Por cada rama: template Gmail + send
  - En éxito: marca evento como `procesado`
  - En error: incrementa `intentos`, si >= 3 marca `fallido`

- [ ] **Ecomflex Sheets Backup** (Schedule domingo 3 AM):
  - Exporta Pedidos, Usuarios, Suscriptores a JSON
  - Guarda en Google Drive o repo privado

- [ ] **Ecomflex Sunset Cleanup** (Schedule mensual):
  - Encola `sunset_cleanup` para que el Queue Processor marque inactivos

### B.2 — Flujos de Phase 3

- [ ] **Ecomflex Social Media Publisher** (Schedule cada 10 min):
  - Lee tab `Cola` filtrando `tipo = social_media_publish`
  - Switch por platform (instagram/twitter/tiktok)
  - Instagram: Blotato API (o Instagram Graph API si no tenés Blotato)
  - Twitter: API v2
  - TikTok: Content Posting API
  - Marca post en SocialLog como publicado/fallido

- [ ] **Ecomflex Push Sender** (Schedule cada 10 min):
  - Lee tab `Cola` filtrando `tipo = push_notification_send`
  - Lee tab `PushSubs` activos (filtrado por segmento)
  - Por cada suscripción: envía via Web Push con VAPID
  - Si devuelve 410 Gone: marca la suscripción como inactiva
  - Marca evento procesado

- [ ] **Ecomflex Kira Insights Diario** (Schedule diario 8 AM):
  - Llama a `/api/analytics/summary`
  - Formatea con GPT-4o-mini
  - Envía a Telegram de Pablo

### B.3 — Variables de entorno en n8n

En el panel de n8n (EasyPanel), agregar:
- [ ] `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:contacto@TU-DOMINIO`
- [ ] `BLOTATO_API_KEY`, `TWITTER_BEARER_TOKEN`, `TIKTOK_ACCESS_TOKEN`
- [ ] `TELEGRAM_CHAT_ID` (tu chat)
- [ ] `NEXTAUTH_SECRET` — **mismo valor que en Vercel** (necesario para generar unsubscribe tokens firmados)
- [ ] `BRAND_URL` — tu URL de deploy

### B.4 — Tests manuales de los flujos

- [ ] Suscribirte con un email de prueba en la tienda → verificar que aparece en `Suscriptores` + evento `welcome_series_start` en `Cola`
- [ ] Ejecutar manualmente el Email Queue Processor → verificar que se envía el welcome email y el evento se marca `procesado`
- [ ] Hacer click en un link de unsubscribe → verificar que el status cambia a `inactivo`
- [ ] Hacer una compra de prueba → verificar que se encolan los 4 eventos post-compra
- [ ] Aceptar push notification en la tienda → verificar que aparece en `PushSubs`
- [ ] Enviar una push notification desde el panel → verificar que llega al browser

---

## FASE C — Contenido inicial (2-4 horas)

Lo que ve un cliente cuando entra por primera vez.

### C.1 — Branding en `theme.config.ts`

- [ ] Editar `theme.config.ts`:
  - `brand.name` — nombre de tu tienda
  - `brand.tagline` — slogan corto (60 chars)
  - `brand.description` — descripción larga (160 chars)
  - `brand.url` — tu dominio final
  - `brand.logo` — ruta al logo SVG en `/public/`
  - `styles.colors.primary` — color principal (hex)
  - `styles.fonts.heading` + `fonts.body` — Google Fonts
  - `currency.envioGratis` — umbral de envío gratis en tu moneda
  - `payments.transferencia.datos.cbu/alias/titular` — tus datos bancarios reales
  - `contact.whatsapp` — número con código de país (ej: 5491100000000)
  - `contact.email` — email público
  - `social.instagram/twitter/tiktok` — tus handles (sin @)
  - `home.hero.title` + `titleHighlight` + `subtitle` — el hero de la homepage
  - `home.features` — los 3 features principales
  - `assistant.name` — nombre de Kira (podés dejarlo o renombrar)
  - `assistant.personality` — el prompt del asistente

- [ ] Commit + push. Vercel redeploya automáticamente.

### C.2 — Logo e imágenes

- [ ] Crear logo en `/public/logo.svg` (o PNG si no es vectorial)
- [ ] Crear iconos PWA:
  - `/public/icon-192.png` (192x192)
  - `/public/icon-512.png` (512x512)
  - `/public/favicon.svg`
- [ ] Screenshot del OG image (`/public/og-image.png` — 1200x630 aprox)

### C.3 — Productos (el más laborioso)

- [ ] Abrir tab `Productos` en la Sheet pública
- [ ] Por cada producto, llenar los 19 campos:
  - `id` (UUID o código único)
  - `slug` (URL amigable, ej: `creatina-monohidrato-300g`)
  - `nombre`
  - `descripcion`
  - `precio` (número sin puntos)
  - `precio_anterior` (opcional, para mostrar tachado)
  - `categoria`, `marca`
  - `imagen_url` (URL pública HTTPS — subí a Cloudflare R2 o imgur)
  - `imagenes` (URLs adicionales separadas por coma)
  - `badge` (ej: "nuevo", "oferta", vacío)
  - `descuento_porcentaje`
  - `stock` (número)
  - `tipo` (categoría interna)
  - `link_afiliado` (opcional)
  - `variantes` (separadas por coma)
  - `dosis_recomendada`, `mejor_momento`, `beneficios` (para suplementos)

- [ ] **Mínimo recomendado para lanzar:** 10 productos
- [ ] **Ideal:** 20-30 productos cubriendo 3-5 categorías

### C.4 — Reseñas iniciales (opcional pero recomendado)

- [ ] Llamar al endpoint `GET /api/resenas/seed` una vez para generar reseñas demo
- [ ] O manualmente agregar 3-5 reseñas reales en el tab `Resenas` (marcando `aprobado = si` y `verificado = true`)

### C.5 — Blog — primeros 3 artículos

- [ ] Desde `/panel/seo/blog/nuevo`, crear 3 artículos iniciales para SEO:
  1. Guía del producto estrella (ej: "Guía completa de la creatina monohidrato")
  2. Comparativa (ej: "Creatina vs Proteína: ¿cuál necesitás?")
  3. Artículo educativo de la categoría principal

- [ ] Cada artículo: 800-1500 palabras, meta description 150 chars, 3-5 keywords, marcado como `publicado`.

### C.6 — Cupones iniciales

- [ ] Desde `/panel/cupones`, crear:
  - `BIENVENIDO10` — 10% OFF, vence en 30 días, usos ilimitados
  - `ENVIOGRATIS` — código para promociones puntuales

### C.7 — Verificación final pre-lanzamiento

- [ ] Navegar la tienda en un celular (experiencia del comprador real)
- [ ] Probar el flujo completo: ver producto → agregar al carrito → checkout → pagar con tarjeta de test → ver tracking
- [ ] Probar Kira: hacer preguntas sobre productos
- [ ] Probar el buscador: escribir parte de un producto
- [ ] Probar suscripción al popup de email
- [ ] Verificar que los emails llegan (con n8n corriendo)

---

## FASE D — TWA + Google Play Store (3-5 días con tiempo de espera)

**Referencia:** `docs/twa-playstore-setup.md`

### D.1 — Verificación cuenta de desarrollador

- [ ] Verificar que la cuenta Mixeliq en Google Play Console esté aprobada
- [ ] Verificar que la verificación de identidad con factura Telecentro haya sido aprobada (si no, esperar respuesta de Google o reenviar)

### D.2 — Instalar Bubblewrap

- [ ] Instalar Java JDK 17+ si no está
- [ ] Instalar Android SDK
- [ ] `npm install -g @bubblewrap/cli`

### D.3 — Inicializar TWA

```bash
mkdir ecomflex-twa && cd ecomflex-twa
bubblewrap init --manifest=https://TU-DOMINIO/manifest.json
```

- [ ] Package name: `ar.com.mixeliq.ecomflex` (o lo que elijas)
- [ ] Responder todas las preguntas (display mode, splash color, etc.)
- [ ] **GUARDAR la contraseña del keystore** — si se pierde no se puede actualizar la app nunca más

### D.4 — Obtener SHA-256 fingerprint

```bash
keytool -list -v -keystore android.keystore -alias android
```

- [ ] Copiar el SHA-256 fingerprint (formato: `XX:XX:XX:...`)

### D.5 — Actualizar assetlinks.json

- [ ] Editar `public/.well-known/assetlinks.json` en el repo
- [ ] Reemplazar `REEMPLAZAR_CON_FINGERPRINT_DEL_KEYSTORE` con el fingerprint real
- [ ] Verificar que `package_name` coincida con lo que elegiste en Bubblewrap
- [ ] Commit + push
- [ ] Verificar que `https://TU-DOMINIO/.well-known/assetlinks.json` devuelve el JSON correcto

### D.6 — Build del APK/AAB

```bash
bubblewrap build
```

- [ ] Verificar que genera `app-release-bundle.aab` (para Play Store) y `app-release-signed.apk` (para testing)
- [ ] Instalar el APK en tu celular y probar:
  - [ ] Se ve sin barra de URL
  - [ ] Todos los botones funcionan
  - [ ] El splash screen aparece correctamente
  - [ ] Push notifications funcionan

### D.7 — Generar screenshots para Play Store

Con el emulador Android o un celular real en modo portrait:

- [ ] Screenshot 1: Home (`/`)
- [ ] Screenshot 2: Catálogo (`/productos`)
- [ ] Screenshot 3: Detalle de producto (`/productos/[slug]`)
- [ ] Screenshot 4: Checkout (`/checkout`)
- [ ] Guardar en `public/screenshots/home.png`, `productos.png`, `producto.png`, `checkout.png` (1080x1920 cada uno)
- [ ] Commit + push

### D.8 — Gráficos para Play Store

Necesitás hacer en Canva/Figma:
- [ ] Gráfico destacado: 1024x500 (la imagen grande que aparece arriba)
- [ ] Icono alta resolución: 512x512

### D.9 — Google Play Console

- [ ] Crear nueva app en Play Console
- [ ] Completar ficha de tienda:
  - [ ] Título (30 chars)
  - [ ] Descripción breve (80 chars)
  - [ ] Descripción completa (hasta 4000 chars)
  - [ ] Icono 512x512
  - [ ] Gráfico destacado 1024x500
  - [ ] 4-8 screenshots
  - [ ] Categoría: Shopping
  - [ ] Email de contacto
  - [ ] URL de política de privacidad: `https://TU-DOMINIO/politica-privacidad`
  - [ ] URL de términos: `https://TU-DOMINIO/terminos`
- [ ] Subir el `.aab` en "Producción"
- [ ] Completar cuestionario de clasificación de contenido
- [ ] Completar cuestionario de público objetivo (adultos)
- [ ] Cuestionario de seguridad de datos
- [ ] Enviar para revisión

### D.10 — Esperar aprobación

- [ ] Google tarda 1-7 días en revisar
- [ ] Si rechazan, leer el motivo y corregir
- [ ] Cuando apruebe, la app aparece en Play Store con el nombre que pusiste

---

## FASE E — Marketing + primeros clientes (continuo)

Una vez que la tienda está viva y con contenido.

### E.1 — Semana 1: Arranque soft

- [ ] Comprarte algo a tu propia tienda para verificar todo el flujo end-to-end (real, no test)
- [ ] Pedirle a 2-3 amigos que hagan una compra chica (con descuento) para generar reseñas reales
- [ ] Publicar en tu WhatsApp personal que la tienda está abierta (con descuento de lanzamiento usando `BIENVENIDO10`)
- [ ] Responder todas las preguntas que te lleguen (vas a detectar fricciones reales)

### E.2 — Semana 2-4: Contenido orgánico

- [ ] Empezar a publicar en Instagram/TikTok desde `/panel/redes-sociales`
- [ ] 1 post diario los primeros 14 días (usar estructura ABIERTO → AUTORIDAD → SOLUCIÓN del skill de crecimiento IG)
- [ ] Historias diarias mostrando el detrás de escena
- [ ] Publicar 1 artículo nuevo por semana en el blog
- [ ] Compartir el link del blog en las historias

### E.3 — Mes 2: Email marketing activo

- [ ] Newsletter semanal desde `/panel/marketing`
- [ ] Verificar que welcome series, carrito abandonado y post-compra están funcionando (ver `EmailsLog`)
- [ ] Revisar tasa de apertura en el dashboard
- [ ] A/B testing manual de asuntos (hacer 2 newsletters en días distintos con subjects diferentes)

### E.4 — Mes 2-3: Paid ads (si los números cierran)

Solo si los orgánicos están dando resultado y el LTV justifica el CAC:
- [ ] Google Ads para keywords de producto (usando skill de Google Ads 2026)
- [ ] Facebook Ads para remarketing a gente que visitó sin comprar
- [ ] Medir ROAS (objetivo >3x)

### E.5 — Métricas clave a revisar cada semana

- [ ] **Ventas totales** (dashboard)
- [ ] **Tasa de conversión** (visitas → compras, meta: >2%)
- [ ] **Ticket promedio** (total pedidos / cantidad pedidos)
- [ ] **Carritos abandonados recuperados** (%)
- [ ] **Tasa de apertura de emails** (>30%)
- [ ] **Top productos** (lo que más se vende)
- [ ] **Stock bajo** (para reponer a tiempo)

Todo visible desde `/panel`.

---

## FASE F — Escalar (cuando todo anda)

Una vez que la tienda propia funciona, considerar:

### F.1 — Vender el servicio a clientes

- [ ] Armar pitch deck en Gamma
- [ ] Pricing: setup $300-500 + mensual $100-300
- [ ] Caso de estudio con tu propia tienda (números reales)
- [ ] Lead generation: WhatsApp personal, red de contactos, LinkedIn

### F.2 — Script CLI para deploy rápido (Phase 4 opcional)

Si tenés 3+ clientes interesados, vale la pena:
- [ ] Script que automatice: fork del repo → creación Google Sheets con tabs ya armados → deploy en Vercel → configuración de env vars
- [ ] Meta: de "cliente te paga" a "tienda lista" en menos de 30 min
- [ ] Esto es una fase de desarrollo separada (Phase 4)

### F.3 — Phase 3.5 opcional (conversion tracking real)

Los gaps conocidos de Phase 3 para resolver cuando tengas volumen:
- [ ] Webhook MP lee `referral_code` del pedido pagado y llama `registerConversion`
- [ ] Generador automático de cupón único por referral (así el "descuento por amigo" es real)
- [ ] AI copy generator para social posts (mencionado en spec 4.4)

---

## Troubleshooting rápido

**Los emails no llegan:**
- Verificar que los flujos n8n estén activos
- Revisar `EmailsLog` en la Sheet — ¿hay eventos procesados?
- Revisar `Cola` — ¿hay eventos `fallido`?
- Probar enviar email manualmente desde n8n

**El panel dice "No autorizado":**
- Verificar que tu email está en `ADMIN_EMAILS` en Vercel
- Logout y login de nuevo con Google
- El rol se asigna en el callback JWT de NextAuth — puede necesitar refresh

**Kira no responde:**
- Verificar `OPENAI_API_KEY` en Vercel
- Verificar cuota de OpenAI
- Ver logs en Vercel → Deployments → Functions

**Las compras no se marcan como pagadas:**
- Verificar que el webhook MP apunta al deploy correcto
- Revisar `MERCADOPAGO_WEBHOOK_SECRET`
- Ver logs de `/api/webhooks/mercadopago` en Vercel
- MP reintenta el webhook si falla — puede tardar unos minutos

**Las push notifications no llegan:**
- Verificar VAPID keys en Vercel y n8n (deben coincidir)
- Verificar que el service worker esté registrado (DevTools → Application → Service Workers)
- Probar en Android — iOS solo soporta push en PWA instalada desde Safari 16.4+

---

## Cómo retomar esta checklist

**Frases que entiendo para retomar desde donde estés:**

- "Retomá la checklist de lanzamiento de Ecomflex, estoy arrancando con la Fase A"
- "Necesito hacer el paso B.4 de la checklist de lanzamiento"
- "Ayudame con el paso D.6 de la checklist — no me sale el build de Bubblewrap"
- "Hice la Fase A y B, pasemos a la C"
- "Dame el próximo paso de la checklist de lanzamiento"

Cuando me digas una de estas frases, voy a:
1. Leer este archivo completo
2. Ubicarme en el paso que me indicás
3. Guiarte con comandos exactos, código si hace falta, y validaciones para que sepas que el paso quedó bien
4. Actualizar esta checklist o tu memoria si encontramos algo nuevo en el proceso

---

**Última actualización:** 2026-04-12 (al completar Phase 3)
**Autor:** Claude Code (sesión de Pablo)
**Referencias cruzadas:**
- `docs/superpowers/specs/2026-04-11-ecomflex-design.md` — Spec completo
- `docs/superpowers/plans/2026-04-11-ecomflex-phase0-cleanup.md` — Plan Phase 0
- `docs/superpowers/plans/2026-04-12-ecomflex-phase1-mvp.md` — Plan Phase 1
- `docs/superpowers/plans/2026-04-12-ecomflex-phase2-marketing.md` — Plan Phase 2
- `docs/superpowers/plans/2026-04-12-ecomflex-phase3-growth.md` — Plan Phase 3
- `docs/n8n-phase2-setup.md` — Flujos n8n Phase 2
- `docs/n8n-phase3-setup.md` — Flujos n8n Phase 3
- `docs/twa-playstore-setup.md` — Setup TWA y submission
