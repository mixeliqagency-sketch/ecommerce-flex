# Ecomflex Phase 1: MVP Vendible — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Every task must be executed by one agent and audited by a second agent before commit.

**Goal:** Construir un MVP vendible: panel admin con dashboard + Kira conectada a datos + gestión de stock + webhook idempotente + cupones + TWA listo para Play Store.

**Architecture:** Phase 0 nos dejó la base limpia (lib/sheets/ modularizado, auth con roles, páginas legales). Phase 1 construye la capa de gestión (panel admin) y las funcionalidades críticas de negocio (stock, webhooks, cupones, reembolsos).

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Google Sheets API, NextAuth con roles, MercadoPago (webhook idempotente), OpenAI GPT-4o-mini (Kira), Bubblewrap (TWA)

**Spec de referencia:** `docs/superpowers/specs/2026-04-11-ecomflex-design.md` (sección 20 — FASE 1)

**Prerequisito:** Phase 0 completada (ver `docs/superpowers/plans/2026-04-11-ecomflex-phase0-cleanup.md`)

---

## File Structure — Archivos a crear/modificar

### Crear (módulos de datos):
- `lib/sheets/coupons.ts` — CRUD cupones
- `lib/sheets/config.ts` — Toggles de módulos con cache
- `lib/sheets/metrics.ts` — Lectura de métricas agregadas
- `lib/sheets/carts.ts` — Carritos abandonados

### Crear (API routes):
- `app/api/cupones/route.ts` — GET/POST cupones (panel)
- `app/api/cupones/validate/route.ts` — POST validar cupón (checkout)
- `app/api/config/route.ts` — GET/PUT config toggles
- `app/api/analytics/summary/route.ts` — GET KPIs del dashboard
- `app/api/webhooks/mercadopago/route.ts` — POST webhook idempotente
- `app/api/pedidos/[orderId]/refund/route.ts` — POST reembolso
- `app/api/pedidos/[orderId]/status/route.ts` — PUT actualizar estado
- `app/api/carritos/route.ts` — POST guardar carrito abandonado
- `app/api/kira/insights/route.ts` — GET resumen diario de Kira

### Crear (panel admin):
- `app/panel/layout.tsx` — Layout protegido con verificación de rol admin
- `app/panel/page.tsx` — Dashboard con KPIs + resumen Kira
- `app/panel/cupones/page.tsx` — Gestión de cupones
- `app/panel/pedidos/page.tsx` — Lista de pedidos + acciones (estado, refund)
- `app/panel/pedidos/[orderId]/page.tsx` — Detalle de pedido
- `app/panel/config/page.tsx` — Panel de toggles de módulos
- `components/panel/Dashboard.tsx` — Componente del dashboard
- `components/panel/KPICard.tsx` — Card de KPI reutilizable
- `components/panel/KiraInsights.tsx` — Widget de insights de Kira
- `components/panel/TopProductsWidget.tsx`
- `components/panel/AbandonedCartsWidget.tsx`
- `components/panel/CouponForm.tsx` — Formulario crear/editar cupón
- `components/panel/ConfigToggle.tsx` — Switch on/off reutilizable
- `components/panel/OrderStatusBadge.tsx` — Badge de estado con colores
- `components/panel/OrderActions.tsx` — Botones de acciones (cambiar estado, refund)

### Crear (tienda):
- `components/tienda/EmailCapturePopup.tsx` — Popup de captación
- `components/tienda/ReviewForm.tsx` — Form de reseña con foto
- `public/.well-known/assetlinks.json` — Para TWA

### Modificar:
- `lib/auth.ts` — Middleware check explícito para /panel/*
- `lib/sheets/orders.ts` — Agregar updateOrderStatus con validación de transición
- `lib/sheets/reviews.ts` — Agregar soporte para foto URL
- `types/index.ts` — Agregar Coupon, DashboardMetrics, AbandonedCart, OrderStatus
- `middleware.ts` — Verificar role admin para /panel/*
- `app/(tienda)/checkout/page.tsx` — Email como primer campo + guardar carrito
- `app/(tienda)/productos/[slug]/page.tsx` — Form de reseña para compradores verificados
- `components/catalog/ProductCard.tsx` — Mostrar "Agotado" si stock=0
- `next.config.js` — Header para assetlinks.json
- `.env.example` — Variables nuevas (MERCADOPAGO_WEBHOOK_SECRET ya está, agregar R2 si falta)

---

## Task 1: Agregar tipos nuevos

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Agregar tipos Phase 1**

```typescript
// Agregar al final de types/index.ts

export type OrderStatus =
  | "creado"
  | "pendiente_pago"
  | "pagado"
  | "preparando"
  | "enviado"
  | "entregado"
  | "cancelado"
  | "reembolsado";

export interface Coupon {
  codigo: string;
  descuento_porcentaje: number;
  fecha_vencimiento: string; // ISO date
  usos_maximos: number;
  usos_actuales: number;
  activo: boolean;
  descripcion?: string;
}

export interface DashboardMetrics {
  ventas_hoy: number;
  ventas_semana: number;
  ventas_mes: number;
  pedidos_hoy: number;
  pedidos_semana: number;
  visitas_hoy?: number;
  variacion_ventas_pct: number;
  top_productos: { slug: string; nombre: string; cantidad: number; ingresos: number }[];
  carritos_abandonados_hoy: number;
  carritos_recuperados: number;
}

export interface AbandonedCart {
  id: string;
  email: string | null;
  items: CartItem[];
  timestamp: string;
  estado: "abandonado" | "recuperado" | "convertido";
}

export interface ModuleConfig {
  dashboard: { enabled: boolean };
  emailMarketing: {
    enabled: boolean;
    welcomeSeries: boolean;
    abandonedCart: boolean;
    postPurchase: boolean;
    winback: boolean;
    newsletters: boolean;
  };
  socialMedia: { enabled: boolean; instagram: boolean; twitter: boolean; tiktok: boolean };
  seoPro: { enabled: boolean; blog: boolean; faqSchema: boolean; breadcrumbs: boolean; aiVisibility: boolean };
  googleAds: { enabled: boolean; trackingId: string; remarketing: boolean };
  kira: { enabled: boolean; whatsappFallback: boolean };
  cupones: { enabled: boolean };
  referidos: { enabled: boolean };
  pushNotifications: { enabled: boolean };
  modoCatalogo: { enabled: boolean };
  poweredBy: { enabled: boolean };
  stockAlert: { threshold: number };
}

export interface KiraInsight {
  fecha: string;
  resumen: string; // texto generado por GPT
  ventas_hoy: number;
  top_producto: string;
  carritos_abandonados: number;
  stock_bajo: string[]; // slugs de productos con stock < threshold
  sugerencias: string[];
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run type-check
```
Expected: 0 errores

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat: agregar tipos Phase 1 (Coupon, DashboardMetrics, AbandonedCart, ModuleConfig)"
```

---

## Task 2: Agregar constantes y tabs nuevos a constants.ts

**Files:**
- Modify: `lib/sheets/constants.ts`

- [ ] **Step 1: Agregar RANGES y COL para tabs nuevos**

```typescript
// Agregar al objeto RANGES:
CUPONES: "Cupones!A2:G",
CONFIG: "Config!A2:C",
METRICAS: "Metricas!A2:F",
CARRITOS: "Carritos!A2:E",
COLA: "Cola!A2:F",

// Agregar al objeto COL:
CUPON: {
  CODIGO: 0,
  DESCUENTO: 1,
  VENCIMIENTO: 2,
  USOS_MAX: 3,
  USOS_ACTUALES: 4,
  ACTIVO: 5,
  DESCRIPCION: 6,
},
CONFIG: {
  MODULO: 0,
  PROPIEDAD: 1,
  VALOR: 2,
},
METRICA: {
  FECHA: 0,
  VENTAS: 1,
  PEDIDOS: 2,
  VISITAS: 3,
  CARRITOS_ABANDONADOS: 4,
  CARRITOS_RECUPERADOS: 5,
},
CARRITO: {
  ID: 0,
  EMAIL: 1,
  ITEMS: 2,
  TIMESTAMP: 3,
  ESTADO: 4,
},
COLA_EVENTO: {
  ID: 0,
  TIPO: 1,
  DATOS: 2,
  TIMESTAMP: 3,
  ESTADO: 4,
  INTENTOS: 5,
},
```

- [ ] **Step 2: Commit**

```bash
git add lib/sheets/constants.ts
git commit -m "feat: agregar RANGES y COL para tabs Phase 1 (cupones, config, metricas, carritos, cola)"
```

---

## Task 3: Crear lib/sheets/coupons.ts

**Files:**
- Create: `lib/sheets/coupons.ts`

- [ ] **Step 1: Crear módulo de cupones**

```typescript
// lib/sheets/coupons.ts
import { getRows, findRow, appendRow, updateCell, findRowIndex } from "./helpers";
import { getPrivateSheetId } from "./client";
import { RANGES, COL } from "./constants";
import type { Coupon } from "@/types";

function mapRowToCoupon(row: string[]): Coupon {
  const c = COL.CUPON;
  return {
    codigo: row[c.CODIGO] ?? "",
    descuento_porcentaje: Number(row[c.DESCUENTO]) || 0,
    fecha_vencimiento: row[c.VENCIMIENTO] ?? "",
    usos_maximos: Number(row[c.USOS_MAX]) || 0,
    usos_actuales: Number(row[c.USOS_ACTUALES]) || 0,
    activo: row[c.ACTIVO] === "true",
    descripcion: row[c.DESCRIPCION] ?? undefined,
  };
}

export async function getCoupons(): Promise<Coupon[]> {
  const rows = await getRows(getPrivateSheetId(), RANGES.CUPONES);
  return rows.map(mapRowToCoupon).filter((c) => c.codigo);
}

export async function getCouponByCode(codigo: string): Promise<Coupon | null> {
  const row = await findRow(getPrivateSheetId(), RANGES.CUPONES, COL.CUPON.CODIGO, codigo);
  return row ? mapRowToCoupon(row) : null;
}

export async function createCoupon(coupon: Omit<Coupon, "usos_actuales">): Promise<void> {
  // Verificar que no exista
  const existing = await getCouponByCode(coupon.codigo);
  if (existing) {
    throw new Error(`El cupón ${coupon.codigo} ya existe`);
  }

  await appendRow(getPrivateSheetId(), RANGES.CUPONES, [
    coupon.codigo,
    coupon.descuento_porcentaje,
    coupon.fecha_vencimiento,
    coupon.usos_maximos,
    0, // usos_actuales inicial
    coupon.activo ? "true" : "false",
    coupon.descripcion ?? "",
  ]);
}

export async function incrementCouponUsage(codigo: string): Promise<void> {
  const rowIndex = await findRowIndex(getPrivateSheetId(), RANGES.CUPONES, COL.CUPON.CODIGO, codigo);
  if (rowIndex === -1) throw new Error(`Cupón ${codigo} no encontrado`);

  const coupon = await getCouponByCode(codigo);
  if (!coupon) throw new Error(`Cupón ${codigo} no encontrado`);

  // Columna E (índice 4) = usos_actuales
  await updateCell(getPrivateSheetId(), `Cupones!E${rowIndex}`, coupon.usos_actuales + 1);
}

export async function deactivateCoupon(codigo: string): Promise<void> {
  const rowIndex = await findRowIndex(getPrivateSheetId(), RANGES.CUPONES, COL.CUPON.CODIGO, codigo);
  if (rowIndex === -1) throw new Error(`Cupón ${codigo} no encontrado`);

  // Columna F (índice 5) = activo
  await updateCell(getPrivateSheetId(), `Cupones!F${rowIndex}`, "false");
}

/**
 * Valida un cupón: existe, está activo, no venció, no superó usos máximos.
 * Retorna el cupón si es válido, o null si no.
 */
export async function validateCoupon(codigo: string): Promise<Coupon | null> {
  const coupon = await getCouponByCode(codigo);
  if (!coupon) return null;
  if (!coupon.activo) return null;

  // Verificar vencimiento
  const vencimiento = new Date(coupon.fecha_vencimiento);
  if (isNaN(vencimiento.getTime()) || vencimiento < new Date()) return null;

  // Verificar usos
  if (coupon.usos_maximos > 0 && coupon.usos_actuales >= coupon.usos_maximos) return null;

  return coupon;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/sheets/coupons.ts
git commit -m "feat: módulo cupones con validación (vencimiento + usos máximos)"
```

---

## Task 4: Crear lib/sheets/config.ts

**Files:**
- Create: `lib/sheets/config.ts`

- [ ] **Step 1: Crear módulo de config con cache en memoria (NO persiste entre cold starts, pero reduce llamadas)**

```typescript
// lib/sheets/config.ts
import { getRows, appendRow, updateCell } from "./helpers";
import { getPublicSheetId } from "./client";
import { RANGES, COL } from "./constants";
import type { ModuleConfig } from "@/types";

// Defaults — se usan para inicializar el tab "Config" la primera vez
const DEFAULT_CONFIG: ModuleConfig = {
  dashboard: { enabled: true },
  emailMarketing: {
    enabled: true,
    welcomeSeries: true,
    abandonedCart: true,
    postPurchase: true,
    winback: true,
    newsletters: true,
  },
  socialMedia: { enabled: true, instagram: true, twitter: true, tiktok: true },
  seoPro: { enabled: true, blog: true, faqSchema: true, breadcrumbs: true, aiVisibility: true },
  googleAds: { enabled: false, trackingId: "", remarketing: false },
  kira: { enabled: true, whatsappFallback: true },
  cupones: { enabled: true },
  referidos: { enabled: true },
  pushNotifications: { enabled: true },
  modoCatalogo: { enabled: false },
  poweredBy: { enabled: true },
  stockAlert: { threshold: 5 },
};

// Cache en módulo (reduce llamadas a Sheets entre requests de la misma instance)
let cachedConfig: ModuleConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

function parseValue(raw: string): unknown {
  if (raw === "true") return true;
  if (raw === "false") return false;
  const num = Number(raw);
  if (!isNaN(num) && raw.trim() !== "") return num;
  return raw;
}

export async function getConfig(): Promise<ModuleConfig> {
  // Cache hit
  if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedConfig;
  }

  try {
    const rows = await getRows(getPublicSheetId(), RANGES.CONFIG);

    // Si no hay datos, devolver defaults
    if (rows.length === 0) {
      cachedConfig = DEFAULT_CONFIG;
      cacheTimestamp = Date.now();
      return DEFAULT_CONFIG;
    }

    // Reconstruir objeto desde filas planas (modulo, propiedad, valor)
    const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as ModuleConfig;
    for (const row of rows) {
      const modulo = row[COL.CONFIG.MODULO];
      const propiedad = row[COL.CONFIG.PROPIEDAD];
      const valor = row[COL.CONFIG.VALOR];
      if (!modulo || !propiedad) continue;

      const mod = (config as unknown as Record<string, Record<string, unknown>>)[modulo];
      if (mod) {
        mod[propiedad] = parseValue(valor ?? "");
      }
    }

    cachedConfig = config;
    cacheTimestamp = Date.now();
    return config;
  } catch (error) {
    console.error("[config] Error leyendo config, usando defaults:", error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Actualiza una sola propiedad de un módulo.
 * Ejemplo: updateConfigProperty("kira", "enabled", false)
 */
export async function updateConfigProperty(
  modulo: string,
  propiedad: string,
  valor: string | number | boolean
): Promise<void> {
  // Invalidar cache
  cachedConfig = null;

  const rows = await getRows(getPublicSheetId(), RANGES.CONFIG);
  const existingIndex = rows.findIndex(
    (row) => row[COL.CONFIG.MODULO] === modulo && row[COL.CONFIG.PROPIEDAD] === propiedad
  );

  const valorStr = String(valor);

  if (existingIndex !== -1) {
    // Update existing — fila 1-based + header
    const rowNum = existingIndex + 2;
    await updateCell(getPublicSheetId(), `Config!C${rowNum}`, valorStr);
  } else {
    // Append new
    await appendRow(getPublicSheetId(), RANGES.CONFIG, [modulo, propiedad, valorStr]);
  }
}

export function invalidateConfigCache(): void {
  cachedConfig = null;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/sheets/config.ts
git commit -m "feat: módulo config.ts con cache de 5 min + defaults para toggles"
```

---

## Task 5: Crear lib/sheets/metrics.ts y carts.ts

**Files:**
- Create: `lib/sheets/metrics.ts`
- Create: `lib/sheets/carts.ts`

- [ ] **Step 1: Crear metrics.ts**

```typescript
// lib/sheets/metrics.ts
import { getRows } from "./helpers";
import { getPrivateSheetId } from "./client";
import { RANGES, COL } from "./constants";
import { getProducts } from "./products";
import { getOrdersAll } from "./orders";
import type { DashboardMetrics } from "@/types";

/**
 * Calcula métricas del dashboard leyendo pedidos y productos.
 * Usa ISR de Next.js para cachear el endpoint que llame a esto.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [orders, products] = await Promise.all([getOrdersAll(), getProducts()]);

  const now = new Date();
  const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const semanaAtras = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
  const mesAtras = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ayerInicio = new Date(hoy.getTime() - 24 * 60 * 60 * 1000);

  // Filtrar solo pedidos pagados
  const pagados = orders.filter((o) => o.estado === "pagado" || o.estado === "entregado");

  const ventasHoy = pagados
    .filter((o) => new Date(o.fecha) >= hoy)
    .reduce((sum, o) => sum + o.total, 0);
  const ventasAyer = pagados
    .filter((o) => {
      const f = new Date(o.fecha);
      return f >= ayerInicio && f < hoy;
    })
    .reduce((sum, o) => sum + o.total, 0);
  const ventasSemana = pagados
    .filter((o) => new Date(o.fecha) >= semanaAtras)
    .reduce((sum, o) => sum + o.total, 0);
  const ventasMes = pagados
    .filter((o) => new Date(o.fecha) >= mesAtras)
    .reduce((sum, o) => sum + o.total, 0);

  const pedidosHoy = pagados.filter((o) => new Date(o.fecha) >= hoy).length;
  const pedidosSemana = pagados.filter((o) => new Date(o.fecha) >= semanaAtras).length;

  // Variación % vs ayer
  const variacion = ventasAyer > 0 ? ((ventasHoy - ventasAyer) / ventasAyer) * 100 : 0;

  // Top productos (contar items vendidos)
  const productCount: Record<string, { nombre: string; cantidad: number; ingresos: number }> = {};
  for (const order of pagados) {
    try {
      const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const slug = item.product?.slug ?? item.slug;
        const nombre = item.product?.nombre ?? item.nombre ?? "Desconocido";
        const cantidad = Number(item.cantidad) || 1;
        const precio = Number(item.product?.precio ?? item.precio) || 0;
        if (!slug) continue;
        if (!productCount[slug]) {
          productCount[slug] = { nombre, cantidad: 0, ingresos: 0 };
        }
        productCount[slug].cantidad += cantidad;
        productCount[slug].ingresos += cantidad * precio;
      }
    } catch {
      continue;
    }
  }

  const topProductos = Object.entries(productCount)
    .map(([slug, data]) => ({ slug, ...data }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  return {
    ventas_hoy: ventasHoy,
    ventas_semana: ventasSemana,
    ventas_mes: ventasMes,
    pedidos_hoy: pedidosHoy,
    pedidos_semana: pedidosSemana,
    variacion_ventas_pct: Math.round(variacion * 10) / 10,
    top_productos: topProductos,
    carritos_abandonados_hoy: 0, // se llena en la task de carritos
    carritos_recuperados: 0,
  };
}
```

- [ ] **Step 2: Crear carts.ts**

```typescript
// lib/sheets/carts.ts
import { getRows, appendRow, findRowIndex, updateCell } from "./helpers";
import { getPrivateSheetId } from "./client";
import { RANGES, COL } from "./constants";
import type { AbandonedCart, CartItem } from "@/types";
import crypto from "crypto";

function mapRowToCart(row: string[]): AbandonedCart {
  const c = COL.CARRITO;
  let items: CartItem[] = [];
  try {
    items = JSON.parse(row[c.ITEMS] ?? "[]");
  } catch {
    items = [];
  }
  return {
    id: row[c.ID] ?? "",
    email: row[c.EMAIL] || null,
    items,
    timestamp: row[c.TIMESTAMP] ?? "",
    estado: (row[c.ESTADO] ?? "abandonado") as AbandonedCart["estado"],
  };
}

export async function saveAbandonedCart(
  email: string | null,
  items: CartItem[]
): Promise<string> {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  await appendRow(getPrivateSheetId(), RANGES.CARRITOS, [
    id,
    email ?? "",
    JSON.stringify(items),
    timestamp,
    "abandonado",
  ]);

  return id;
}

export async function getAbandonedCarts(): Promise<AbandonedCart[]> {
  const rows = await getRows(getPrivateSheetId(), RANGES.CARRITOS);
  return rows.map(mapRowToCart);
}

export async function getAbandonedCartsToday(): Promise<AbandonedCart[]> {
  const all = await getAbandonedCarts();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return all.filter((c) => new Date(c.timestamp) >= hoy && c.estado === "abandonado");
}

export async function markCartAsRecovered(cartId: string): Promise<void> {
  const rowIndex = await findRowIndex(getPrivateSheetId(), RANGES.CARRITOS, COL.CARRITO.ID, cartId);
  if (rowIndex === -1) return;
  // Columna E = índice 4 = estado
  await updateCell(getPrivateSheetId(), `Carritos!E${rowIndex}`, "recuperado");
}

export async function markCartAsConverted(cartId: string): Promise<void> {
  const rowIndex = await findRowIndex(getPrivateSheetId(), RANGES.CARRITOS, COL.CARRITO.ID, cartId);
  if (rowIndex === -1) return;
  await updateCell(getPrivateSheetId(), `Carritos!E${rowIndex}`, "convertido");
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/sheets/metrics.ts lib/sheets/carts.ts
git commit -m "feat: módulos metrics.ts y carts.ts para dashboard y carritos abandonados"
```

---

## Task 6: Agregar getOrdersAll() y updateOrderStatus() completo a orders.ts

**Files:**
- Modify: `lib/sheets/orders.ts`

- [ ] **Step 1: Agregar función para leer todos los pedidos**

```typescript
// Agregar a lib/sheets/orders.ts

import { ORDER_STATUS } from "./constants";
import type { OrderStatus } from "@/types";

export async function getOrdersAll(): Promise<Order[]> {
  const rows = await getRows(getPrivateSheetId(), RANGES.PEDIDOS);
  return rows.map(mapRowToOrder);
}

/**
 * Valida si una transición de estado es permitida.
 * Las transiciones válidas están en el spec sección 4.1.
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  creado: ["pendiente_pago"],
  pendiente_pago: ["pagado", "cancelado"],
  pagado: ["preparando", "reembolsado", "cancelado"],
  preparando: ["enviado", "cancelado"],
  enviado: ["entregado", "reembolsado"],
  entregado: ["reembolsado"],
  cancelado: [],
  reembolsado: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

- [ ] **Step 2: Asegurar que updateOrderStatus valida transiciones**

```typescript
// Modificar updateOrderStatus en lib/sheets/orders.ts:

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  skipValidation = false
): Promise<void> {
  if (!skipValidation) {
    const order = await getOrderById(orderId);
    if (!order) throw new Error(`Pedido ${orderId} no encontrado`);

    const currentStatus = order.estado as OrderStatus;
    if (currentStatus && !canTransition(currentStatus, newStatus)) {
      throw new Error(
        `Transición inválida: ${currentStatus} → ${newStatus}. Estados permitidos: ${VALID_TRANSITIONS[currentStatus]?.join(", ") ?? "ninguno"}`
      );
    }
  }

  const rowIndex = await findRowIndex(getPrivateSheetId(), RANGES.PEDIDOS, COL.PEDIDO.ID, orderId);
  if (rowIndex === -1) throw new Error(`Pedido ${orderId} no encontrado`);

  // Columna de estado (ajustar según estructura de Pedidos tab)
  // Asumimos que "estado" es columna N = 13 (0-indexed) → letra N
  await updateCell(getPrivateSheetId(), `Pedidos!N${rowIndex}`, newStatus);
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/sheets/orders.ts
git commit -m "feat: getOrdersAll() + validación de transiciones en updateOrderStatus"
```

---

## Task 7: Crear endpoint API de cupones

**Files:**
- Create: `app/api/cupones/route.ts`
- Create: `app/api/cupones/validate/route.ts`

- [ ] **Step 1: Crear /api/cupones (GET, POST)**

```typescript
// app/api/cupones/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getCoupons, createCoupon } from "@/lib/sheets/coupons";
import { z } from "zod";

const createCouponSchema = z.object({
  codigo: z.string().min(3).max(50).regex(/^[A-Z0-9_-]+$/, "Solo mayúsculas, números, _ y -"),
  descuento_porcentaje: z.number().int().min(1).max(100),
  fecha_vencimiento: z.string(), // ISO date
  usos_maximos: z.number().int().min(0),
  activo: z.boolean(),
  descripcion: z.string().optional(),
});

// GET — Listar todos los cupones (solo admin)
export async function GET() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const coupons = await getCoupons();
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("[api/cupones] Error:", error);
    return NextResponse.json({ error: "Error al obtener cupones" }, { status: 500 });
  }
}

// POST — Crear nuevo cupón (solo admin)
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createCouponSchema.parse(body);

    await createCoupon(data);
    return NextResponse.json({ success: true, codigo: data.codigo });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("ya existe")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("[api/cupones POST] Error:", error);
    return NextResponse.json({ error: "Error al crear cupón" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Crear /api/cupones/validate (POST público)**

```typescript
// app/api/cupones/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/lib/sheets/coupons";
import { z } from "zod";

const validateSchema = z.object({
  codigo: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { codigo } = validateSchema.parse(body);

    const coupon = await validateCoupon(codigo);
    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Cupón inválido o expirado" }, { status: 200 });
    }

    return NextResponse.json({
      valid: true,
      codigo: coupon.codigo,
      descuento_porcentaje: coupon.descuento_porcentaje,
      descripcion: coupon.descripcion,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ valid: false, error: "Código inválido" }, { status: 400 });
    }
    console.error("[api/cupones/validate] Error:", error);
    return NextResponse.json({ valid: false, error: "Error al validar" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verificar build**

```bash
npm run type-check
```

- [ ] **Step 4: Commit**

```bash
git add app/api/cupones
git commit -m "feat: endpoints de cupones (GET/POST admin + validate público)"
```

---

## Task 8: Crear endpoint de config (toggles)

**Files:**
- Create: `app/api/config/route.ts`

- [ ] **Step 1: Crear endpoint GET/PUT config**

```typescript
// app/api/config/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getConfig, updateConfigProperty } from "@/lib/sheets/config";
import { z } from "zod";

const updateSchema = z.object({
  modulo: z.string().min(1),
  propiedad: z.string().min(1),
  valor: z.union([z.string(), z.number(), z.boolean()]),
});

// GET — Leer toda la config (público para que la tienda sepa qué módulos están activos)
export async function GET() {
  try {
    const config = await getConfig();
    return NextResponse.json(config, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("[api/config GET] Error:", error);
    return NextResponse.json({ error: "Error al leer config" }, { status: 500 });
  }
}

// PUT — Actualizar una propiedad (solo admin)
export async function PUT(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { modulo, propiedad, valor } = updateSchema.parse(body);

    await updateConfigProperty(modulo, propiedad, valor);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    console.error("[api/config PUT] Error:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/config/route.ts
git commit -m "feat: endpoint /api/config con GET público y PUT admin"
```

---

## Task 9: Crear webhook MercadoPago IDEMPOTENTE

**Files:**
- Create: `app/api/webhooks/mercadopago/route.ts`

- [ ] **Step 1: Crear webhook con verificación de firma e idempotencia**

```typescript
// app/api/webhooks/mercadopago/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import crypto from "crypto";
import { getOrderById, updateOrderStatus } from "@/lib/sheets/orders";
import { markCartAsConverted } from "@/lib/sheets/carts";
import { incrementCouponUsage } from "@/lib/sheets/coupons";

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
});
const paymentClient = new Payment(mpClient);

// Set en memoria para idempotencia a nivel de instancia serverless
// (Nota: no funciona entre instancias, pero reduce duplicados en la misma)
const processedPayments = new Set<string>();

/**
 * Verifica la firma x-signature de MercadoPago.
 * Formato: "ts=1234567890,v1=hash_sha256"
 */
function verifySignature(
  signatureHeader: string | null,
  requestId: string | null,
  dataId: string
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !signatureHeader || !requestId) {
    console.error("[webhook] Missing signature, request-id, or secret");
    return false;
  }

  const parts = signatureHeader.split(",");
  let ts = "";
  let hash = "";
  for (const part of parts) {
    const [key, val] = part.split("=");
    if (key?.trim() === "ts") ts = val?.trim() ?? "";
    if (key?.trim() === "v1") hash = val?.trim() ?? "";
  }

  if (!ts || !hash) return false;

  // Formato del manifest de MP: id:{data.id};request-id:{x-request-id};ts:{ts};
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expectedHash = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(expectedHash, "hex")
  );
}

export async function POST(req: NextRequest) {
  // Responder 200 INMEDIATAMENTE para evitar reintentos de MP
  // Procesar en background con waitUntil si Vercel lo soporta
  try {
    const body = await req.json();
    const signatureHeader = req.headers.get("x-signature");
    const requestId = req.headers.get("x-request-id");

    // Solo procesar notificaciones de tipo "payment"
    if (body.type !== "payment" && body.action !== "payment.created" && body.action !== "payment.updated") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const paymentId = String(body.data?.id ?? "");
    if (!paymentId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Verificar firma
    if (!verifySignature(signatureHeader, requestId, paymentId)) {
      console.error("[webhook] Firma inválida");
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    // IDEMPOTENCIA — verificar si ya fue procesado en esta instancia
    if (processedPayments.has(paymentId)) {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
    processedPayments.add(paymentId);
    // Limpiar cache después de 1 hora para no crecer indefinidamente
    setTimeout(() => processedPayments.delete(paymentId), 60 * 60 * 1000);

    // Procesar async (no bloquear la respuesta)
    processPayment(paymentId).catch((err) => {
      console.error("[webhook] Error procesando pago:", err);
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[webhook] Error:", error);
    // Devolver 200 igual para evitar reintentos que generen más ruido
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

async function processPayment(paymentId: string): Promise<void> {
  // Consultar estado real del pago en MP
  const payment = await paymentClient.get({ id: paymentId });

  const externalReference = payment.external_reference;
  const status = payment.status;

  if (!externalReference) {
    console.error("[webhook] Pago sin external_reference");
    return;
  }

  // Buscar pedido por external_reference (que es nuestro order ID)
  const order = await getOrderById(externalReference);
  if (!order) {
    console.error(`[webhook] Pedido ${externalReference} no encontrado`);
    return;
  }

  // Idempotencia a nivel de datos: si ya está pagado, no volver a procesar
  if (order.estado === "pagado" || order.estado === "preparando" || order.estado === "enviado" || order.estado === "entregado") {
    console.log(`[webhook] Pedido ${externalReference} ya procesado (estado: ${order.estado})`);
    return;
  }

  if (status === "approved") {
    await updateOrderStatus(externalReference, "pagado");
    console.log(`[webhook] Pedido ${externalReference} marcado como pagado`);

    // TODO en futuros tasks:
    // - Decrementar stock atómicamente
    // - Incrementar uso de cupón si aplicó
    // - Marcar carrito abandonado como convertido
    // - Agregar evento a cola (tab "cola") para email post-compra
  } else if (status === "rejected" || status === "cancelled") {
    await updateOrderStatus(externalReference, "cancelado");
    console.log(`[webhook] Pedido ${externalReference} cancelado (status MP: ${status})`);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/webhooks/mercadopago/route.ts
git commit -m "feat: webhook MercadoPago IDEMPOTENTE con verificación de firma SHA256"
```

---

## Task 10: Crear endpoint de refund

**Files:**
- Create: `app/api/pedidos/[orderId]/refund/route.ts`

- [ ] **Step 1: Crear endpoint de reembolso (solo admin)**

```typescript
// app/api/pedidos/[orderId]/refund/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, PaymentRefund } from "mercadopago";
import { getAuthSession } from "@/lib/auth";
import { getOrderById, updateOrderStatus } from "@/lib/sheets/orders";

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
});

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { orderId } = params;

  try {
    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    if (order.estado === "reembolsado") {
      return NextResponse.json({ error: "El pedido ya fue reembolsado" }, { status: 409 });
    }

    // Solo se puede reembolsar si fue pagado por MP
    if (order.metodo_pago !== "mercadopago" || !order.mercadopago_id) {
      // Para transferencia o crypto, solo cambiar estado (reembolso manual por el admin)
      await updateOrderStatus(orderId, "reembolsado");
      return NextResponse.json({
        success: true,
        manual: true,
        message: "Estado actualizado. El reembolso debe procesarse manualmente.",
      });
    }

    // Llamar a la API de refund de MP
    const refundClient = new PaymentRefund(mpClient);
    await refundClient.create({
      payment_id: order.mercadopago_id,
    });

    // Actualizar estado del pedido
    await updateOrderStatus(orderId, "reembolsado");

    return NextResponse.json({ success: true, manual: false });
  } catch (error) {
    console.error(`[refund ${orderId}] Error:`, error);
    const message = error instanceof Error ? error.message : "Error al procesar reembolso";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/pedidos
git commit -m "feat: endpoint POST /api/pedidos/[orderId]/refund (MP Refund API)"
```

---

## Task 11: Crear endpoint de actualizar estado de pedido

**Files:**
- Create: `app/api/pedidos/[orderId]/status/route.ts`

- [ ] **Step 1: Crear endpoint PUT estado**

```typescript
// app/api/pedidos/[orderId]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/sheets/orders";
import { ORDER_STATUS } from "@/lib/sheets/constants";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum([
    "creado",
    "pendiente_pago",
    "pagado",
    "preparando",
    "enviado",
    "entregado",
    "cancelado",
    "reembolsado",
  ]),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { orderId } = params;

  try {
    const body = await req.json();
    const { status } = updateStatusSchema.parse(body);

    await updateOrderStatus(orderId, status);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("inválida")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(`[pedidos/${orderId}/status] Error:`, error);
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/pedidos/[orderId]/status
git commit -m "feat: endpoint PUT /api/pedidos/[orderId]/status con validación de transiciones"
```

---

## Task 12: Crear endpoint de métricas del dashboard

**Files:**
- Create: `app/api/analytics/summary/route.ts`

- [ ] **Step 1: Crear endpoint GET métricas**

```typescript
// app/api/analytics/summary/route.ts
import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { getDashboardMetrics } from "@/lib/sheets/metrics";
import { getAbandonedCartsToday } from "@/lib/sheets/carts";

export const revalidate = 300; // 5 min ISR

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const [metrics, carritosHoy] = await Promise.all([
      getDashboardMetrics(),
      getAbandonedCartsToday(),
    ]);

    metrics.carritos_abandonados_hoy = carritosHoy.length;

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("[analytics/summary] Error:", error);
    return NextResponse.json({ error: "Error al obtener métricas" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/analytics
git commit -m "feat: endpoint /api/analytics/summary con ISR 5 min (solo admin)"
```

---

## Task 13: Crear layout del panel admin con verificación de rol

**Files:**
- Create: `app/panel/layout.tsx`

- [ ] **Step 1: Crear layout protegido**

```typescript
// app/panel/layout.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthSession } from "@/lib/auth";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();

  // Middleware ya protege /panel/* (login requerido)
  // Pero además verificamos el rol admin acá
  if (!session || session.user.role !== "admin") {
    redirect("/auth/login?callbackUrl=/panel");
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="border-b border-[var(--border-glass)] bg-[var(--bg-secondary)]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/panel" className="text-xl font-heading font-bold">
            Panel Admin
          </Link>
          <nav className="flex gap-6 text-sm">
            <Link href="/panel" className="hover:text-[var(--color-primary)]">Dashboard</Link>
            <Link href="/panel/pedidos" className="hover:text-[var(--color-primary)]">Pedidos</Link>
            <Link href="/panel/cupones" className="hover:text-[var(--color-primary)]">Cupones</Link>
            <Link href="/panel/config" className="hover:text-[var(--color-primary)]">Config</Link>
            <Link href="/" className="hover:text-[var(--color-primary)]">← Volver a tienda</Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/panel/layout.tsx
git commit -m "feat: layout panel admin con verificación de rol y navegación"
```

---

## Task 14: Crear componentes reutilizables del panel

**Files:**
- Create: `components/panel/KPICard.tsx`
- Create: `components/panel/OrderStatusBadge.tsx`
- Create: `components/panel/ConfigToggle.tsx`

- [ ] **Step 1: Crear KPICard**

```typescript
// components/panel/KPICard.tsx
interface KPICardProps {
  label: string;
  value: string | number;
  variation?: number; // porcentaje
  icon?: React.ReactNode;
}

export function KPICard({ label, value, variation, icon }: KPICardProps) {
  const variationColor =
    variation === undefined
      ? ""
      : variation > 0
      ? "text-[var(--color-success)]"
      : variation < 0
      ? "text-[var(--color-danger)]"
      : "text-[var(--text-muted)]";

  const variationArrow =
    variation === undefined ? "" : variation > 0 ? "▲" : variation < 0 ? "▼" : "—";

  return (
    <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-heading font-bold text-[var(--text-primary)]">{value}</div>
      {variation !== undefined && (
        <div className={`text-sm mt-2 ${variationColor}`}>
          {variationArrow} {Math.abs(variation).toFixed(1)}% vs ayer
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Crear OrderStatusBadge**

```typescript
// components/panel/OrderStatusBadge.tsx
import type { OrderStatus } from "@/types";

const STATUS_COLORS: Record<OrderStatus, string> = {
  creado: "bg-gray-500",
  pendiente_pago: "bg-yellow-500",
  pagado: "bg-blue-500",
  preparando: "bg-indigo-500",
  enviado: "bg-purple-500",
  entregado: "bg-green-500",
  cancelado: "bg-red-500",
  reembolsado: "bg-orange-500",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  creado: "Creado",
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  preparando: "Preparando",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`${STATUS_COLORS[status]} text-white text-xs px-2 py-1 rounded-full inline-block`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
```

- [ ] **Step 3: Crear ConfigToggle**

```typescript
// components/panel/ConfigToggle.tsx
"use client";

import { useState } from "react";

interface ConfigToggleProps {
  label: string;
  modulo: string;
  propiedad: string;
  initialValue: boolean;
  disabled?: boolean;
}

export function ConfigToggle({ label, modulo, propiedad, initialValue, disabled }: ConfigToggleProps) {
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (disabled || loading) return;
    setLoading(true);
    const newValue = !value;

    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modulo, propiedad, valor: newValue }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setValue(newValue);
    } catch (error) {
      console.error(error);
      alert("Error al actualizar configuración");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-[var(--text-primary)]">{label}</span>
      <button
        onClick={handleToggle}
        disabled={disabled || loading}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          value ? "bg-[var(--color-primary)]" : "bg-gray-400"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            value ? "translate-x-6" : ""
          }`}
        />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/panel
git commit -m "feat: componentes panel admin (KPICard, OrderStatusBadge, ConfigToggle)"
```

---

## Task 15: Crear dashboard del panel

**Files:**
- Create: `app/panel/page.tsx`

- [ ] **Step 1: Crear página del dashboard**

```typescript
// app/panel/page.tsx
import { getDashboardMetrics } from "@/lib/sheets/metrics";
import { getAbandonedCartsToday } from "@/lib/sheets/carts";
import { KPICard } from "@/components/panel/KPICard";
import { formatPrice } from "@/lib/utils";

export const revalidate = 300; // 5 min

export default async function DashboardPage() {
  const [metrics, carritosHoy] = await Promise.all([
    getDashboardMetrics(),
    getAbandonedCartsToday(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)]">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          label="Ventas hoy"
          value={formatPrice(metrics.ventas_hoy)}
          variation={metrics.variacion_ventas_pct}
        />
        <KPICard label="Pedidos hoy" value={metrics.pedidos_hoy} />
        <KPICard label="Ventas semana" value={formatPrice(metrics.ventas_semana)} />
      </div>

      {/* Top productos + carritos abandonados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
          <h2 className="text-xl font-heading font-semibold mb-4">Top productos</h2>
          {metrics.top_productos.length === 0 ? (
            <p className="text-[var(--text-muted)]">Aún no hay ventas</p>
          ) : (
            <ol className="space-y-2">
              {metrics.top_productos.map((p, i) => (
                <li key={p.slug} className="flex justify-between text-sm">
                  <span>{i + 1}. {p.nombre}</span>
                  <span className="text-[var(--text-muted)]">{p.cantidad} un.</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
          <h2 className="text-xl font-heading font-semibold mb-4">Carritos abandonados</h2>
          <div className="text-3xl font-bold mb-2">{carritosHoy.length}</div>
          <p className="text-sm text-[var(--text-muted)]">abandonados hoy</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/panel/page.tsx
git commit -m "feat: dashboard del panel con KPIs y top productos"
```

---

## Task 16: Crear páginas del panel (cupones, pedidos, config)

**Files:**
- Create: `app/panel/cupones/page.tsx`
- Create: `app/panel/pedidos/page.tsx`
- Create: `app/panel/config/page.tsx`

- [ ] **Step 1: Crear página de cupones (lista + form)**

```typescript
// app/panel/cupones/page.tsx
import { getCoupons } from "@/lib/sheets/coupons";
import { CouponForm } from "@/components/panel/CouponForm";

export default async function CuponesPage() {
  const coupons = await getCoupons();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-heading font-bold">Cupones</h1>

      <CouponForm />

      <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
        <h2 className="text-xl font-heading font-semibold mb-4">Cupones activos</h2>
        {coupons.length === 0 ? (
          <p className="text-[var(--text-muted)]">No hay cupones creados</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[var(--border-glass)]">
                <th className="py-2">Código</th>
                <th className="py-2">Descuento</th>
                <th className="py-2">Vencimiento</th>
                <th className="py-2">Usos</th>
                <th className="py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.codigo} className="border-b border-[var(--border-glass)]/50">
                  <td className="py-2 font-mono">{c.codigo}</td>
                  <td className="py-2">{c.descuento_porcentaje}%</td>
                  <td className="py-2">{new Date(c.fecha_vencimiento).toLocaleDateString("es-AR")}</td>
                  <td className="py-2">{c.usos_actuales}/{c.usos_maximos || "∞"}</td>
                  <td className="py-2">{c.activo ? "✓ Activo" : "✗ Inactivo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear CouponForm**

```typescript
// components/panel/CouponForm.tsx
"use client";

import { useState } from "react";

export function CouponForm() {
  const [codigo, setCodigo] = useState("");
  const [descuento, setDescuento] = useState(10);
  const [vencimiento, setVencimiento] = useState("");
  const [usosMax, setUsosMax] = useState(0);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/cupones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: codigo.toUpperCase(),
          descuento_porcentaje: descuento,
          fecha_vencimiento: vencimiento,
          usos_maximos: usosMax,
          activo: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Error al crear cupón");
        return;
      }

      alert("Cupón creado ✓");
      setCodigo("");
      setVencimiento("");
      window.location.reload();
    } catch (error) {
      alert("Error al crear cupón");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
      <h2 className="text-xl font-heading font-semibold mb-4">Crear cupón</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Código</label>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            required
            pattern="[A-Z0-9_-]+"
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] rounded-[var(--radius-button)] border border-[var(--border-glass)]"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Descuento %</label>
          <input
            type="number"
            value={descuento}
            onChange={(e) => setDescuento(Number(e.target.value))}
            min={1}
            max={100}
            required
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] rounded-[var(--radius-button)] border border-[var(--border-glass)]"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Vencimiento</label>
          <input
            type="date"
            value={vencimiento}
            onChange={(e) => setVencimiento(e.target.value)}
            required
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] rounded-[var(--radius-button)] border border-[var(--border-glass)]"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Usos máximos (0 = ilimitado)</label>
          <input
            type="number"
            value={usosMax}
            onChange={(e) => setUsosMax(Number(e.target.value))}
            min={0}
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] rounded-[var(--radius-button)] border border-[var(--border-glass)]"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-4 px-6 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-button)] font-semibold hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "Creando..." : "Crear cupón"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Crear página de pedidos**

```typescript
// app/panel/pedidos/page.tsx
import { getOrdersAll } from "@/lib/sheets/orders";
import { OrderStatusBadge } from "@/components/panel/OrderStatusBadge";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export const revalidate = 30;

export default async function PedidosPage() {
  const orders = await getOrdersAll();
  // Ordenar por fecha desc
  orders.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading font-bold">Pedidos</h1>

      <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-[var(--border-glass)]">
              <th className="py-2">ID</th>
              <th className="py-2">Cliente</th>
              <th className="py-2">Total</th>
              <th className="py-2">Método</th>
              <th className="py-2">Estado</th>
              <th className="py-2">Fecha</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-[var(--border-glass)]/50">
                <td className="py-2 font-mono text-xs">{order.id.slice(0, 8)}</td>
                <td className="py-2">{order.nombre} {order.apellido}</td>
                <td className="py-2">{formatPrice(order.total)}</td>
                <td className="py-2">{order.metodo_pago}</td>
                <td className="py-2"><OrderStatusBadge status={order.estado as any} /></td>
                <td className="py-2">{new Date(order.fecha).toLocaleDateString("es-AR")}</td>
                <td className="py-2">
                  <Link href={`/panel/pedidos/${order.id}`} className="text-[var(--color-primary)] hover:underline">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Crear página de config con toggles**

```typescript
// app/panel/config/page.tsx
import { getConfig } from "@/lib/sheets/config";
import { ConfigToggle } from "@/components/panel/ConfigToggle";

export default async function ConfigPage() {
  const config = await getConfig();

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-3xl font-heading font-bold">Configuración de módulos</h1>

      <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
        <h2 className="text-xl font-heading font-semibold mb-4">Módulos principales</h2>
        <div className="divide-y divide-[var(--border-glass)]/50">
          <ConfigToggle label="Kira — Asistente IA" modulo="kira" propiedad="enabled" initialValue={config.kira.enabled} />
          <ConfigToggle label="Email Marketing" modulo="emailMarketing" propiedad="enabled" initialValue={config.emailMarketing.enabled} />
          <ConfigToggle label="Redes Sociales" modulo="socialMedia" propiedad="enabled" initialValue={config.socialMedia.enabled} />
          <ConfigToggle label="SEO PRO" modulo="seoPro" propiedad="enabled" initialValue={config.seoPro.enabled} />
          <ConfigToggle label="Cupones" modulo="cupones" propiedad="enabled" initialValue={config.cupones.enabled} />
          <ConfigToggle label="Referidos" modulo="referidos" propiedad="enabled" initialValue={config.referidos.enabled} />
          <ConfigToggle label="Notificaciones Push" modulo="pushNotifications" propiedad="enabled" initialValue={config.pushNotifications.enabled} />
          <ConfigToggle label="Google Ads Tracking" modulo="googleAds" propiedad="enabled" initialValue={config.googleAds.enabled} />
          <ConfigToggle label="Modo Catálogo" modulo="modoCatalogo" propiedad="enabled" initialValue={config.modoCatalogo.enabled} />
          <ConfigToggle label="Powered by Ecomflex (footer)" modulo="poweredBy" propiedad="enabled" initialValue={config.poweredBy.enabled} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add app/panel components/panel/CouponForm.tsx
git commit -m "feat: páginas del panel admin (cupones, pedidos, config)"
```

---

## Task 17: Agregar validación de stock y popup de captación

**Files:**
- Modify: `components/catalog/ProductCard.tsx`
- Create: `components/tienda/EmailCapturePopup.tsx`
- Modify: `app/api/checkout/route.ts`

- [ ] **Step 1: Mostrar "Agotado" en ProductCard cuando stock=0**

En `components/catalog/ProductCard.tsx`, cambiar el botón "Agregar al carrito" para mostrar "Agotado" y deshabilitarlo si `product.stock === 0`.

- [ ] **Step 2: Validar stock en endpoint de checkout**

En `app/api/checkout/route.ts` (y `transferencia/route.ts`), antes de crear el pedido, llamar a `getProductBySlug()` para cada item y verificar que `product.stock >= cantidad`. Si no, devolver 409 con mensaje.

- [ ] **Step 3: Crear EmailCapturePopup**

```typescript
// components/tienda/EmailCapturePopup.tsx
"use client";

import { useEffect, useState } from "react";

export function EmailCapturePopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // No mostrar si ya se suscribió
    if (localStorage.getItem("email_captured") === "true") return;

    // Mostrar después de 5 segundos
    const timer = setTimeout(() => setShow(true), 5000);

    // O al intentar salir (exit intent)
    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 0) setShow(true);
    }
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      // TODO Phase 2: endpoint /api/email/subscribe
      localStorage.setItem("email_captured", "true");
      setSubmitted(true);
      setTimeout(() => setShow(false), 2000);
    } catch (error) {
      console.error(error);
    }
  }

  function handleClose() {
    setShow(false);
    localStorage.setItem("email_captured", "true"); // no volver a mostrar
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-8 max-w-md w-full relative">
        <button onClick={handleClose} className="absolute top-4 right-4 text-[var(--text-muted)]">✕</button>

        {submitted ? (
          <div className="text-center">
            <h2 className="text-2xl font-heading font-bold mb-2">¡Gracias!</h2>
            <p className="text-[var(--text-secondary)]">Tu cupón va en camino.</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-heading font-bold mb-2">10% OFF en tu primera compra</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              Suscribite y recibí tu cupón por email.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full px-4 py-3 bg-[var(--bg-secondary)] rounded-[var(--radius-button)] border border-[var(--border-glass)]"
              />
              <button
                type="submit"
                className="w-full px-4 py-3 bg-[var(--color-primary)] text-white rounded-[var(--radius-button)] font-semibold hover:brightness-110"
              >
                Quiero mi 10% OFF
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Agregar el popup al ClientShell**

En `components/layout/ClientShell.tsx`, importar y renderizar `<EmailCapturePopup />`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: validación stock en checkout, botón Agotado, popup captación email"
```

---

## Task 18: TWA assetlinks.json y preparación Play Store

**Files:**
- Create: `public/.well-known/assetlinks.json`
- Modify: `next.config.js` (header para .well-known)

- [ ] **Step 1: Crear assetlinks.json placeholder**

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "ar.com.mixeliq.ecomflex",
      "sha256_cert_fingerprints": ["REEMPLAZAR_CON_FINGERPRINT_DEL_KEYSTORE"]
    }
  }
]
```

- [ ] **Step 2: Agregar header en next.config.js**

```javascript
// En next.config.js, dentro del array de headers, agregar:
{
  source: "/.well-known/assetlinks.json",
  headers: [
    { key: "Content-Type", value: "application/json" },
    { key: "Access-Control-Allow-Origin", value: "*" },
  ],
},
```

- [ ] **Step 3: Commit**

```bash
git add public/.well-known/assetlinks.json next.config.js
git commit -m "feat: assetlinks.json para TWA (placeholder) + header next.config.js"
```

---

## Task 19: Verificación final Phase 1

**Files:** Todos

- [ ] **Step 1: Type check**

```bash
npm run type-check
```
Expected: 0 errores

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: Build exitoso

- [ ] **Step 3: Lint**

```bash
npm run lint
```
Expected: 0 errores

- [ ] **Step 4: Verificar rutas del panel**

```bash
npm run dev
```
Luego abrir manualmente (con usuario admin en ADMIN_EMAILS):
- `/panel` → ver dashboard
- `/panel/cupones` → crear cupón de prueba
- `/panel/pedidos` → ver lista
- `/panel/config` → toggles funcionan
- `/api/config` → GET devuelve defaults

- [ ] **Step 5: Commit final + push**

```bash
git add -A
git commit -m "Phase 1 complete: MVP vendible con panel admin, webhook idempotente, cupones"
git push origin main
```

---

## Resumen de Tasks Phase 1

| Task | Descripción | Archivos clave |
|------|------------|----------------|
| 1 | Tipos Phase 1 (Coupon, DashboardMetrics, AbandonedCart, ModuleConfig) | types/index.ts |
| 2 | Constantes nuevas (tabs cupones, config, metricas, carritos, cola) | lib/sheets/constants.ts |
| 3 | Módulo coupons.ts (CRUD + validación) | lib/sheets/coupons.ts |
| 4 | Módulo config.ts (toggles + cache) | lib/sheets/config.ts |
| 5 | Módulos metrics.ts + carts.ts | lib/sheets/ |
| 6 | getOrdersAll() + validación transiciones | lib/sheets/orders.ts |
| 7 | Endpoints cupones (GET/POST + validate) | app/api/cupones/ |
| 8 | Endpoint config (GET/PUT) | app/api/config/ |
| 9 | Webhook MercadoPago IDEMPOTENTE | app/api/webhooks/mercadopago/ |
| 10 | Endpoint refund | app/api/pedidos/[id]/refund/ |
| 11 | Endpoint update status | app/api/pedidos/[id]/status/ |
| 12 | Endpoint analytics summary | app/api/analytics/summary/ |
| 13 | Layout panel admin (con rol check) | app/panel/layout.tsx |
| 14 | Componentes panel (KPICard, Badge, Toggle) | components/panel/ |
| 15 | Dashboard page | app/panel/page.tsx |
| 16 | Páginas cupones, pedidos, config | app/panel/*/page.tsx |
| 17 | Validación stock + popup captación | ProductCard, EmailCapturePopup, checkout |
| 18 | TWA assetlinks.json | public/.well-known/ |
| 19 | Verificación final | — |
