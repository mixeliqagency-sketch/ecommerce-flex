// lib/sheets/coupons.ts
// CRUD de cupones con validación (vencimiento + usos máximos)

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

  // Verificar usos (0 = ilimitado)
  if (coupon.usos_maximos > 0 && coupon.usos_actuales >= coupon.usos_maximos) return null;

  return coupon;
}
