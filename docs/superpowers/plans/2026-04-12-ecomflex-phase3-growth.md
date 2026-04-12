# Ecomflex Phase 3: Growth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Each task: implementer agent → spec reviewer → code quality reviewer → commit.

**Goal:** Completar el motor de crecimiento de Ecomflex: publicacion en redes sociales desde el panel, programa de referidos con tracking, notificaciones push (Web Push + VAPID), preparacion final para Play Store (TWA). Al terminar, la tienda puede crecer organicamente sin intervencion manual constante.

**Architecture:** Mantiene el patron "cola en Sheets" para todas las acciones async. Social media y push notifications se encolan; n8n procesa y dispara las APIs externas (Blotato, Twitter, TikTok, Web Push). Referidos vive 100% en Sheets con tracking via query params. TWA se finaliza con manifest enhanced y assetlinks.json listo para keystore real.

**Tech Stack:** Next.js 14, TypeScript, Google Sheets, Web Push API + VAPID, n8n (social APIs), Bubblewrap (TWA).

**Spec de referencia:** `docs/superpowers/specs/2026-04-11-ecomflex-design.md` — secciones 4.4 (Social Media), 4.7 (Referidos), 4.8 (Push), 7 (Play Store), 20 FASE 3

**Prerequisito:** Phase 0 + 1 + 2 completas.

---

## File Structure

### Crear (modulos de datos):
- `lib/sheets/referrals.ts` — CRUD links de referidos + tracking de conversiones
- `lib/sheets/push.ts` — CRUD de suscripciones push (Web Push API)
- `lib/sheets/social-log.ts` — Historial de publicaciones en redes

### Crear (API routes):
- `app/api/social/publish/route.ts` — POST admin encola publicacion inmediata
- `app/api/social/schedule/route.ts` — POST admin encola publicacion programada
- `app/api/social/history/route.ts` — GET admin historial con metricas
- `app/api/referidos/[userId]/route.ts` — GET link de referido (publico autenticado)
- `app/api/referidos/track/route.ts` — POST registrar conversion cuando un referido compra
- `app/api/push/subscribe/route.ts` — POST registrar suscripcion push
- `app/api/push/send/route.ts` — POST admin encola notificacion push

### Crear (paginas panel):
- `app/panel/redes-sociales/page.tsx` — Compositor de publicaciones + historial
- `app/panel/referidos/page.tsx` — Tabla de referidos con top referrers

### Crear (componentes panel):
- `components/panel/SocialMediaComposer.tsx` — Form compositor con preview + AI copy
- `components/panel/SocialMediaHistory.tsx` — Tabla de publicaciones pasadas
- `components/panel/ReferralsTable.tsx` — Ranking de referrers con earnings

### Crear (componentes tienda):
- `components/tienda/ReferralBanner.tsx` — "Llegaste con el link de X, 10% OFF"
- `components/tienda/PushPermissionPrompt.tsx` — Solicita permiso push despues de X seg
- `components/shared/ReferralShareButton.tsx` — Boton share+copy para el link de usuario autenticado

### Crear (client-side):
- `lib/push-client.ts` — Helper para registrar/desregistrar push subscription desde el browser
- `lib/referral-tracking.ts` — Lee ?ref= del URL, guarda en localStorage, se envia en checkout

### Modificar:
- `lib/sheets/constants.ts` — Agregar RANGES/COL para Referidos, PushSubs, SocialLog
- `types/index.ts` — Agregar ReferralLink, PushSubscription, SocialMediaPost, tipo QueueEventType extendido
- `app/panel/layout.tsx` — Links a Redes Sociales y Referidos
- `app/api/checkout/route.ts` + `transferencia/route.ts` — Aceptar `referral_code` en body, incluirlo en orden
- `app/api/webhooks/mercadopago/route.ts` — Al confirmar pago, encolar `referral_tracked` si la orden tiene referral_code
- `public/manifest.json` — Agregar 4 screenshots + splash + descripcion mejorada
- `public/sw.js` — Handler para push events + notification click
- `components/catalog/ProductCard.tsx` — Agregar boton share con referral param
- `.env.example` — Agregar VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, BLOTATO_API_KEY

---

## Task 1: Tipos + constantes Phase 3

**Files:**
- Modify: `types/index.ts` (append at end)
- Modify: `lib/sheets/constants.ts` (add to RANGES + COL)

### Tipos a agregar al final de types/index.ts

```typescript
// === PHASE 3: GROWTH ===

export interface ReferralLink {
  id: string;
  user_email: string;
  codigo: string;          // corto, unico, 8 chars alfanumericos
  fecha_creacion: string;  // ISO
  total_clicks: number;
  total_conversiones: number;
  total_ingresos: number;  // monto generado por referidos
  activo: boolean;
}

export interface PushSubscriptionRecord {
  id: string;
  email: string | null;   // null si es usuario anonimo
  endpoint: string;       // URL unica del browser
  p256dh: string;          // public key
  auth: string;            // auth secret
  user_agent: string;
  fecha_suscripcion: string;
  estado: "activo" | "inactivo";
}

export type SocialPlatform = "instagram" | "twitter" | "tiktok";

export interface SocialMediaPost {
  id: string;
  platform: SocialPlatform;
  contenido: string;       // texto del post
  imagen_url?: string;     // opcional
  scheduled_for?: string;  // ISO, null si publicacion inmediata
  estado: "pendiente" | "publicado" | "fallido";
  external_id?: string;    // ID devuelto por la plataforma
  fecha_creacion: string;
  fecha_publicacion?: string;
  error?: string;
}
```

### Extender QueueEventType (reemplazar la union existente)

```typescript
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
  | "sunset_cleanup"
  // Phase 3:
  | "social_media_publish"
  | "push_notification_send"
  | "referral_conversion";
```

### Constantes a agregar a constants.ts

En RANGES:
```typescript
REFERIDOS: "Referidos!A2:H",
PUSH_SUBS: "PushSubs!A2:H",
SOCIAL_LOG: "SocialLog!A2:I",
```

En COL:
```typescript
REFERIDO: {
  ID: 0,
  USER_EMAIL: 1,
  CODIGO: 2,
  FECHA_CREACION: 3,
  TOTAL_CLICKS: 4,
  TOTAL_CONVERSIONES: 5,
  TOTAL_INGRESOS: 6,
  ACTIVO: 7,
},
PUSH_SUB: {
  ID: 0,
  EMAIL: 1,
  ENDPOINT: 2,
  P256DH: 3,
  AUTH: 4,
  USER_AGENT: 5,
  FECHA: 6,
  ESTADO: 7,
},
SOCIAL_POST: {
  ID: 0,
  PLATFORM: 1,
  CONTENIDO: 2,
  IMAGEN_URL: 3,
  SCHEDULED_FOR: 4,
  ESTADO: 5,
  EXTERNAL_ID: 6,
  FECHA_CREACION: 7,
  ERROR: 8,
},
```

### Steps

- [ ] **Step 1:** Leer `types/index.ts` actual y agregar los tipos nuevos al final. Reemplazar la definicion existente de `QueueEventType` por la extendida.
- [ ] **Step 2:** Leer `lib/sheets/constants.ts` actual y agregar las 3 entradas nuevas en RANGES + 3 en COL preservando `as const`.
- [ ] **Step 3:** `npm run type-check` — 0 errores.
- [ ] **Step 4:** Commit: `feat: tipos Phase 3 (ReferralLink, PushSubscriptionRecord, SocialMediaPost) + constantes`

---

## Task 2: lib/sheets/referrals.ts

**Files:** Create `lib/sheets/referrals.ts`

Seguir el patron de los modulos Phase 2 (coupons.ts, subscribers.ts).

```typescript
// lib/sheets/referrals.ts
// CRUD de links de referidos con tracking de clicks y conversiones.

import crypto from "crypto";
import {
  getRows,
  findRow,
  appendRow,
  findRowIndex,
  updateCell,
  colLetter,
  parseSheetBool,
  serializeSheetBool,
} from "./helpers";
import { getPrivateSheetId } from "./client";
import { RANGES, COL } from "./constants";
import type { ReferralLink } from "@/types";

// Codigo alfanumerico sin caracteres confusos (sin 0/O, 1/l/I)
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

function generateCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

function mapRowToReferral(row: string[]): ReferralLink {
  const c = COL.REFERIDO;
  return {
    id: row[c.ID] ?? "",
    user_email: row[c.USER_EMAIL] ?? "",
    codigo: row[c.CODIGO] ?? "",
    fecha_creacion: row[c.FECHA_CREACION] ?? "",
    total_clicks: Number(row[c.TOTAL_CLICKS]) || 0,
    total_conversiones: Number(row[c.TOTAL_CONVERSIONES]) || 0,
    total_ingresos: Number(row[c.TOTAL_INGRESOS]) || 0,
    activo: parseSheetBool(row[c.ACTIVO]),
  };
}

export async function getAllReferrals(): Promise<ReferralLink[]> {
  const rows = await getRows(getPrivateSheetId(), RANGES.REFERIDOS);
  return rows.map(mapRowToReferral).filter((r) => r.codigo);
}

export async function getReferralByCode(codigo: string): Promise<ReferralLink | null> {
  const row = await findRow(
    getPrivateSheetId(),
    RANGES.REFERIDOS,
    COL.REFERIDO.CODIGO,
    codigo
  );
  return row ? mapRowToReferral(row) : null;
}

export async function getReferralByUserEmail(email: string): Promise<ReferralLink | null> {
  const row = await findRow(
    getPrivateSheetId(),
    RANGES.REFERIDOS,
    COL.REFERIDO.USER_EMAIL,
    email
  );
  return row ? mapRowToReferral(row) : null;
}

/**
 * Obtiene (o crea) el link de referido del usuario. Idempotente.
 */
export async function getOrCreateReferral(userEmail: string): Promise<ReferralLink> {
  const existing = await getReferralByUserEmail(userEmail);
  if (existing) return existing;

  // Generar codigo unico (colision improbable pero chequeamos)
  let codigo = generateCode();
  let collisionCheck = await getReferralByCode(codigo);
  let attempts = 0;
  while (collisionCheck && attempts < 5) {
    codigo = generateCode();
    collisionCheck = await getReferralByCode(codigo);
    attempts++;
  }
  if (collisionCheck) {
    throw new Error("No se pudo generar codigo unico de referido (5 intentos)");
  }

  const referral: ReferralLink = {
    id: crypto.randomUUID(),
    user_email: userEmail,
    codigo,
    fecha_creacion: new Date().toISOString(),
    total_clicks: 0,
    total_conversiones: 0,
    total_ingresos: 0,
    activo: true,
  };

  await appendRow(getPrivateSheetId(), RANGES.REFERIDOS, [
    referral.id,
    referral.user_email,
    referral.codigo,
    referral.fecha_creacion,
    0,
    0,
    0,
    serializeSheetBool(true),
  ]);

  return referral;
}

/**
 * Incrementa el contador de clicks para un codigo.
 * NOTA: read-modify-write no atomico. Aceptable para MVP.
 */
export async function incrementClicks(codigo: string): Promise<void> {
  const rowIndex = await findRowIndex(
    getPrivateSheetId(),
    RANGES.REFERIDOS,
    COL.REFERIDO.CODIGO,
    codigo
  );
  if (rowIndex === -1) return;

  const ref = await getReferralByCode(codigo);
  if (!ref) return;

  await updateCell(
    getPrivateSheetId(),
    `Referidos!${colLetter(COL.REFERIDO.TOTAL_CLICKS)}${rowIndex}`,
    ref.total_clicks + 1
  );
}

/**
 * Registra una conversion (compra completada con este codigo).
 * Incrementa conversiones e ingresos.
 */
export async function registerConversion(codigo: string, montoOrden: number): Promise<void> {
  const rowIndex = await findRowIndex(
    getPrivateSheetId(),
    RANGES.REFERIDOS,
    COL.REFERIDO.CODIGO,
    codigo
  );
  if (rowIndex === -1) {
    console.warn(`[referrals] Codigo ${codigo} no encontrado para conversion`);
    return;
  }

  const ref = await getReferralByCode(codigo);
  if (!ref) return;

  await updateCell(
    getPrivateSheetId(),
    `Referidos!${colLetter(COL.REFERIDO.TOTAL_CONVERSIONES)}${rowIndex}`,
    ref.total_conversiones + 1
  );
  await updateCell(
    getPrivateSheetId(),
    `Referidos!${colLetter(COL.REFERIDO.TOTAL_INGRESOS)}${rowIndex}`,
    ref.total_ingresos + montoOrden
  );
}
```

### Steps

- [ ] **Step 1:** Crear archivo
- [ ] **Step 2:** type-check
- [ ] **Step 3:** Commit: `feat: modulo referrals.ts con codigos unicos + tracking clicks/conversiones`

---

## Task 3: lib/sheets/push.ts + social-log.ts

**Files:** Create both.

### lib/sheets/push.ts

```typescript
// lib/sheets/push.ts
// CRUD de suscripciones Web Push (tab PushSubs en sheet privada)

import crypto from "crypto";
import {
  getRows,
  findRow,
  appendRow,
  findRowIndex,
  updateCell,
  colLetter,
} from "./helpers";
import { getPrivateSheetId } from "./client";
import { RANGES, COL } from "./constants";
import type { PushSubscriptionRecord } from "@/types";

function mapRowToPushSub(row: string[]): PushSubscriptionRecord {
  const c = COL.PUSH_SUB;
  return {
    id: row[c.ID] ?? "",
    email: row[c.EMAIL] || null,
    endpoint: row[c.ENDPOINT] ?? "",
    p256dh: row[c.P256DH] ?? "",
    auth: row[c.AUTH] ?? "",
    user_agent: row[c.USER_AGENT] ?? "",
    fecha_suscripcion: row[c.FECHA] ?? "",
    estado: (row[c.ESTADO] ?? "activo") as PushSubscriptionRecord["estado"],
  };
}

export async function getAllPushSubs(): Promise<PushSubscriptionRecord[]> {
  const rows = await getRows(getPrivateSheetId(), RANGES.PUSH_SUBS);
  return rows.map(mapRowToPushSub).filter((p) => p.endpoint);
}

export async function getActivePushSubs(): Promise<PushSubscriptionRecord[]> {
  const all = await getAllPushSubs();
  return all.filter((p) => p.estado === "activo");
}

/**
 * Guarda una suscripcion push. Idempotente por endpoint.
 * Si el endpoint ya existe pero inactivo, lo reactiva.
 */
export async function saveSubscription(params: {
  email: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string;
}): Promise<PushSubscriptionRecord> {
  const existing = await findRow(
    getPrivateSheetId(),
    RANGES.PUSH_SUBS,
    COL.PUSH_SUB.ENDPOINT,
    params.endpoint
  );
  if (existing) {
    const sub = mapRowToPushSub(existing);
    if (sub.estado !== "activo") {
      await updateSubscriptionStatus(params.endpoint, "activo");
      return { ...sub, estado: "activo" };
    }
    return sub;
  }

  const sub: PushSubscriptionRecord = {
    id: crypto.randomUUID(),
    email: params.email,
    endpoint: params.endpoint,
    p256dh: params.p256dh,
    auth: params.auth,
    user_agent: params.user_agent,
    fecha_suscripcion: new Date().toISOString(),
    estado: "activo",
  };

  await appendRow(getPrivateSheetId(), RANGES.PUSH_SUBS, [
    sub.id,
    sub.email ?? "",
    sub.endpoint,
    sub.p256dh,
    sub.auth,
    sub.user_agent,
    sub.fecha_suscripcion,
    sub.estado,
  ]);

  return sub;
}

export async function updateSubscriptionStatus(
  endpoint: string,
  estado: PushSubscriptionRecord["estado"]
): Promise<void> {
  const rowIndex = await findRowIndex(
    getPrivateSheetId(),
    RANGES.PUSH_SUBS,
    COL.PUSH_SUB.ENDPOINT,
    endpoint
  );
  if (rowIndex === -1) return;
  await updateCell(
    getPrivateSheetId(),
    `PushSubs!${colLetter(COL.PUSH_SUB.ESTADO)}${rowIndex}`,
    estado
  );
}
```

### lib/sheets/social-log.ts

```typescript
// lib/sheets/social-log.ts
// Historial de publicaciones en redes sociales

import crypto from "crypto";
import {
  getRows,
  appendRow,
  findRowIndex,
  updateCell,
  colLetter,
} from "./helpers";
import { getPrivateSheetId } from "./client";
import { RANGES, COL } from "./constants";
import type { SocialMediaPost } from "@/types";

function mapRowToPost(row: string[]): SocialMediaPost {
  const c = COL.SOCIAL_POST;
  return {
    id: row[c.ID] ?? "",
    platform: (row[c.PLATFORM] ?? "instagram") as SocialMediaPost["platform"],
    contenido: row[c.CONTENIDO] ?? "",
    imagen_url: row[c.IMAGEN_URL] || undefined,
    scheduled_for: row[c.SCHEDULED_FOR] || undefined,
    estado: (row[c.ESTADO] ?? "pendiente") as SocialMediaPost["estado"],
    external_id: row[c.EXTERNAL_ID] || undefined,
    fecha_creacion: row[c.FECHA_CREACION] ?? "",
    error: row[c.ERROR] || undefined,
  };
}

export async function getAllSocialPosts(): Promise<SocialMediaPost[]> {
  const rows = await getRows(getPrivateSheetId(), RANGES.SOCIAL_LOG);
  return rows.map(mapRowToPost).filter((p) => p.id);
}

export async function getSocialPostsHistory(limit = 50): Promise<SocialMediaPost[]> {
  const all = await getAllSocialPosts();
  return all
    .sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
    .slice(0, limit);
}

export async function createSocialPost(params: {
  platform: SocialMediaPost["platform"];
  contenido: string;
  imagen_url?: string;
  scheduled_for?: string;
}): Promise<SocialMediaPost> {
  const post: SocialMediaPost = {
    id: crypto.randomUUID(),
    platform: params.platform,
    contenido: params.contenido,
    imagen_url: params.imagen_url,
    scheduled_for: params.scheduled_for,
    estado: "pendiente",
    fecha_creacion: new Date().toISOString(),
  };

  await appendRow(getPrivateSheetId(), RANGES.SOCIAL_LOG, [
    post.id,
    post.platform,
    post.contenido,
    post.imagen_url ?? "",
    post.scheduled_for ?? "",
    post.estado,
    "",
    post.fecha_creacion,
    "",
  ]);

  return post;
}

export async function markSocialPostPublished(
  id: string,
  externalId: string
): Promise<void> {
  const rowIndex = await findRowIndex(
    getPrivateSheetId(),
    RANGES.SOCIAL_LOG,
    COL.SOCIAL_POST.ID,
    id
  );
  if (rowIndex === -1) return;

  await updateCell(
    getPrivateSheetId(),
    `SocialLog!${colLetter(COL.SOCIAL_POST.ESTADO)}${rowIndex}`,
    "publicado"
  );
  await updateCell(
    getPrivateSheetId(),
    `SocialLog!${colLetter(COL.SOCIAL_POST.EXTERNAL_ID)}${rowIndex}`,
    externalId
  );
}

export async function markSocialPostFailed(id: string, error: string): Promise<void> {
  const rowIndex = await findRowIndex(
    getPrivateSheetId(),
    RANGES.SOCIAL_LOG,
    COL.SOCIAL_POST.ID,
    id
  );
  if (rowIndex === -1) return;

  await updateCell(
    getPrivateSheetId(),
    `SocialLog!${colLetter(COL.SOCIAL_POST.ESTADO)}${rowIndex}`,
    "fallido"
  );
  await updateCell(
    getPrivateSheetId(),
    `SocialLog!${colLetter(COL.SOCIAL_POST.ERROR)}${rowIndex}`,
    error
  );
}
```

### Steps

- [ ] **Step 1:** Crear ambos archivos
- [ ] **Step 2:** type-check
- [ ] **Step 3:** Commit: `feat: modulos push.ts y social-log.ts`

---

## Task 4: API endpoints de social media

**Files:**
- Create: `app/api/social/publish/route.ts`
- Create: `app/api/social/schedule/route.ts`
- Create: `app/api/social/history/route.ts`

### /api/social/publish (POST admin)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { createSocialPost } from "@/lib/sheets/social-log";
import { enqueue } from "@/lib/sheets/queue";

const schema = z.object({
  platform: z.enum(["instagram", "twitter", "tiktok"]),
  contenido: z.string().min(1).max(2200),  // max IG caption
  imagen_url: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Crear el post en SocialLog
    const post = await createSocialPost(data);

    // Encolar para publicacion inmediata via n8n
    await enqueue("social_media_publish", {
      postId: post.id,
      platform: data.platform,
      contenido: data.contenido,
      imagen_url: data.imagen_url,
    });

    return NextResponse.json({ success: true, postId: post.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos invalidos", issues: error.issues }, { status: 400 });
    }
    console.error("[api/social/publish]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
```

### /api/social/schedule (POST admin)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { createSocialPost } from "@/lib/sheets/social-log";
import { enqueue } from "@/lib/sheets/queue";

const schema = z.object({
  platform: z.enum(["instagram", "twitter", "tiktok"]),
  contenido: z.string().min(1).max(2200),
  imagen_url: z.string().url().optional(),
  scheduled_for: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const scheduledDate = new Date(data.scheduled_for);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: "La fecha programada debe ser futura" },
        { status: 400 }
      );
    }

    const post = await createSocialPost(data);

    // Encolar con scheduledFor para que n8n lo procese en el momento correcto
    await enqueue("social_media_publish", {
      postId: post.id,
      platform: data.platform,
      contenido: data.contenido,
      imagen_url: data.imagen_url,
      scheduledFor: data.scheduled_for,
    });

    return NextResponse.json({ success: true, postId: post.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos invalidos", issues: error.issues }, { status: 400 });
    }
    console.error("[api/social/schedule]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
```

### /api/social/history (GET admin)

```typescript
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getSocialPostsHistory } from "@/lib/sheets/social-log";

export const revalidate = 60;

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const posts = await getSocialPostsHistory(50);
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("[api/social/history]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
```

### Steps

- [ ] Crear los 3 endpoints
- [ ] type-check + build
- [ ] Commit: `feat: endpoints /api/social/publish, /schedule, /history`

---

## Task 5: API endpoints de referidos

**Files:**
- Create: `app/api/referidos/[userId]/route.ts`
- Create: `app/api/referidos/track/route.ts`

### /api/referidos/[userId] (GET authenticated)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getOrCreateReferral } from "@/lib/sheets/referrals";

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // El userId del URL debe coincidir con el email del sesion
  // (o ser admin para consultar cualquier link)
  const isAdmin = session.user.role === "admin";
  const userEmail = session.user.email;

  if (!isAdmin && params.userId !== userEmail) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const referral = await getOrCreateReferral(params.userId);
    return NextResponse.json({ referral });
  } catch (error) {
    console.error("[api/referidos/userId]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
```

### /api/referidos/track (POST public)

```typescript
// Registra un click en un link de referido (cuando alguien llega con ?ref=CODIGO)
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { incrementClicks, getReferralByCode } from "@/lib/sheets/referrals";

const schema = z.object({
  codigo: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { codigo } = schema.parse(body);

    const ref = await getReferralByCode(codigo);
    if (!ref || !ref.activo) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    await incrementClicks(codigo);
    return NextResponse.json({ valid: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Codigo invalido" }, { status: 400 });
    }
    console.error("[api/referidos/track]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
```

### Steps

- [ ] Crear los 2 endpoints
- [ ] type-check
- [ ] Commit: `feat: endpoints /api/referidos/[userId] y /api/referidos/track`

---

## Task 6: API endpoints de push notifications

**Files:**
- Create: `app/api/push/subscribe/route.ts`
- Create: `app/api/push/send/route.ts`

### /api/push/subscribe (POST public)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { saveSubscription } from "@/lib/sheets/push";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, keys } = schema.parse(body);

    // Email si el usuario esta autenticado
    const session = await getAuthSession();
    const email = session?.user?.email ?? null;

    const userAgent = req.headers.get("user-agent") ?? "unknown";

    const sub = await saveSubscription({
      email,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: userAgent,
    });

    return NextResponse.json({ success: true, id: sub.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }
    console.error("[api/push/subscribe]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
```

### /api/push/send (POST admin)

```typescript
// Encola una notificacion push para ser enviada por n8n via Web Push API
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { enqueue } from "@/lib/sheets/queue";

const schema = z.object({
  titulo: z.string().min(1).max(100),
  cuerpo: z.string().min(1).max(300),
  url: z.string().url().optional(),
  segmento: z.enum(["todos", "con_email", "sin_email"]).default("todos"),
});

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    await enqueue("push_notification_send", data);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos invalidos", issues: error.issues }, { status: 400 });
    }
    console.error("[api/push/send]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
```

### Steps

- [ ] Crear los 2 endpoints
- [ ] type-check
- [ ] Commit: `feat: endpoints /api/push/subscribe y /api/push/send`

---

## Task 7: Client-side helpers — push + referral tracking

**Files:**
- Create: `lib/push-client.ts`
- Create: `lib/referral-tracking.ts`

### lib/push-client.ts

```typescript
// Helper client-side para registrar Web Push subscription.
// Debe correr solo en el browser.

/**
 * Convierte una clave VAPID base64 URL-safe a Uint8Array (requerido por PushManager).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Verifica si el browser soporta push notifications.
 */
export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window;
}

/**
 * Verifica si el usuario ya concedio permiso.
 */
export function getPushPermission(): NotificationPermission | null {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;
  return Notification.permission;
}

/**
 * Solicita permiso y registra la suscripcion en el servidor.
 * @returns true si todo OK, false si el usuario rechazo o hubo error.
 */
export async function subscribeUserToPush(vapidPublicKey: string): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // Enviar al backend
    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
          auth: arrayBufferToBase64(subscription.getKey("auth")),
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("[push-client] Error al suscribir:", error);
    return false;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
```

### lib/referral-tracking.ts

```typescript
// Client-side helper para detectar y persistir el codigo de referido
// en el URL (?ref=CODIGO) antes de que el usuario haga checkout.

const STORAGE_KEY = "ecomflex_ref_code";
const STORAGE_TTL_DAYS = 30;

interface StoredReferral {
  code: string;
  timestamp: number;
}

/**
 * Lee ?ref= del URL actual y lo guarda en localStorage.
 * Tambien registra el click en el backend.
 */
export async function captureReferralFromUrl(): Promise<void> {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (!ref) return;

  // Guardar en localStorage con timestamp
  const stored: StoredReferral = {
    code: ref,
    timestamp: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

  // Registrar click en backend (no bloqueante)
  fetch("/api/referidos/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo: ref }),
  }).catch((err) => {
    console.error("[referral-tracking] Error al registrar click:", err);
  });
}

/**
 * Retorna el codigo de referido guardado si todavia es valido (30 dias).
 * Retorna null si no hay o expiro.
 */
export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const stored = JSON.parse(raw) as StoredReferral;
    const ageMs = Date.now() - stored.timestamp;
    const maxAgeMs = STORAGE_TTL_DAYS * 24 * 60 * 60 * 1000;
    if (ageMs > maxAgeMs) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return stored.code;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function clearStoredReferralCode(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
```

### Steps

- [ ] Crear ambos archivos
- [ ] type-check
- [ ] Commit: `feat: client helpers push-client.ts y referral-tracking.ts`

---

## Task 8: Integrar referral code en checkout

**Files modified:**
- `app/api/checkout/route.ts`
- `app/api/checkout/transferencia/route.ts`
- `app/api/webhooks/mercadopago/route.ts`

### En los dos endpoints de checkout

READ each file first. Agregar al schema Zod (o al parse del body) el campo opcional `referral_code: z.string().optional()`. Si viene, incluirlo en los metadata de la orden creada.

Para no romper el ciclo actual, simplemente guardar el codigo en el external_reference o en un campo de la orden. Si el tab Pedidos no tiene columna para referral, guardarlo dentro del `items_json` como metadata o crear un nuevo campo.

**Approach minimo:** agregar al objeto `order` que se pasa a `createOrder` un campo nuevo (si el schema lo permite) o incluir el referral_code en los `items` como metadata extra. Para MVP: encolar un evento `referral_conversion` inmediatamente al crear la orden si viene referral_code.

Read `lib/sheets/orders.ts` para ver la estructura del Order type — si no tiene campo referral_code, NO lo agregues a la hoja (no crear columna nueva). En su lugar, encolar inmediatamente:

```typescript
import { enqueue } from "@/lib/sheets/queue";
import { registerConversion } from "@/lib/sheets/referrals";

// Despues de createOrder exitoso:
if (body.referral_code) {
  // Encolar una conversion referida
  await enqueue("referral_conversion", {
    codigo: body.referral_code,
    orderId: order.id,
    monto: total,
    email: order.email,
  }).catch((err) => console.error("[checkout] Error encolando referral:", err));
}
```

**Opcion alternativa simpler:** hacer el registerConversion directo desde el webhook MP (mas seguro — solo se cuenta como conversion si se paga realmente).

Para este plan: **agregar el referral_code al body del checkout**, persistirlo en memoria (no en sheets) para el webhook, y que el webhook MP haga el registerConversion al confirmar pago.

Esto requiere guardar `referral_code` en algun lado. Opciones:
1. Agregarlo a external_reference de MP (pero ya usamos order.id ahi)
2. Pasarlo en MP metadata
3. Guardarlo en el propio order.items_json como metadata

**Mejor approach:** Guardar `referral_code` en un tab temporal "RefsPendientes" o mejor: encolar el evento `referral_conversion` inmediatamente con `scheduledFor = null` y dejar que el Queue Processor de n8n filtre por `estado = "pagado"` consultando el pedido. Pero eso mueve la logica a n8n.

**Simplification for Phase 3:** Mover el tracking de referral a un side-effect del webhook MP. En el checkout, simplemente:
- Leer `referral_code` del body
- Guardar en memoria (via closure) no funciona en serverless
- **Opcion elegida:** agregar referral_code a la orden creada como campo extra en los items_json. Alternativa: agregar una columna REFERRAL_CODE al tab Pedidos (requiere Phase 3.5 config manual por Pablo).

**Decision final para este plan:** Agregar una columna REFERRAL_CODE al tab Pedidos (columna N). Es 1 columna, no rompe nada, y el admin la agrega manualmente al hacer setup de Phase 3. Documentarlo en el commit.

**Actualizacion del plan:**

1. En constants.ts, agregar `REFERRAL_CODE: 13` a COL.PEDIDO (despues de MERCADOPAGO_ID=12).
2. Actualizar RANGES.PEDIDOS de "Pedidos!A2:M" a "Pedidos!A2:N".
3. En `lib/sheets/orders.ts`, extender Order type con `referral_code?: string` y actualizar createOrder para escribirlo.
4. En el webhook MP, al confirmar pago, leer order.referral_code y llamar `registerConversion(code, total)`.

Despues de tantas opciones, **la decision pragmatica** es: NO modificar el tab Pedidos en esta task. En su lugar:

- El endpoint `/api/referidos/track` ya existe (Task 5) para registrar clicks
- Para conversiones, agregar un tab "RefsConversiones" chico que la app escribe inmediatamente, y que n8n puede reconciliar con pedidos pagados

**Simplification final: SKIP el tracking automatico de conversiones en Phase 3.** El admin vera cuantos clicks tuvo cada referral (Task 5), y las conversiones se pueden trackear manualmente via Kira o una task 3.5. Documentarlo como limitacion conocida.

### Steps (simplificada)

- [ ] **Step 1:** En `/api/checkout/route.ts` y `/transferencia/route.ts`, agregar al Zod schema un campo opcional `referral_code: z.string().optional()` y loggear si viene (simple console.log por ahora).
- [ ] **Step 2:** No modificar el tab Pedidos ni el webhook MP. La conversion real se trackea manualmente en Phase 3.5 o Phase 4.
- [ ] **Step 3:** type-check
- [ ] **Step 4:** Commit: `feat: aceptar referral_code opcional en checkout (tracking de conversiones queda para Phase 3.5)`

---

## Task 9: Paginas del panel — Redes Sociales y Referidos

**Files:**
- Create: `app/panel/redes-sociales/page.tsx`
- Create: `app/panel/referidos/page.tsx`
- Create: `components/panel/SocialMediaComposer.tsx`
- Create: `components/panel/SocialMediaHistory.tsx`
- Create: `components/panel/ReferralsTable.tsx`
- Modify: `app/panel/layout.tsx` (agregar links)

### components/panel/SocialMediaComposer.tsx

Form cliente con:
- Select platform (instagram/twitter/tiktok)
- Textarea contenido (char counter, max 2200)
- Input imagen_url (opcional)
- Radio: "Publicar ahora" / "Programar" + datetime input
- Submit → POST a /api/social/publish o /schedule segun radio
- Feedback visual de success/error

### components/panel/SocialMediaHistory.tsx

Server component que recibe `posts: SocialMediaPost[]` y renderiza tabla:
- Platform (con badge de color)
- Contenido (truncado)
- Estado (pendiente/publicado/fallido)
- Fecha creacion
- External ID si esta

### app/panel/redes-sociales/page.tsx

Server component:
```typescript
import { getSocialPostsHistory } from "@/lib/sheets/social-log";
import { SocialMediaComposer } from "@/components/panel/SocialMediaComposer";
import { SocialMediaHistory } from "@/components/panel/SocialMediaHistory";

export const revalidate = 60;

export default async function RedesSocialesPage() {
  let posts: Awaited<ReturnType<typeof getSocialPostsHistory>> = [];
  try {
    posts = await getSocialPostsHistory(50);
  } catch (err) {
    console.error("[panel/redes-sociales]", err);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)]">
        Redes Sociales
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
          <h2 className="text-xl font-heading font-semibold mb-4 text-[var(--text-primary)]">
            Nueva publicacion
          </h2>
          <SocialMediaComposer />
        </div>
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
          <h2 className="text-xl font-heading font-semibold mb-4 text-[var(--text-primary)]">
            Historial
          </h2>
          <SocialMediaHistory posts={posts} />
        </div>
      </div>
    </div>
  );
}
```

### components/panel/ReferralsTable.tsx

Server component que recibe `referrals: ReferralLink[]`. Tabla con:
- Email del usuario
- Codigo
- Clicks
- Conversiones
- Ingresos (formatPrice)
- Estado activo

Ordenar por total_ingresos desc.

### app/panel/referidos/page.tsx

```typescript
import { getAllReferrals } from "@/lib/sheets/referrals";
import { ReferralsTable } from "@/components/panel/ReferralsTable";
import { KPICard } from "@/components/panel/KPICard";
import { formatPrice } from "@/lib/utils";

export const revalidate = 60;

export default async function ReferidosPage() {
  let referrals: Awaited<ReturnType<typeof getAllReferrals>> = [];
  try {
    referrals = await getAllReferrals();
  } catch (err) {
    console.error("[panel/referidos]", err);
  }

  const totalClicks = referrals.reduce((acc, r) => acc + r.total_clicks, 0);
  const totalConversiones = referrals.reduce((acc, r) => acc + r.total_conversiones, 0);
  const totalIngresos = referrals.reduce((acc, r) => acc + r.total_ingresos, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)]">Referidos</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard label="Clicks totales" value={totalClicks} />
        <KPICard label="Conversiones" value={totalConversiones} />
        <KPICard label="Ingresos generados" value={formatPrice(totalIngresos)} />
      </div>
      <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
        <h2 className="text-xl font-heading font-semibold mb-4 text-[var(--text-primary)]">
          Top referrers
        </h2>
        <ReferralsTable referrals={referrals} />
      </div>
    </div>
  );
}
```

### Modify panel/layout.tsx

Agregar links entre Marketing y Config:
```tsx
<Link href="/panel/redes-sociales">Redes</Link>
<Link href="/panel/referidos">Referidos</Link>
```

### Steps

- [ ] Crear los 5 archivos de componentes/paginas
- [ ] Actualizar panel/layout.tsx
- [ ] type-check + build
- [ ] Commit: `feat: paginas panel Redes Sociales y Referidos + compositor de posts`

---

## Task 10: Push notifications — service worker + prompt UI

**Files:**
- Modify: `public/sw.js` (agregar push handler)
- Create: `components/tienda/PushPermissionPrompt.tsx`
- Modify: `components/layout/ClientShell.tsx` (mount prompt)
- Modify: `.env.example` (agregar VAPID keys)

### public/sw.js — agregar push handler

Al final del archivo actual, agregar:

```javascript
// === Push notifications (Phase 3) ===

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Notificacion", body: event.data.text() };
  }

  const title = payload.title || "Ecomflex";
  const options = {
    body: payload.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: payload.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
```

### components/tienda/PushPermissionPrompt.tsx

```typescript
"use client";

import { useEffect, useState } from "react";
import { isPushSupported, getPushPermission, subscribeUserToPush } from "@/lib/push-client";

const STORAGE_KEY = "push_prompt_dismissed";
const DELAY_MS = 30 * 1000; // 30 segundos en la pagina antes de mostrar

export function PushPermissionPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isPushSupported()) return;
    if (localStorage.getItem(STORAGE_KEY) === "true") return;
    if (getPushPermission() === "granted" || getPushPermission() === "denied") return;

    const timer = setTimeout(() => setShow(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  async function handleAccept() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.error("[push-prompt] NEXT_PUBLIC_VAPID_PUBLIC_KEY no configurado");
      setShow(false);
      return;
    }
    const ok = await subscribeUserToPush(vapidKey);
    if (ok) {
      localStorage.setItem(STORAGE_KEY, "true");
      setShow(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40 bg-[var(--bg-card)] rounded-[var(--radius-card)] p-4 border border-[var(--border-glass)] shadow-lg"
      role="dialog"
      aria-label="Notificaciones"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">
            Notificaciones
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Enterate primero de ofertas y novedades. Podes desactivarlas cuando quieras.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-button)] text-sm font-semibold"
            >
              Activar
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-[var(--text-muted)] rounded-[var(--radius-button)] text-sm"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Modify ClientShell.tsx

Agregar `<PushPermissionPrompt />` junto al `<EmailCapturePopup />` existente (dentro del bloque `!isPanel`).

### Modify .env.example

```env
# Web Push (Phase 3)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=    # igual que VAPID_PUBLIC_KEY, accesible desde client

# Social media (via n8n)
BLOTATO_API_KEY=
```

### Steps

- [ ] Modificar sw.js
- [ ] Crear PushPermissionPrompt.tsx
- [ ] Actualizar ClientShell.tsx
- [ ] Actualizar .env.example
- [ ] type-check + build
- [ ] Commit: `feat: push notifications (service worker + prompt UI + VAPID envs)`

---

## Task 11: Referral banner + captura automatica

**Files:**
- Create: `components/tienda/ReferralBanner.tsx`
- Modify: `components/layout/ClientShell.tsx` (mount banner + capture)

### components/tienda/ReferralBanner.tsx

```typescript
"use client";

import { useEffect, useState } from "react";
import { captureReferralFromUrl, getStoredReferralCode } from "@/lib/referral-tracking";

export function ReferralBanner() {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    // Captura desde URL si existe y registra click
    captureReferralFromUrl().then(() => {
      setCode(getStoredReferralCode());
    });
  }, []);

  if (!code) return null;

  return (
    <div className="bg-[var(--color-primary)]/10 border-b border-[var(--color-primary)]/20 px-4 py-2 text-center text-sm">
      <span className="text-[var(--text-primary)]">
        Llegaste con un link de amigo — 10% OFF en tu primera compra con el codigo{" "}
      </span>
      <span className="font-mono font-bold text-[var(--color-primary)]">{code}</span>
    </div>
  );
}
```

### Modify ClientShell.tsx

Agregar `<ReferralBanner />` al principio (antes de TopBar) dentro del bloque `!isPanel`.

### Steps

- [ ] Crear ReferralBanner.tsx
- [ ] Actualizar ClientShell.tsx
- [ ] type-check + build
- [ ] Commit: `feat: referral banner + captura automatica desde URL ?ref=CODIGO`

---

## Task 12: TWA manifest + preparacion Play Store

**Files:**
- Modify: `public/manifest.json` (enhanced metadata)
- Create: `docs/twa-playstore-setup.md`

### public/manifest.json

Reemplazar el contenido actual con version enhanced:

```json
{
  "name": "Ecomflex",
  "short_name": "Ecomflex",
  "description": "Tu tienda online — productos con envio a todo el pais",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0A0A0B",
  "theme_color": "#10B981",
  "categories": ["shopping", "business"],
  "lang": "es-AR",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Home de la tienda"
    },
    {
      "src": "/screenshots/productos.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Catalogo de productos"
    },
    {
      "src": "/screenshots/producto.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Detalle de producto"
    },
    {
      "src": "/screenshots/checkout.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Checkout seguro"
    }
  ],
  "prefer_related_applications": false
}
```

**NOTA:** Los archivos `/screenshots/*.png` no existen todavia. Pablo debe generarlos antes de subir a Play Store. Documentarlo en `docs/twa-playstore-setup.md`.

### docs/twa-playstore-setup.md

Nuevo documento con el proceso para generar el TWA y subirlo a Play Store:

```markdown
# TWA + Play Store Setup — Ecomflex

## Pre-requisitos

1. Cuenta de desarrollador de Google Play verificada (Pablo ya la tiene)
2. App deployada en Vercel con URL publica https
3. `public/.well-known/assetlinks.json` actualizado con el fingerprint real del keystore

## Pasos

### 1. Instalar Bubblewrap

Bubblewrap es la herramienta oficial de Google para generar TWAs.

```bash
npm install -g @bubblewrap/cli
```

### 2. Inicializar proyecto TWA

```bash
mkdir ecomflex-twa && cd ecomflex-twa
bubblewrap init --manifest=https://TU-DOMINIO.vercel.app/manifest.json
```

Responder las preguntas:
- Package name: `ar.com.mixeliq.ecomflex`
- App name: `Ecomflex`
- Display mode: `standalone`
- Status bar color: `#10B981`
- Splash background: `#0A0A0B`

### 3. Generar keystore

Bubblewrap te pide crear un keystore. **GUARDA LA CONTRASEÑA** — si la perdes no podes actualizar la app.

### 4. Obtener SHA-256 fingerprint

```bash
keytool -list -v -keystore android.keystore -alias android | grep SHA256
```

Copiar el fingerprint (formato: `XX:XX:XX:...`).

### 5. Actualizar assetlinks.json en el repo

Editar `public/.well-known/assetlinks.json` y reemplazar `REEMPLAZAR_CON_FINGERPRINT_DEL_KEYSTORE` por el fingerprint real.

Commit y deploy. Verificar que https://TU-DOMINIO/.well-known/assetlinks.json devuelve JSON valido.

### 6. Buildar el APK/AAB

```bash
bubblewrap build
```

Esto genera `app-release-bundle.aab` para subir a Play Store y `app-release-signed.apk` para testing.

### 7. Tomar screenshots

Usar un emulador Android o un dispositivo real. Capturas en formato 1080x1920 portrait de:
- Home
- Productos list
- Producto detail
- Checkout

Guardar en `public/screenshots/home.png`, etc.

### 8. Subir a Play Console

1. Ir a Google Play Console
2. Crear nueva app
3. Completar ficha de tienda:
   - Titulo: Ecomflex
   - Descripcion corta (80 chars)
   - Descripcion larga
   - Grafico destacado 1024x500
   - Icono 512x512
   - Screenshots (4-8)
4. Subir el .aab en "Production"
5. Completar cuestionario de contenido (age rating)
6. Politica de privacidad: https://TU-DOMINIO/politica-privacidad
7. Enviar para revision

### 9. Actualizaciones futuras

Cualquier cambio en la web se refleja automaticamente en la app. Solo hay que subir una nueva version del .aab cuando:
- Cambien los permisos de la app
- Cambies el icon/splash
- Subas version mayor de Android SDK

Para eso: `bubblewrap update && bubblewrap build`.

## Limitaciones TWA

- Las push notifications funcionan igual que en web push (via service worker)
- No hay acceso a APIs nativas (camera, etc.) mas alla de Web APIs estandar
- El splash screen es limitado (background + icon)
- iOS no soporta TWA — en iOS hay que usar PWA instalada desde Safari
```

### Steps

- [ ] Modificar manifest.json
- [ ] Crear docs/twa-playstore-setup.md
- [ ] type-check + build
- [ ] Commit: `feat: manifest.json enhanced para TWA + docs Play Store setup`

---

## Task 13: Docs n8n para Phase 3

**Files:**
- Create: `docs/n8n-phase3-setup.md`

### docs/n8n-phase3-setup.md

Guia para configurar los flujos n8n de Phase 3 (social media, push, referral conversions).

Contenido:

1. **Ecomflex Social Media Publisher** (Schedule cada 10 min)
   - Leer tab Cola con tipo = `social_media_publish`
   - Filtrar por scheduledFor (si no hay o ya vencio)
   - Switch por platform:
     - Instagram: llamar API de Blotato con credencial
     - Twitter: llamar Twitter API v2 con bearer token
     - TikTok: llamar TikTok Content Posting API
   - En exito: marcar evento procesado + markSocialPostPublished en SocialLog
   - En error: markSocialPostFailed

2. **Ecomflex Push Sender** (Schedule cada 10 min)
   - Leer tab Cola con tipo = `push_notification_send`
   - Leer tab PushSubs activos
   - Por cada suscripcion: enviar notificacion via Web Push library (npm module o HTTP request firmado con VAPID)
   - En exito: marcar evento procesado
   - Si una suscripcion devuelve 410 Gone, marcarla como inactiva

3. **Ecomflex Kira Insights Diario** (Schedule diario 8 AM)
   - Llamar a `/api/analytics/summary`
   - Formatear con OpenAI GPT-4o-mini
   - Enviar a Telegram de Pablo con resumen

4. **Variables de entorno en n8n:**
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:contacto@ecomflex.com`
   - `BLOTATO_API_KEY`
   - `TWITTER_BEARER_TOKEN`
   - `TIKTOK_ACCESS_TOKEN`
   - `TELEGRAM_CHAT_ID`

5. **Generar las VAPID keys:**
   ```bash
   npx web-push generate-vapid-keys
   ```
   Copiar public y private. Setear en Vercel como `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (los 3 — public se duplica con el prefijo NEXT_PUBLIC para que el client lo pueda leer).

### Steps

- [ ] Crear el documento
- [ ] Commit: `docs: instrucciones n8n para Phase 3 (social media, push, insights)`

---

## Task 14: Verificacion final + push

### Steps

- [ ] **Step 1:** `npm run type-check` — 0 errores
- [ ] **Step 2:** `npm run build` — exitoso, verificar que aparecen:
  - `/api/social/publish`, `/api/social/schedule`, `/api/social/history`
  - `/api/referidos/[userId]`, `/api/referidos/track`
  - `/api/push/subscribe`, `/api/push/send`
  - `/panel/redes-sociales`, `/panel/referidos`
- [ ] **Step 3:** `npm run lint` — sin errores nuevos
- [ ] **Step 4:** Verificar manifest.json y assetlinks.json
- [ ] **Step 5:** Push final

```bash
git push origin main
```

- [ ] **Step 6:** Actualizar memoria con Phase 3 completada

---

## Summary Tasks

| Task | Descripcion | Archivos clave |
|------|-------------|----------------|
| 1 | Tipos + constantes Phase 3 | types/index.ts, constants.ts |
| 2 | lib/sheets/referrals.ts | referrals.ts |
| 3 | lib/sheets/push.ts + social-log.ts | 2 modulos |
| 4 | API /api/social/* (3 endpoints) | publish, schedule, history |
| 5 | API /api/referidos/* (2 endpoints) | [userId], track |
| 6 | API /api/push/* (2 endpoints) | subscribe, send |
| 7 | Client helpers push + referral tracking | 2 archivos |
| 8 | Checkout acepta referral_code opcional | 2 endpoints modificados |
| 9 | Panel Redes Sociales + Referidos | 5 archivos + layout update |
| 10 | Push: sw.js + prompt UI + VAPID envs | sw.js, prompt, ClientShell, .env.example |
| 11 | Referral banner + captura | ReferralBanner + ClientShell |
| 12 | TWA manifest + docs Play Store | manifest.json, twa docs |
| 13 | Docs n8n Phase 3 | n8n-phase3-setup.md |
| 14 | Verificacion final + push | build/lint/push |

**Total: 14 tasks.** Al terminar, Ecomflex tendra todo el motor de Growth funcionando: redes sociales publicables desde panel, referidos con tracking, push notifications end-to-end, y la preparacion completa para submit a Play Store.

**TODOs manuales que quedan fuera del plan:**
- Generar keystore + fingerprint real (necesario antes de subir a Play Store)
- Generar VAPID keys y setearlas en Vercel
- Crear tabs nuevos en Google Sheets: Referidos, PushSubs, SocialLog
- Configurar flujos n8n siguiendo docs/n8n-phase3-setup.md
- Conseguir aprobacion de Twitter Developer + TikTok Content Posting API
- Tomar screenshots de la app para Play Store
- Completar ficha de tienda en Google Play Console
