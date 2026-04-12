# n8n Setup — Ecomflex Phase 3

Tres flujos n8n para automatizar redes sociales, push notifications y insights diarios.

Todos los flujos leen de la hoja **Cola** del Google Sheet de Ecomflex (ver `docs/n8n-phase2-setup.md` para la estructura base).

---

## Variables de entorno (en n8n → Settings → Variables)

```
VAPID_PUBLIC_KEY=BN...
VAPID_PRIVATE_KEY=xx...
VAPID_SUBJECT=mailto:contacto@ecomflex.com
BLOTATO_API_KEY=blt_...
TWITTER_BEARER_TOKEN=AAAA...
TIKTOK_ACCESS_TOKEN=act_...
TELEGRAM_CHAT_ID=123456789
```

### Generar las VAPID keys

Las VAPID keys son las credenciales que identifican tu servidor al enviar push notifications. Se generan una sola vez.

```bash
npx web-push generate-vapid-keys
```

Copiar la `Public Key` y la `Private Key`. Configurar en **Vercel → Settings → Environment Variables**:

- `VAPID_PUBLIC_KEY` — public key
- `VAPID_PRIVATE_KEY` — private key
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — misma public key duplicada con prefijo `NEXT_PUBLIC_` para que el cliente la pueda leer en el browser

**IMPORTANTE:** al pegar env vars en Vercel via pipe, usar `tr -d '\n'` para evitar newlines corruptos.

---

## Flujo 1: Ecomflex Social Media Publisher

**Trigger:** Schedule node, cada 10 minutos.

**Pasos:**

1. **Schedule Trigger** — interval 10 min
2. **Google Sheets (read)** — Cola tab, filtrar `tipo=social_media_publish` AND `status=pending`
3. **Filter** — `scheduledFor <= NOW()` (items que ya deben publicarse)
4. **Switch** por campo `platform`:
   - Instagram → **HTTP Request** a Blotato API (`POST /v1/posts`)
   - Twitter → **HTTP Request** a Twitter API v2 (`POST /2/tweets`) con Bearer Token
   - TikTok → **HTTP Request** a TikTok Content Posting API
5. **IF** — si status 2xx:
   - **Google Sheets (update)** → marcar `status=published`, `publishedAt=NOW()`
6. **ELSE:**
   - **Google Sheets (update)** → marcar `status=failed`, `errorMessage=<respuesta>`

---

## Flujo 2: Ecomflex Push Sender

**Trigger:** Schedule node, cada 10 minutos.

**Pasos:**

1. **Schedule Trigger** — interval 10 min
2. **Google Sheets (read)** — Cola tab, filtrar `tipo=push_notification_send` AND `status=pending`
3. **Google Sheets (read)** — PushSubs tab, filtrar `active=true`
4. **Code node (Python)** — loop sobre cada subscription, llamar a web-push library con VAPID keys, enviar payload
5. **IF** — response 410 Gone (subscription expirada):
   - **Google Sheets (update)** → marcar `active=false` en PushSubs
6. **Google Sheets (update)** → marcar cola item `status=sent`

**Nota:** n8n no tiene nodo nativo de Web Push. Usar un Code node con `pywebpush` (Python) o `web-push` (JS). Alternativa: exponer un endpoint `/api/push/send-batch` en Next.js y llamarlo desde n8n con HTTP Request.

---

## Flujo 3: Ecomflex Kira Insights Diario

**Trigger:** Schedule node, todos los dias 8:00 AM.

**Pasos:**

1. **Schedule Trigger** — cron `0 8 * * *`
2. **HTTP Request** → `GET https://ecomflex.vercel.app/api/analytics/summary`
3. **OpenAI node** → modelo `gpt-4o-mini`, prompt:
   ```
   Sos Kira, analista de Ecomflex. Recibi estas metricas del dia:
   {{ $json }}

   Genera un resumen ejecutivo en espanol rioplatense, 5-7 bullets,
   destacando: ventas, productos top, alertas y sugerencias accionables.
   ```
4. **Telegram node** → enviar a `TELEGRAM_CHAT_ID` con el resumen

---

## Limitaciones conocidas

- **TikTok Content Posting API** requiere aprobacion de TikTok (puede tardar semanas). Mientras tanto, marcar posts de TikTok como "pendiente manual".
- **Twitter API v2** requiere Developer Account aprobada (free tier limita a 1500 tweets/mes).
- **Blotato** es el publisher preferido para Instagram. Fallback: Instagram Graph API directo (requiere Facebook Business + Instagram Business account).
- **Push en iOS** solo funciona en PWAs instaladas desde Safari 16.4+ (iOS 16.4+). En Android funciona en Chrome/Edge/Firefox.
