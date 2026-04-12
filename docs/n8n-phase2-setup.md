# n8n Setup — Ecomflex Phase 2

Este documento explica como configurar los flujos n8n que activan el motor de marketing automatizado de Ecomflex.

**Prerequisito:** Phase 2 de la app esta deployada en Vercel y las Google Sheets privada/publica tienen los tabs nuevos (Cola, Suscriptores, Blog, Keywords, EmailsLog).

---

## Tabs nuevos a crear en Google Sheets

**Sheet PRIVADA** (donde ya estan Pedidos, Cupones, etc.):

### Tab `Cola` (fila 1 = headers)
| A (id) | B (tipo) | C (datos) | D (timestamp) | E (estado) | F (intentos) |

### Tab `Suscriptores`
| A (id) | B (email) | C (fecha) | D (source) | E (estado) | F (ultima_actividad) |

### Tab `EmailsLog`
| A (id) | B (tipo) | C (destinatario) | D (asunto) | E (fecha_envio) | F (abierto) | G (fecha_apertura) | H (error) |

**Sheet PUBLICA** (productos, blog):

### Tab `Blog`
| A (slug) | B (titulo) | C (descripcion) | D (contenido) | E (categoria) | F (autor) | G (fecha) | H (imagen_url) | I (keywords) | J (publicado) |

### Tab `Keywords`
| A (keyword) | B (pagina_destino) | C (volumen) | D (posicion) | E (intencion) |

---

## Flujo 1: Ecomflex Email Queue Processor

**Trigger:** Schedule — cada hora, minuto 0.

**Nodos:**

### 1. Schedule Trigger
Cron: `0 * * * *`

### 2. Google Sheets — Read
- Operacion: Read Rows
- Document: Sheet PRIVADA
- Sheet: Cola
- Range: A2:F
- Filter: Return all rows

### 3. Function — Filter pending + scheduled
Filtrar eventos `estado === "pendiente"`. Para eventos `abandoned_cart_*` y otros con `scheduledFor` en `datos`, solo procesar si `new Date(datos.scheduledFor) <= now`.

```javascript
const now = new Date();
return items.filter((item) => {
  const row = item.json;
  if (row.estado !== "pendiente") return false;

  let datos = {};
  try {
    datos = JSON.parse(row.datos || "{}");
  } catch {
    datos = {};
  }

  if (datos.scheduledFor) {
    const scheduled = new Date(datos.scheduledFor);
    if (isNaN(scheduled.getTime())) return false;
    if (scheduled > now) return false;
  }

  return true;
});
```

### 4. Switch — Por tipo de evento

Ramas:
- `welcome_series_start` → Email 1 de bienvenida (descuento)
- `abandoned_cart_1h` → Email corto "te olvidaste algo"
- `abandoned_cart_24h` → Email con objeciones
- `abandoned_cart_48h` → Email con incentivo extra
- `post_purchase_confirmation` → Confirmacion inmediata
- `post_purchase_tips` → Tips de uso (despues de X dias)
- `post_purchase_review_request` → Pedir resena
- `post_purchase_cross_sell` → Productos complementarios
- `newsletter_send` → Iterar suscriptores y enviar
- `winback_60d` → Te extranamos
- `sunset_cleanup` → Marcar como inactivo

### 5. Gmail Send Email (por rama)

Usar cuenta Gmail conectada. Template por tipo con variables del `datos` del evento.

**Tip:** Crear templates HTML simples con variables de merge. Ejemplo welcome:

```html
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h1>Bienvenido a {{brand_name}}</h1>
  <p>Gracias por suscribirte. Te dejamos un 10% OFF en tu primera compra:</p>
  <p style="font-size: 24px; font-weight: bold;">BIENVENIDO10</p>
  <p>Valido por 7 dias.</p>
  <p style="color: #888; font-size: 12px;">
    Si no queres recibir mas emails, <a href="{{unsubscribe_url}}">desuscribirme</a>
  </p>
</body>
</html>
```

### 6. Google Sheets — Log email enviado
Append a `EmailsLog` con id (UUID), tipo, destinatario, asunto, fecha_envio (now), abierto (false), fecha_apertura (""), error ("").

### 7. Google Sheets — Mark event processed
Update la fila del evento en Cola con `estado = "procesado"`. Usar el row number del evento original.

### 8. Error handler
Si cualquier nodo falla: incrementar `intentos` del evento. Si `intentos >= 3`, marcar `estado = "fallido"`. Si no, dejar `estado = "pendiente"` para reintento.

---

## Flujo 2: Ecomflex Sheets Backup

**Trigger:** Schedule — domingo 3:00 AM.

**Nodos:**

1. **Schedule Trigger** — cron `0 3 * * 0`
2. **Google Sheets — Read Pedidos** (sheet privada)
3. **Google Sheets — Read Usuarios** (sheet privada)
4. **Google Sheets — Read Suscriptores** (sheet privada)
5. **Google Sheets — Read Productos** (sheet publica)
6. **Function — Build JSON backup**
7. **Google Drive — Upload** o **GitHub — Create File** en un repo privado
8. **Telegram — Notify** (opcional): avisar que el backup se hizo

Archivo: `ecomflex-backup-YYYY-MM-DD.json`

---

## Flujo 3: Ecomflex Sunset Cleanup

**Trigger:** Schedule — primer dia de cada mes, 4:00 AM.

Opcion simple: encolar un evento `sunset_cleanup` y dejar que el Queue Processor lo maneje.

**Nodos:**

1. **Schedule Trigger** — cron `0 4 1 * *`
2. **HTTP Request** al endpoint `/api/newsletter` con body `{ asunto: "Solo sunset", contenido: "", segmento: "todos" }` → No, mejor:
3. **Google Sheets — Read Suscriptores** (filtrar estado=activo y ultima_actividad < hace 90 dias)
4. **Loop — por cada suscriptor inactivo**:
   - Google Sheets — Update estado = "inactivo"
   - Opcional: Gmail send "te extranamos" antes de marcar inactivo

---

## Variables de entorno en n8n

En el panel n8n, agregar las variables de entorno necesarias:

```
GMAIL_SENDER_EMAIL=tienda@mixeliq.com
GMAIL_SENDER_NAME=Ecomflex
GOOGLE_SHEETS_PUBLIC_ID=xxx
GOOGLE_SHEETS_PRIVATE_ID=xxx
BRAND_NAME=Mi Tienda
BRAND_URL=https://mitienda.vercel.app
UNSUBSCRIBE_BASE_URL=https://mitienda.vercel.app/api/email/unsubscribe
```

---

## Tests manuales despues del setup

1. **Suscripcion nueva**: Ir a la tienda, suscribirse con un email nuevo. Verificar que aparece en tab `Suscriptores` y que se creo un evento `welcome_series_start` en tab `Cola`.

2. **Compra**: Hacer un checkout. Verificar que aparece evento `post_purchase_confirmation` en `Cola`.

3. **Carrito abandonado**: Agregar productos al carrito, ir al checkout, escribir email, abandonar. Verificar que aparecen 3 eventos `abandoned_cart_*` con `scheduledFor` en el JSON de `datos`.

4. **Proceso del flujo**: Correr el flujo Email Queue Processor manualmente (boton "Execute Workflow"). Verificar que los eventos pendientes se marcan como `procesado` y aparecen filas en `EmailsLog`.

5. **Unsubscribe**: Click en el link de unsubscribe de un email enviado. Verificar que el suscriptor queda con `estado = "inactivo"`.

---

## Limites conocidos

- **Cola no atomica**: si dos instancias de n8n corren el mismo flujo simultaneamente (no deberia pasar con Schedule), pueden procesar el mismo evento dos veces. El contador `intentos` mitiga pero no elimina.
- **Gmail rate limits**: 500 emails/dia en cuenta free, 2000 en Workspace. Si se supera, usar Resend/SendGrid.
- **marked sin sanitizer en newsletters**: si el admin pone HTML malicioso en el contenido del newsletter, se envia tal cual. Solo el admin puede enviar, asi que se confia en el rol.

---

## Referencia rapida de tipos de eventos

| Tipo | Origen | Delay esperado | Descripcion |
|------|--------|----------------|-------------|
| welcome_series_start | /api/email/subscribe (nuevo) | inmediato | Inicia secuencia de bienvenida |
| post_purchase_confirmation | /api/checkout(transferencia) | inmediato | Confirmacion de orden |
| post_purchase_tips | webhook MP (pagado) | 3 dias | Tips de uso del producto |
| post_purchase_review_request | webhook MP (pagado) | 7 dias | Pedir resena |
| post_purchase_cross_sell | webhook MP (pagado) | 14 dias | Ofrecer productos complementarios |
| abandoned_cart_1h | /api/carritos/abandoned | scheduledFor + 1h | Recordatorio carrito |
| abandoned_cart_24h | /api/carritos/abandoned | scheduledFor + 24h | Con objeciones |
| abandoned_cart_48h | /api/carritos/abandoned | scheduledFor + 48h | Con incentivo extra |
| newsletter_send | /api/newsletter (admin) | inmediato | Envio manual |
| winback_60d | Schedule diario (futuro) | -- | Clientes sin compra 60d |
| sunset_cleanup | Schedule mensual | -- | Suscriptores inactivos 90d |

---

## Proximos pasos (opcionales)

- **Flujo winback_60d**: crear un Schedule diario que query Pedidos y busque emails sin compras en 60 dias, y encole `winback_60d` para cada uno.
- **Email open tracking**: implementar pixel tracking con endpoint `/api/email/track?id=xxx` que actualice `abierto = true` en EmailsLog.
- **A/B testing de asuntos**: agregar campo `asunto_variant` a eventos y que el flujo elija aleatoriamente.

## Generar unsubscribe token en n8n

El endpoint `GET /api/email/unsubscribe` ahora requiere un token HMAC firmado
(defensa anti-CSRF: evita que alguien desuscriba a cualquier email conocido).
Antes de enviar cada email, generar el link con un Function node:

```javascript
const crypto = require('crypto');
const secret = $env.NEXTAUTH_SECRET;
const email = item.json.email.toLowerCase();
const hmac = crypto.createHmac('sha256', secret).update(email).digest('hex');
const encoded = Buffer.from(item.json.email).toString('base64url');
const token = `${encoded}.${hmac}`;
const unsubscribeUrl = `${$env.BRAND_URL}/api/email/unsubscribe?token=${token}`;
return { unsubscribeUrl };
```

Requiere las env vars `NEXTAUTH_SECRET` (mismo valor que el sitio Next.js) y
`BRAND_URL` (por ejemplo `https://aoura.com.ar`) en n8n.
