// lib/sheets/reviews.ts
// Funciones para leer y crear reseñas en Google Sheets
//
// Las reseñas se leen de la sheet PÚBLICA (visibles para todos)
// La verificación de compra requiere leer pedidos de la sheet PRIVADA
//
// Layout de columnas en "Resenas" según COL.RESENA en constants.ts:
// 0: id, 1: product_slug, 2: nombre, 3: email, 4: calificacion,
// 5: titulo, 6: contenido, 7: fecha, 8: verificado, 9: aprobado, 10: destacada

import { getRows, appendRow } from "./helpers";
import { getPublicSheetId, getPrivateSheetId } from "./client";
import { RANGES, COL } from "./constants";
import { getProducts } from "./products";
import type { Review, ReviewSummary } from "@/types";

// Convierte una fila de la hoja en un objeto Review tipado
function mapRowToReview(row: string[], overrides?: Partial<Review>): Review {
  const c = COL.RESENA;
  const review: Review = {
    id: row[c.ID] || "",
    product_slug: row[c.PRODUCT_SLUG] || "",
    nombre: row[c.NOMBRE] || "",
    email: row[c.EMAIL] || "",
    calificacion: (Number(row[c.CALIFICACION]) || 5) as Review["calificacion"],
    titulo: row[c.TITULO] || "",
    contenido: row[c.CONTENIDO] || "",
    fecha: row[c.FECHA] || "",
    aprobado: (row[c.APROBADO] || "pendiente") as Review["aprobado"],
    verificado: row[c.VERIFICADO] === "true",
    destacada: row[c.DESTACADA] === "true",
  };
  // Permite forzar valores (ej: destacada: true en getFeaturedReviews)
  if (overrides) Object.assign(review, overrides);
  return review;
}

// Lee todas las filas crudas de la hoja Resenas (sheet pública)
async function getRawReviews(): Promise<string[][]> {
  return getRows(getPublicSheetId(), RANGES.RESENAS);
}

// Devuelve las reseñas aprobadas de un producto dado su slug
export async function getReviewsByProduct(productSlug: string): Promise<Review[]> {
  const rows = await getRawReviews();
  return rows
    .filter(
      (row) =>
        row[COL.RESENA.PRODUCT_SLUG] === productSlug &&
        row[COL.RESENA.APROBADO] === "si"
    )
    .map((row) => mapRowToReview(row));
}

// Devuelve las reseñas destacadas para el carrusel de la home
export async function getFeaturedReviews(): Promise<Review[]> {
  const rows = await getRawReviews();
  return rows
    .filter(
      (row) =>
        row[COL.RESENA.APROBADO] === "si" &&
        row[COL.RESENA.DESTACADA] === "true"
    )
    .map((row) => mapRowToReview(row, { destacada: true, aprobado: "si" }));
}

// Calcula el promedio y distribución de calificaciones para un producto
// Acepta reviews pre-obtenidas para evitar lecturas duplicadas en Promise.all
export async function getReviewSummary(
  productSlug: string,
  reviews?: Review[]
): Promise<ReviewSummary> {
  const data = reviews ?? (await getReviewsByProduct(productSlug));
  const distribucion: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of data) {
    distribucion[r.calificacion]++;
  }
  const total = data.length;
  const promedio =
    total > 0 ? data.reduce((sum, r) => sum + r.calificacion, 0) / total : 0;
  return { promedio: Math.round(promedio * 10) / 10, total, distribucion };
}

// Calcula resumenes de todos los productos en una sola lectura (para el listado)
export async function getAllReviewSummaries(): Promise<Record<string, ReviewSummary>> {
  const rows = await getRawReviews();
  if (rows.length === 0) return {};

  // Agrupa calificaciones por slug de producto (solo reseñas aprobadas)
  const byProduct: Record<string, number[]> = {};
  for (const row of rows) {
    if (row[COL.RESENA.APROBADO] !== "si") continue;
    const slug = row[COL.RESENA.PRODUCT_SLUG];
    if (!slug) continue;
    if (!byProduct[slug]) byProduct[slug] = [];
    byProduct[slug].push(Number(row[COL.RESENA.CALIFICACION]) || 5);
  }

  const result: Record<string, ReviewSummary> = {};
  for (const [slug, ratings] of Object.entries(byProduct)) {
    const distribucion: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of ratings) {
      if (r >= 1 && r <= 5) distribucion[r as 1 | 2 | 3 | 4 | 5]++;
    }
    const total = ratings.length;
    const promedio = total > 0 ? ratings.reduce((a, b) => a + b, 0) / total : 0;
    result[slug] = { promedio: Math.round(promedio * 10) / 10, total, distribucion };
  }
  return result;
}

// Crea una nueva reseña pendiente de aprobación
export async function createReview(review: Omit<Review, "id" | "fecha">): Promise<void> {
  const id = Date.now().toString();
  const fecha = new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  await appendRow(getPublicSheetId(), RANGES.RESENAS, [
    id,
    review.product_slug,
    review.nombre,
    review.email,
    review.calificacion,
    review.titulo,
    review.contenido,
    fecha,
    String(review.verificado),
    review.aprobado,
    String(review.destacada),
  ]);
}

// Verifica si un email realizó una compra confirmada del producto dado
// Busca en pedidos (sheet privada) que no estén en estado "pendiente"
export async function isVerifiedBuyer(
  email: string,
  productSlug: string
): Promise<boolean> {
  const rows = await getRows(getPrivateSheetId(), RANGES.PEDIDOS);
  const products = await getProducts();
  const product = products.find((p) => p.slug === productSlug);
  if (!product) return false;

  return rows.some((row) => {
    const orderEmail = row[2]; // columna email en layout de pedidos
    const items = row[6] || ""; // columna items_resumen
    const estado = row[11] || ""; // columna estado
    return (
      orderEmail === email &&
      items.toLowerCase().includes(product.nombre.toLowerCase()) &&
      estado !== "pendiente"
    );
  });
}
