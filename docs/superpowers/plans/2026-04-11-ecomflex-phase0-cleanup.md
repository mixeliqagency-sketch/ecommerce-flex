# Ecomflex Phase 0: Limpieza y Fundamentos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar el código actual (ecommerce-flex con restos de AOURA) en una base limpia, segura y modular llamada Ecomflex, lista para construir el MVP encima.

**Architecture:** Dividir el monolito `google-sheets.ts` (683 líneas) en módulos independientes bajo `lib/sheets/`. Limpiar todo código fitness. Proteger el panel admin con roles. Implementar ISR en vez de cache in-memory. Agregar páginas legales obligatorias.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Google Sheets API, NextAuth, Zod, bcryptjs

**Spec de referencia:** `docs/superpowers/specs/2026-04-11-ecomflex-design.md` (v3, 27 secciones)

---

## File Structure — Archivos a crear/modificar

### Crear:
- `lib/sheets/client.ts` — Singleton auth + conexión a 2 Sheets
- `lib/sheets/helpers.ts` — appendRow(), getRows(), findRow()
- `lib/sheets/cache.ts` — Cache ISR-compatible
- `lib/sheets/products.ts` — CRUD productos
- `lib/sheets/orders.ts` — CRUD pedidos + updateOrderStatus()
- `lib/sheets/users.ts` — CRUD usuarios + roles
- `lib/sheets/reviews.ts` — CRUD reseñas
- `lib/sheets/constants.ts` — Índices de columnas por tab
- `components/shared/Icons.tsx` — Iconos SVG reutilizables
- `components/shared/CheckboxGroup.tsx` — Checkbox genérico para filtros
- `components/tienda/SearchOverlay.tsx` — Buscador extraído de Header
- `app/(tienda)/politica-privacidad/page.tsx` — Política de privacidad
- `app/(tienda)/terminos/page.tsx` — Términos y condiciones
- `app/(tienda)/arrepentimiento/page.tsx` — Botón de arrepentimiento

### Modificar:
- `lib/google-sheets.ts` → ELIMINAR (reemplazado por lib/sheets/*)
- `lib/auth.ts` — Agregar roles, bcrypt salt rounds explícito
- `lib/utils.ts` — Agregar calcEnvio(), calcTransferPrice()
- `middleware.ts` — Agregar /panel/* con verificación de rol
- `app/layout.tsx` — Reducir de 8 fuentes a 2
- `next.config.js` — Agregar CSP headers, remotePatterns para R2
- `theme.config.ts` — Limpiar nombre a Ecomflex genérico
- `components/layout/Header.tsx` — Extraer SearchOverlay
- `components/catalog/ProductCard.tsx` — Centralizar ShareButton + descuento
- `components/catalog/FilterSidebar.tsx` — Usar CheckboxGroup
- `context/AssistantContext.tsx` — Agregar useMemo
- `context/CartContext.tsx` — Agregar useMemo
- `public/sw.js` — Limitar cache a 100 entries
- `.env.example` — Actualizar con TODAS las variables del spec

### Eliminar:
- Funciones fitness en google-sheets.ts: syncWorkout, syncRunSession, syncEvents, syncAcquisitionSource
- Redirects de /correr y /carreras en next.config.js
- @types/google.maps de devDependencies

---

## Task 1: Rebranding — Limpiar AOURA/MiTienda del código

**Files:**
- Modify: `theme.config.ts`
- Modify: `package.json`
- Modify: `public/manifest.json`
- Modify: `public/sw.js:4`

- [ ] **Step 1: Actualizar theme.config.ts**

Cambiar todas las referencias de "MiTienda" a valores genéricos:

```typescript
brand: {
  name: "MiTienda",  // → Cambiar a placeholder genérico
  // ...
}
```

Buscar y reemplazar: `MiTienda` → valor genérico del config. NO poner "Ecomflex" como nombre visible — el nombre visible viene del config que cada cliente personaliza.

- [ ] **Step 2: Actualizar package.json**

```json
{
  "name": "ecomflex",
  "description": "Ecomflex — Plataforma e-commerce con marketing integrado, IA y gestión"
}
```

- [ ] **Step 3: Actualizar manifest.json**

Cambiar `name` y `short_name` para que lean del theme config o usar placeholder genérico.

- [ ] **Step 4: Actualizar cache name en sw.js**

Línea 4: cambiar `"shop-v1"` → `"ecomflex-v1"`

- [ ] **Step 5: Buscar y eliminar cualquier referencia restante**

Buscar en todo el proyecto: "AOURA", "aoura", "piper", "Piper", "MiTienda", "NIA". Eliminar o reemplazar cada una.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: rebranding completo a Ecomflex — eliminar AOURA/MiTienda"
```

---

## Task 2: Eliminar código fitness

**Files:**
- Modify: `lib/google-sheets.ts:420-558` (eliminar funciones fitness)
- Modify: `next.config.js:18-22` (eliminar redirects /correr, /carreras)
- Modify: `package.json` (eliminar @types/google.maps)

- [ ] **Step 1: Eliminar funciones fitness de google-sheets.ts**

Eliminar estas funciones completas:
- `syncWorkout()` (líneas 420-458)
- `syncRunSession()` (líneas 462-490)
- `syncEvents()` (líneas 494-532)
- `syncAcquisitionSource()` (líneas 536-558)

- [ ] **Step 2: Eliminar redirects obsoletos de next.config.js**

Eliminar el bloque `async redirects()` completo (líneas 18-22) que redirige `/correr` y `/carreras` a `/cardio`.

- [ ] **Step 3: Eliminar @types/google.maps**

```bash
npm uninstall @types/google.maps
```

- [ ] **Step 4: Mover sharp a dependencies**

```bash
npm uninstall sharp && npm install sharp
```

- [ ] **Step 5: Verificar que el build pasa**

```bash
npm run type-check && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: eliminar código fitness, redirects obsoletos, deps innecesarias"
```

---

## Task 3: Crear lib/sheets/constants.ts — Índices de columnas

**Files:**
- Create: `lib/sheets/constants.ts`

- [ ] **Step 1: Crear archivo de constantes**

```typescript
// lib/sheets/constants.ts
// Índices de columnas para cada tab de Google Sheets
// Si se agrega o mueve una columna, actualizar SOLO aquí

export const RANGES = {
  PRODUCTOS: "Productos!A2:S",
  PEDIDOS: "Pedidos!A2:M",
  USUARIOS: "Usuarios!A2:E",
  RESENAS: "Resenas!A2:K",
  PERFILES: "Perfiles!A2:P",
  WEBAUTHN: "WebAuthn!A2:E",
} as const;

export const COL = {
  // Tab Productos
  PRODUCTO: {
    ID: 0,
    SLUG: 1,
    NOMBRE: 2,
    DESCRIPCION: 3,
    PRECIO: 4,
    PRECIO_ANTERIOR: 5,
    CATEGORIA: 6,
    MARCA: 7,
    IMAGEN_URL: 8,
    IMAGENES: 9,
    BADGE: 10,
    DESCUENTO: 11,
    STOCK: 12,
    TIPO: 13,
    LINK_AFILIADO: 14,
    VARIANTES: 15,
    DOSIS: 16,
    MOMENTO: 17,
    BENEFICIOS: 18,
  },
  // Tab Pedidos
  PEDIDO: {
    ID: 0,
    EMAIL: 1,
    TELEFONO: 2,
    NOMBRE: 3,
    APELLIDO: 4,
    DIRECCION: 5,
    CIUDAD: 6,
    CODIGO_POSTAL: 7,
    ITEMS: 8,
    SUBTOTAL: 9,
    ENVIO: 10,
    TOTAL: 11,
    METODO_PAGO: 12,
  },
  // Tab Usuarios
  USUARIO: {
    ID: 0,
    EMAIL: 1,
    NOMBRE: 2,
    HASH: 3,
    APELLIDO: 4,
  },
  // Tab Reseñas
  RESENA: {
    ID: 0,
    PRODUCT_SLUG: 1,
    NOMBRE: 2,
    EMAIL: 3,
    CALIFICACION: 4,
    TITULO: 5,
    CONTENIDO: 6,
    FECHA: 7,
    VERIFICADO: 8,
    APROBADO: 9,
    DESTACADA: 10,
  },
} as const;

// Cache TTLs
export const CACHE_TTL = {
  PRODUCTOS: 5 * 60 * 1000,   // 5 minutos
  RESENAS: 5 * 60 * 1000,     // 5 minutos
  PEDIDOS: 30 * 1000,          // 30 segundos
  CONFIG: 5 * 60 * 1000,       // 5 minutos
} as const;

// Estados de pedido
export const ORDER_STATUS = {
  CREADO: "creado",
  PENDIENTE_PAGO: "pendiente_pago",
  PAGADO: "pagado",
  PREPARANDO: "preparando",
  ENVIADO: "enviado",
  ENTREGADO: "entregado",
  CANCELADO: "cancelado",
  REEMBOLSADO: "reembolsado",
} as const;

// Estados de reseña
export const REVIEW_STATUS = {
  APROBADO: "si",
  PENDIENTE: "pendiente",
  RECHAZADO: "no",
  VERIFICADO: "true",
} as const;
```

- [ ] **Step 2: Commit**

```bash
git add lib/sheets/constants.ts
git commit -m "feat: crear constantes de columnas, TTLs y estados para Sheets"
```

---

## Task 4: Crear lib/sheets/client.ts — Conexión a Sheets

**Files:**
- Create: `lib/sheets/client.ts`

- [ ] **Step 1: Crear singleton de conexión**

```typescript
// lib/sheets/client.ts
// Singleton de autenticación y conexión a Google Sheets (2 sheets: pública + privada)

import { google, sheets_v4 } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

let authClient: ReturnType<typeof google.auth.JWT> | null = null;
let sheetsClient: sheets_v4.Sheets | null = null;

function getAuth() {
  if (!authClient) {
    const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!email || !key) {
      throw new Error("GOOGLE_SHEETS_CLIENT_EMAIL y GOOGLE_SHEETS_PRIVATE_KEY son requeridos");
    }

    authClient = new google.auth.JWT(email, undefined, key, SCOPES);
  }
  return authClient;
}

export function getSheets(): sheets_v4.Sheets {
  if (!sheetsClient) {
    sheetsClient = google.sheets({ version: "v4", auth: getAuth() });
  }
  return sheetsClient;
}

// IDs de las dos sheets (pública y privada)
export function getPublicSheetId(): string {
  const id = process.env.GOOGLE_SHEETS_PUBLIC_ID;
  if (!id) throw new Error("GOOGLE_SHEETS_PUBLIC_ID es requerido");
  return id;
}

export function getPrivateSheetId(): string {
  const id = process.env.GOOGLE_SHEETS_PRIVATE_ID;
  if (!id) throw new Error("GOOGLE_SHEETS_PRIVATE_ID es requerido");
  return id;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/sheets/client.ts
git commit -m "feat: crear cliente singleton para Google Sheets (dual sheet)"
```

---

## Task 5: Crear lib/sheets/helpers.ts — Funciones genéricas

**Files:**
- Create: `lib/sheets/helpers.ts`

- [ ] **Step 1: Crear helpers genéricos con retry**

```typescript
// lib/sheets/helpers.ts
// Funciones genéricas para leer/escribir en Google Sheets con retry y error handling

import { getSheets } from "./client";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // backoff exponencial

async function withRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const status = (error as { code?: number })?.code;
      const isRetryable = status === 429 || status === 503 || status === 500;

      if (!isRetryable || attempt === MAX_RETRIES) {
        console.error(`[Sheets] Error en ${context} después de ${attempt + 1} intentos:`, error);
        throw error;
      }

      const delay = RETRY_DELAYS[attempt] ?? 4000;
      console.warn(`[Sheets] Retry ${attempt + 1}/${MAX_RETRIES} para ${context} en ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error(`[Sheets] Agotados los reintentos para ${context}`);
}

// Leer todas las filas de un rango
export async function getRows(
  spreadsheetId: string,
  range: string
): Promise<string[][]> {
  return withRetry(async () => {
    const sheets = getSheets();
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    return (res.data.values as string[][]) ?? [];
  }, `getRows(${range})`);
}

// Buscar una fila por valor en una columna específica
export async function findRow(
  spreadsheetId: string,
  range: string,
  colIndex: number,
  value: string
): Promise<string[] | null> {
  const rows = await getRows(spreadsheetId, range);
  return rows.find((row) => row[colIndex] === value) ?? null;
}

// Buscar todas las filas que coincidan
export async function findRows(
  spreadsheetId: string,
  range: string,
  colIndex: number,
  value: string
): Promise<string[][]> {
  const rows = await getRows(spreadsheetId, range);
  return rows.filter((row) => row[colIndex] === value);
}

// Agregar una fila al final de un tab
export async function appendRow(
  spreadsheetId: string,
  range: string,
  values: (string | number | boolean)[]
): Promise<void> {
  return withRetry(async () => {
    const sheets = getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [values] },
    });
  }, `appendRow(${range})`);
}

// Actualizar una celda específica
export async function updateCell(
  spreadsheetId: string,
  range: string,
  value: string | number
): Promise<void> {
  return withRetry(async () => {
    const sheets = getSheets();
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[value]] },
    });
  }, `updateCell(${range})`);
}

// Buscar el índice de fila (1-based, para construir rangos de update)
export async function findRowIndex(
  spreadsheetId: string,
  range: string,
  colIndex: number,
  value: string
): Promise<number> {
  const rows = await getRows(spreadsheetId, range);
  const idx = rows.findIndex((row) => row[colIndex] === value);
  if (idx === -1) return -1;
  return idx + 2; // +2 porque: +1 por 0-index, +1 por header row
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/sheets/helpers.ts
git commit -m "feat: helpers genéricos para Sheets con retry exponencial"
```

---

## Task 6: Crear lib/sheets/products.ts

**Files:**
- Create: `lib/sheets/products.ts`

- [ ] **Step 1: Extraer funciones de productos de google-sheets.ts**

Migrar `getProducts()` (líneas 44-84) y `getProductBySlug()` (líneas 87-92) del monolito usando los nuevos helpers y constantes. Usar ISR-compatible pattern (no cache in-memory en el módulo — depender de ISR de Next.js).

```typescript
// lib/sheets/products.ts
import { getRows } from "./helpers";
import { getPublicSheetId } from "./client";
import { RANGES, COL } from "./constants";
import type { Product } from "@/types";

function mapRowToProduct(row: string[]): Product {
  const p = COL.PRODUCTO;
  return {
    id: row[p.ID] ?? "",
    slug: row[p.SLUG] ?? "",
    nombre: row[p.NOMBRE] ?? "",
    descripcion: row[p.DESCRIPCION] ?? "",
    precio: Number(row[p.PRECIO]) || 0,
    precio_anterior: row[p.PRECIO_ANTERIOR] ? Number(row[p.PRECIO_ANTERIOR]) : undefined,
    categoria: row[p.CATEGORIA] ?? "",
    marca: row[p.MARCA] ?? "",
    imagen_url: row[p.IMAGEN_URL] ?? "",
    imagenes: row[p.IMAGENES] ? row[p.IMAGENES].split(",").map((s) => s.trim()) : [],
    badge: row[p.BADGE] ?? "",
    descuento_porcentaje: row[p.DESCUENTO] ? Number(row[p.DESCUENTO]) : undefined,
    stock: Number(row[p.STOCK]) || 0,
    tipo: row[p.TIPO] ?? "",
    link_afiliado: row[p.LINK_AFILIADO] ?? "",
    variantes: row[p.VARIANTES] ? row[p.VARIANTES].split(",").map((s) => s.trim()) : [],
    dosis_recomendada: row[p.DOSIS] ?? "",
    mejor_momento: row[p.MOMENTO] ?? "",
    beneficios: row[p.BENEFICIOS] ?? "",
  };
}

export async function getProducts(): Promise<Product[]> {
  const rows = await getRows(getPublicSheetId(), RANGES.PRODUCTOS);
  return rows.map(mapRowToProduct).filter((p) => p.id && p.nombre);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) ?? null;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/sheets/products.ts
git commit -m "feat: módulo products.ts extraído de google-sheets.ts"
```

---

## Task 7: Crear lib/sheets/orders.ts

**Files:**
- Create: `lib/sheets/orders.ts`

- [ ] **Step 1: Extraer funciones de pedidos + agregar updateOrderStatus**

```typescript
// lib/sheets/orders.ts
import { getRows, findRow, appendRow, findRowIndex, updateCell } from "./helpers";
import { getPrivateSheetId } from "./client";
import { RANGES, COL, ORDER_STATUS } from "./constants";
import type { Order } from "@/types";

export async function createOrder(order: Order): Promise<void> {
  const c = COL.PEDIDO;
  await appendRow(getPrivateSheetId(), RANGES.PEDIDOS, [
    order.id,
    order.email,
    order.telefono,
    order.nombre,
    order.apellido,
    order.direccion,
    order.ciudad,
    order.codigo_postal,
    JSON.stringify(order.items),
    order.subtotal,
    order.envio,
    order.total,
    order.metodo_pago,
  ]);
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const row = await findRow(getPrivateSheetId(), RANGES.PEDIDOS, COL.PEDIDO.ID, orderId);
  if (!row) return null;
  return mapRowToOrder(row);
}

export async function getOrdersByEmail(email: string): Promise<Order[]> {
  const rows = await getRows(getPrivateSheetId(), RANGES.PEDIDOS);
  return rows
    .filter((row) => row[COL.PEDIDO.EMAIL] === email)
    .map(mapRowToOrder);
}

export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  // Buscar la fila del pedido
  const rowIndex = await findRowIndex(getPrivateSheetId(), RANGES.PEDIDOS, COL.PEDIDO.ID, orderId);
  if (rowIndex === -1) throw new Error(`Pedido ${orderId} no encontrado`);

  // Actualizar estado (asumimos columna N = índice 13 para estado)
  // NOTA: Agregar columna "estado" al tab Pedidos si no existe
  await updateCell(getPrivateSheetId(), `Pedidos!N${rowIndex}`, status);
}

function mapRowToOrder(row: string[]): Order {
  const c = COL.PEDIDO;
  return {
    id: row[c.ID] ?? "",
    email: row[c.EMAIL] ?? "",
    telefono: row[c.TELEFONO] ?? "",
    nombre: row[c.NOMBRE] ?? "",
    apellido: row[c.APELLIDO] ?? "",
    direccion: row[c.DIRECCION] ?? "",
    ciudad: row[c.CIUDAD] ?? "",
    codigo_postal: row[c.CODIGO_POSTAL] ?? "",
    items: row[c.ITEMS] ?? "[]",
    subtotal: Number(row[c.SUBTOTAL]) || 0,
    envio: Number(row[c.ENVIO]) || 0,
    total: Number(row[c.TOTAL]) || 0,
    metodo_pago: row[c.METODO_PAGO] ?? "",
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/sheets/orders.ts
git commit -m "feat: módulo orders.ts con updateOrderStatus()"
```

---

## Task 8: Crear lib/sheets/users.ts y lib/sheets/reviews.ts

**Files:**
- Create: `lib/sheets/users.ts`
- Create: `lib/sheets/reviews.ts`

- [ ] **Step 1: Extraer users.ts**

Migrar `createUser()` (línea 168) y `getUserByEmail()` (línea 196) usando helpers.

- [ ] **Step 2: Extraer reviews.ts**

Migrar `mapRowToReview()`, `getRawReviews()`, `getReviewsByProduct()`, `getFeaturedReviews()`, `getReviewSummary()`, `getAllReviewSummaries()`, `createReview()`, `isVerifiedBuyer()` usando helpers y constantes.

- [ ] **Step 3: Commit**

```bash
git add lib/sheets/users.ts lib/sheets/reviews.ts
git commit -m "feat: módulos users.ts y reviews.ts extraídos"
```

---

## Task 9: Eliminar google-sheets.ts y actualizar imports

**Files:**
- Delete: `lib/google-sheets.ts`
- Modify: ALL files that import from `@/lib/google-sheets`

- [ ] **Step 1: Buscar todos los imports del monolito**

```bash
grep -r "from.*google-sheets" --include="*.ts" --include="*.tsx" -l
```

- [ ] **Step 2: Actualizar cada import**

Para cada archivo encontrado, cambiar:
```typescript
// ANTES:
import { getProducts, getProductBySlug } from "@/lib/google-sheets";

// DESPUÉS:
import { getProducts, getProductBySlug } from "@/lib/sheets/products";
```

Mapeo de imports:
- `getProducts`, `getProductBySlug` → `@/lib/sheets/products`
- `createOrder`, `getOrderById`, `getOrdersByEmail` → `@/lib/sheets/orders`
- `createUser`, `getUserByEmail` → `@/lib/sheets/users`
- `getReviewsByProduct`, `getFeaturedReviews`, `createReview`, `isVerifiedBuyer`, `getReviewSummary`, `getAllReviewSummaries` → `@/lib/sheets/reviews`
- `SHEET_ID` → `getPublicSheetId()` o `getPrivateSheetId()` de `@/lib/sheets/client`

- [ ] **Step 3: Eliminar google-sheets.ts**

```bash
rm lib/google-sheets.ts
```

- [ ] **Step 4: Verificar build**

```bash
npm run type-check && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: eliminar google-sheets.ts monolito — todo migrado a lib/sheets/*"
```

---

## Task 10: Centralizar constantes de negocio en utils.ts

**Files:**
- Modify: `lib/utils.ts`
- Modify: `components/catalog/ProductCard.tsx:113`
- Modify: `app/checkout/page.tsx:13`
- Modify: `app/api/checkout/transferencia/route.ts:8`
- Modify: `app/api/checkout/route.ts:17-22`

- [ ] **Step 1: Agregar funciones centralizadas a utils.ts**

```typescript
// Agregar a lib/utils.ts:

export const TRANSFER_DISCOUNT_PERCENT = Number(
  process.env.NEXT_PUBLIC_TRANSFER_DISCOUNT ?? 10
);

export function calcTransferPrice(precio: number): number {
  return Math.round(precio * (1 - TRANSFER_DISCOUNT_PERCENT / 100));
}

export function calcEnvio(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_COST;
}
```

- [ ] **Step 2: Actualizar ProductCard.tsx**

Línea 113: cambiar `Math.round(product.precio * 0.9)` → `calcTransferPrice(product.precio)`

- [ ] **Step 3: Actualizar endpoints de checkout**

En `app/api/checkout/route.ts` y `app/api/checkout/transferencia/route.ts`: usar `calcSubtotal()` y `calcEnvio()` de `@/lib/utils`.

- [ ] **Step 4: Verificar build**

```bash
npm run type-check
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: centralizar cálculos de descuento, envío y subtotal en utils.ts"
```

---

## Task 11: Reducir fuentes de 8 a 2

**Files:**
- Modify: `app/layout.tsx:10-30`

- [ ] **Step 1: Eliminar fuentes no usadas**

Reemplazar el bloque de 8 fuentes por solo las 2 configuradas. Usar import dinámico basado en theme.config:

```typescript
// app/layout.tsx — ANTES: 8 imports, DESPUÉS: solo 2

import { Space_Grotesk, Inter } from "next/font/google";
// (usar las fuentes que estén en themeConfig.styles.fonts)

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const bodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600"],
});

// Eliminar ALL_FONTS map y la lógica de selección dinámica
// Las fuentes se eligen editando estos 2 imports directamente
```

- [ ] **Step 2: Eliminar preconnects manuales a Google Fonts**

Líneas 91-92: eliminar los `<link rel="preconnect">` ya que Next.js los maneja automáticamente.

- [ ] **Step 3: Verificar build y que las fuentes se ven bien**

```bash
npm run build && npm run dev
```

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx
git commit -m "perf: reducir de 8 fuentes Google a 2 — eliminar peso innecesario del bundle"
```

---

## Task 12: Proteger /panel/* con middleware + roles

**Files:**
- Modify: `middleware.ts`
- Modify: `lib/auth.ts`

- [ ] **Step 1: Actualizar middleware.ts**

```typescript
// middleware.ts
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/checkout/:path*",
    "/cuenta/:path*",
    "/tracking/:path*",
    "/panel/:path*",     // NUEVO: proteger panel admin
  ],
};
```

- [ ] **Step 2: Agregar verificación de rol admin en auth.ts**

En el callback `session` de authOptions, agregar el rol del usuario:

```typescript
// En lib/auth.ts, callback session:
async session({ session, token }) {
  if (session.user) {
    session.user.id = token.sub ?? "";
    session.user.role = token.role ?? "cliente"; // NUEVO
  }
  return session;
},

// En callback jwt:
async jwt({ token, user }) {
  if (user) {
    token.role = user.role ?? "cliente"; // NUEVO
  }
  return token;
},
```

- [ ] **Step 3: Agregar bcrypt salt rounds explícito**

En lib/auth.ts, donde se hashea el password (CredentialsProvider authorize):
```typescript
// Asegurar que bcrypt usa salt rounds >= 10
const isValid = await bcrypt.compare(password, user.hash);
// Y en createUser:
const hash = await bcrypt.hash(password, 12); // explícito: 12 rounds
```

- [ ] **Step 4: Commit**

```bash
git add middleware.ts lib/auth.ts
git commit -m "security: proteger /panel/* con middleware + roles admin/cliente"
```

---

## Task 13: Extraer SearchOverlay de Header.tsx

**Files:**
- Create: `components/tienda/SearchOverlay.tsx`
- Modify: `components/layout/Header.tsx`

- [ ] **Step 1: Crear SearchOverlay.tsx**

Extraer líneas 181-260 de Header.tsx (el overlay completo con su estado: buscar, resultados, searchOpen) a un componente independiente.

- [ ] **Step 2: Actualizar Header.tsx**

Reemplazar el bloque del overlay por `<SearchOverlay />` y pasar props necesarios.

- [ ] **Step 3: Verificar que la búsqueda sigue funcionando**

```bash
npm run dev
# Probar: abrir búsqueda, escribir, ver resultados, cerrar
```

- [ ] **Step 4: Commit**

```bash
git add components/tienda/SearchOverlay.tsx components/layout/Header.tsx
git commit -m "refactor: extraer SearchOverlay de Header.tsx (264→~100 líneas)"
```

---

## Task 14: Crear componente de iconos compartido

**Files:**
- Create: `components/shared/Icons.tsx`
- Modify: `components/layout/Header.tsx` (SVG usuario duplicado)
- Modify: `components/layout/BottomNav.tsx` (SVG usuario duplicado)
- Modify: `app/page.tsx` (SVGs de features)

- [ ] **Step 1: Crear Icons.tsx con todos los SVGs reutilizados**

```typescript
// components/shared/Icons.tsx
// Iconos SVG compartidos — NO duplicar SVGs entre componentes

export function UserIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

// Agregar más iconos según se necesiten (truck, shield, headphones, etc.)
```

- [ ] **Step 2: Reemplazar SVGs duplicados en Header y BottomNav**

- [ ] **Step 3: Commit**

```bash
git add components/shared/Icons.tsx components/layout/Header.tsx components/layout/BottomNav.tsx
git commit -m "refactor: crear componente Icons compartido — eliminar SVGs duplicados"
```

---

## Task 15: Extraer ShareButton y CheckboxGroup

**Files:**
- Modify: `components/catalog/ProductCard.tsx` (ShareButton 3x → 1x)
- Create: `components/shared/CheckboxGroup.tsx`
- Modify: `components/catalog/FilterSidebar.tsx`

- [ ] **Step 1: En ProductCard.tsx, extraer la URL del share fuera de los condicionales**

```typescript
// Al inicio del componente:
const productUrl = typeof window !== "undefined"
  ? `${window.location.origin}/productos/${product.slug}`
  : `/productos/${product.slug}`;

const shareButton = (
  <ShareButton
    title={product.nombre}
    text={`Mirá ${product.nombre}`}
    url={productUrl}
    variant="icon"
  />
);
```

Luego usar `{shareButton}` en los 3 lugares en vez de repetir el JSX.

- [ ] **Step 2: Crear CheckboxGroup.tsx**

```typescript
// components/shared/CheckboxGroup.tsx
interface CheckboxGroupProps {
  items: { slug: string; nombre: string }[];
  selected: string[];
  onToggle: (slug: string) => void;
}

export function CheckboxGroup({ items, selected, onToggle }: CheckboxGroupProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <label key={item.slug} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(item.slug)}
            onChange={() => onToggle(item.slug)}
            className="hidden"
          />
          {/* Estilos del checkbox visual */}
        </label>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Actualizar FilterSidebar.tsx para usar CheckboxGroup**

Reemplazar los 2 bloques duplicados (líneas 91-119 y 154-182) con `<CheckboxGroup />`.

Unificar `toggleCategoria` y `toggleMarca` en una función genérica `toggle(list, setter, value)`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: extraer ShareButton (3x→1x) y crear CheckboxGroup"
```

---

## Task 16: Agregar useMemo a Context Providers

**Files:**
- Modify: `context/CartContext.tsx`
- Modify: `context/AssistantContext.tsx`

- [ ] **Step 1: Agregar useMemo al value de CartContext**

```typescript
// En CartContext.tsx, antes del return del Provider:
const value = useMemo(() => ({
  items, isOpen, openCart, closeCart, addItem, removeItem,
  updateQuantity, clearCart, totalItems, subtotal, toastProduct,
}), [items, isOpen, toastProduct, totalItems, subtotal]);
```

- [ ] **Step 2: Agregar useMemo al value de AssistantContext**

```typescript
// En AssistantContext.tsx:
const value = useMemo(() => ({
  isOpen, messages, loading,
  openAssistant, closeAssistant, toggleAssistant, sendMessage,
}), [isOpen, messages, loading]);
```

- [ ] **Step 3: Limitar mensajes a 50 en AssistantContext**

En la función que agrega mensajes, agregar:
```typescript
setMessages(prev => [...prev, newMsg].slice(-50));
```

- [ ] **Step 4: Commit**

```bash
git add context/CartContext.tsx context/AssistantContext.tsx
git commit -m "perf: agregar useMemo a Context values + limitar mensajes Kira a 50"
```

---

## Task 17: Limitar cache del Service Worker

**Files:**
- Modify: `public/sw.js`

- [ ] **Step 1: Agregar límite de 100 entries al cache**

En el handler de fetch, antes de `cache.put`, agregar:

```javascript
// Limitar cache a 100 entries
const keys = await cache.keys();
if (keys.length > 100) {
  await cache.delete(keys[0]); // Eliminar la más vieja
}
```

- [ ] **Step 2: Commit**

```bash
git add public/sw.js
git commit -m "perf: limitar service worker cache a 100 entries"
```

---

## Task 18: Agregar CSP headers y remotePatterns

**Files:**
- Modify: `next.config.js`

- [ ] **Step 1: Agregar Content Security Policy**

```javascript
// En next.config.js, dentro del array de headers:
{
  key: "Content-Security-Policy",
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://api.mercadopago.com https://api.openai.com https://*.googleapis.com",
    "frame-src 'self' https://sdk.mercadopago.com",
  ].join("; "),
}
```

- [ ] **Step 2: Agregar remotePatterns para Cloudflare R2**

```javascript
// En next.config.js, images.remotePatterns:
{
  protocol: "https",
  hostname: "pub-*.r2.dev",
}
```

- [ ] **Step 3: Commit**

```bash
git add next.config.js
git commit -m "security: agregar CSP headers + remotePatterns para R2"
```

---

## Task 19: Crear páginas legales

**Files:**
- Create: `app/(tienda)/politica-privacidad/page.tsx`
- Create: `app/(tienda)/terminos/page.tsx`
- Create: `app/(tienda)/arrepentimiento/page.tsx`

- [ ] **Step 1: Crear página de política de privacidad**

Página estática con la política de privacidad según Ley 25.326. Usar datos del themeConfig (nombre de marca, email de contacto).

- [ ] **Step 2: Crear página de términos y condiciones**

Incluir: política de devolución (10 días, Ley 24.240), medios de pago, tiempos de envío, datos del vendedor.

- [ ] **Step 3: Crear página de arrepentimiento**

Formulario simple: nombre, email, número de pedido, motivo. Botón "Solicitar arrepentimiento". Envía email al admin.

- [ ] **Step 4: Agregar links a estas páginas en el footer**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "legal: agregar política privacidad, términos y botón arrepentimiento (Res. 424/2020)"
```

---

## Task 20: Actualizar .env.example

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Reescribir .env.example con TODAS las variables del spec**

Incluir todas las variables de la sección 17 del spec, con comentarios explicativos en español.

- [ ] **Step 2: Reconciliar nombres de variables**

Asegurar que los nombres en `.env.example` coincidan exactamente con los que usa el código:
- `GOOGLE_SHEETS_PUBLIC_ID` (no `GOOGLE_SHEETS_SPREADSHEET_ID`)
- `GOOGLE_SHEETS_CLIENT_EMAIL` (no `GOOGLE_SERVICE_ACCOUNT_EMAIL`)
- `GOOGLE_SHEETS_PRIVATE_KEY` (no `GOOGLE_PRIVATE_KEY`)

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: actualizar .env.example con TODAS las variables del spec v3"
```

---

## Task 21: Verificación final de Phase 0

**Files:** Todos

- [ ] **Step 1: Type check completo**

```bash
npm run type-check
```
Expected: 0 errores

- [ ] **Step 2: Build de producción**

```bash
npm run build
```
Expected: Build exitoso sin warnings

- [ ] **Step 3: Lint**

```bash
npm run lint
```
Expected: 0 errores

- [ ] **Step 4: Verificar que no quedan referencias a AOURA**

```bash
grep -ri "aoura\|piper\|MiTienda\|syncWorkout\|syncRunSession" --include="*.ts" --include="*.tsx" -l
```
Expected: 0 resultados

- [ ] **Step 5: Verificar estructura lib/sheets/**

```bash
ls lib/sheets/
```
Expected: client.ts, helpers.ts, constants.ts, products.ts, orders.ts, users.ts, reviews.ts (+ cache.ts si se creó)

- [ ] **Step 6: Dev server funciona**

```bash
npm run dev
```
Verificar: homepage carga, productos se muestran, carrito funciona, búsqueda funciona.

- [ ] **Step 7: Commit final + push**

```bash
git add -A
git commit -m "Phase 0 complete: Ecomflex base limpia, modular y segura"
git push origin main
```

---

## Resumen de Tasks

| Task | Descripción | Archivos principales |
|------|------------|---------------------|
| 1 | Rebranding Ecomflex | theme.config.ts, package.json, manifest.json |
| 2 | Eliminar código fitness | google-sheets.ts, next.config.js, package.json |
| 3 | Constantes de columnas | lib/sheets/constants.ts (NUEVO) |
| 4 | Cliente Sheets singleton | lib/sheets/client.ts (NUEVO) |
| 5 | Helpers genéricos con retry | lib/sheets/helpers.ts (NUEVO) |
| 6 | Módulo products.ts | lib/sheets/products.ts (NUEVO) |
| 7 | Módulo orders.ts | lib/sheets/orders.ts (NUEVO) |
| 8 | Módulos users.ts + reviews.ts | lib/sheets/ (NUEVO x2) |
| 9 | Eliminar monolito + actualizar imports | google-sheets.ts (DELETE), 15+ archivos |
| 10 | Centralizar constantes negocio | lib/utils.ts, ProductCard, checkouts |
| 11 | Reducir fuentes 8→2 | app/layout.tsx |
| 12 | Proteger panel + roles | middleware.ts, lib/auth.ts |
| 13 | Extraer SearchOverlay | Header.tsx → SearchOverlay.tsx |
| 14 | Iconos compartidos | Icons.tsx (NUEVO), Header, BottomNav |
| 15 | ShareButton + CheckboxGroup | ProductCard, FilterSidebar, CheckboxGroup (NUEVO) |
| 16 | useMemo en Contexts | CartContext.tsx, AssistantContext.tsx |
| 17 | Limitar SW cache | public/sw.js |
| 18 | CSP + remotePatterns | next.config.js |
| 19 | Páginas legales | 3 páginas nuevas (privacidad, términos, arrepentimiento) |
| 20 | .env.example completo | .env.example |
| 21 | Verificación final | Build, lint, type-check, grep |
