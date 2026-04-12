// lib/sheets/coupons.ts
// CRUD de cupones con validación (vencimiento + usos máximos)

import {
  getRows,
  findRow,
  appendRow,
  updateCell,
  findRowIndex,
  colLetter,
  parseSheetBool,
  serializeSheetBool,
} from "./helpers";
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
    activo: parseSheetBool(row[c.ACTIVO]),
    descripcion: row[c.DESCRIPCION] || undefined, // normaliza "" a undefined
  };
}

export async function getCoupons(): Promise<Coupon[]> {
  const rows = await getRows(getPrivateSheetId(), RANGES.CUPONES);
  return rows.map(mapRowToCoupon).filter((c) => c.codigo);
}

// Normaliza un codigo de cupon a UPPERCASE + trim para lookups case-insensitive.
function normalizeCode(codigo: string): string {
  return codigo.toUpperCase().trim();
}

export async function getCouponByCode(codigo: string): Promise<Coupon | null> {
  const row = await findRow(
    getPrivateSheetId(),
    RANGES.CUPONES,
    COL.CUPON.CODIGO,
    normalizeCode(codigo)
  );
  return row ? mapRowToCoupon(row) : null;
}

/**
 * Crea un cupón nuevo.
 * NOTA: read-modify-write no atómico. La verificación de existencia y el append
 * no están protegidos contra concurrencia: dos llamadas simultáneas con el mismo
 * código podrían insertar duplicados. Aceptable para MVP por baja concurrencia
 * (creación de cupones es admin-only). Migrar a batchUpdate o Postgres si crece.
 */
export async function createCoupon(coupon: Omit<Coupon, "usos_actuales">): Promise<void> {
  const codigoNorm = normalizeCode(coupon.codigo);
  // Verificar que no exista
  const existing = await getCouponByCode(codigoNorm);
  if (existing) {
    throw new Error(`El cupón ${codigoNorm} ya existe`);
  }

  await appendRow(getPrivateSheetId(), RANGES.CUPONES, [
    codigoNorm,
    coupon.descuento_porcentaje,
    coupon.fecha_vencimiento,
    coupon.usos_maximos,
    0, // usos_actuales inicial
    serializeSheetBool(coupon.activo),
    coupon.descripcion ?? "",
  ]);
}

/**
 * Incrementa el contador de usos del cupón.
 * NOTA: read-modify-write no atómico. En el peor caso, dos checkouts concurrentes
 * pueden incrementar al mismo tiempo y perder un uso. Aceptable para MVP por baja
 * concurrencia. Migrar a batchUpdate o Postgres si el volumen crece.
 */
export async function incrementCouponUsage(codigo: string): Promise<void> {
  const codigoNorm = normalizeCode(codigo);
  const rowIndex = await findRowIndex(getPrivateSheetId(), RANGES.CUPONES, COL.CUPON.CODIGO, codigoNorm);
  if (rowIndex === -1) throw new Error(`Cupón ${codigoNorm} no encontrado`);

  const coupon = await getCouponByCode(codigoNorm);
  if (!coupon) throw new Error(`Cupón ${codigoNorm} no encontrado`);

  await updateCell(
    getPrivateSheetId(),
    `Cupones!${colLetter(COL.CUPON.USOS_ACTUALES)}${rowIndex}`,
    coupon.usos_actuales + 1
  );
}

export async function deactivateCoupon(codigo: string): Promise<void> {
  const codigoNorm = normalizeCode(codigo);
  const rowIndex = await findRowIndex(getPrivateSheetId(), RANGES.CUPONES, COL.CUPON.CODIGO, codigoNorm);
  if (rowIndex === -1) throw new Error(`Cupón ${codigoNorm} no encontrado`);

  await updateCell(
    getPrivateSheetId(),
    `Cupones!${colLetter(COL.CUPON.ACTIVO)}${rowIndex}`,
    serializeSheetBool(false)
  );
}

/**
 * Valida un cupón: existe, activo, no vencido, usos disponibles.
 * NOTA: fecha_vencimiento se interpreta como ISO date. La comparación usa
 * UTC del servidor (Vercel). Para zona horaria de Argentina, el admin debe
 * setear una fecha futura con margen suficiente.
 * @returns El cupón si es válido, null si no.
 */
export async function validateCoupon(codigo: string): Promise<Coupon | null> {
  const coupon = await getCouponByCode(normalizeCode(codigo));
  if (!coupon) return null;
  if (!coupon.activo) return null;

  // Verificar vencimiento — si viene solo la fecha (YYYY-MM-DD), interpretar
  // como fin del dia en zona horaria Argentina (UTC-3) para evitar que
  // expire 13 horas antes (cuando JS la parseaba como UTC midnight).
  const rawDate = coupon.fecha_vencimiento;
  const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? `${rawDate}T23:59:59-03:00`
    : rawDate;
  const vencimiento = new Date(isoDate);
  if (isNaN(vencimiento.getTime()) || vencimiento < new Date()) return null;

  // Verificar usos (0 = ilimitado)
  if (coupon.usos_maximos > 0 && coupon.usos_actuales >= coupon.usos_maximos) return null;

  return coupon;
}
