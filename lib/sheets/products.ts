// lib/sheets/products.ts
// Funciones para leer productos desde Google Sheets (sheet pública)

import { getRows, findRowIndex, updateCell, colLetter } from "./helpers";
import { getPublicSheetId } from "./client";
import { RANGES, COL } from "./constants";
import type { Product } from "@/types";

// Convierte una fila de la hoja en un objeto Product tipado
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
    badge: (row[p.BADGE] as Product["badge"]) || undefined,
    descuento_porcentaje: row[p.DESCUENTO] ? Number(row[p.DESCUENTO]) : undefined,
    stock: Number(row[p.STOCK]) || 0,
    tipo: row[p.TIPO] ?? "suplemento",
    link_afiliado: row[p.LINK_AFILIADO] || undefined,
    variantes: row[p.VARIANTES] ? row[p.VARIANTES].split(",").map((s) => s.trim()) : [],
    dosis_recomendada: row[p.DOSIS] || undefined,
    mejor_momento: row[p.MOMENTO] || undefined,
    beneficios: row[p.BENEFICIOS] || undefined,
  };
}

// Trae todos los productos activos (con id y nombre) de la hoja Productos
export async function getProducts(): Promise<Product[]> {
  const rows = await getRows(getPublicSheetId(), RANGES.PRODUCTOS);
  return rows.map(mapRowToProduct).filter((p) => p.id && p.nombre);
}

// Busca un producto por su slug único
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

/**
 * Decrementa el stock de un producto (best-effort con Sheets API).
 * NOTA: Sheets no es transaccional — bajo concurrencia puede haber oversell.
 * Aceptable para Phase 1; Phase 2 migrar a lock optimista con columna version.
 */
export async function decrementStock(slug: string, cantidad: number): Promise<void> {
  const product = await getProductBySlug(slug);
  if (!product) throw new Error(`Producto ${slug} no encontrado para decrementar stock`);

  const rowIndex = await findRowIndex(
    getPublicSheetId(),
    RANGES.PRODUCTOS,
    COL.PRODUCTO.SLUG,
    slug
  );
  if (rowIndex === -1) throw new Error(`Producto ${slug} no encontrado en sheet`);

  const newStock = Math.max(0, product.stock - cantidad);
  await updateCell(
    getPublicSheetId(),
    `Productos!${colLetter(COL.PRODUCTO.STOCK)}${rowIndex}`,
    newStock
  );
}
