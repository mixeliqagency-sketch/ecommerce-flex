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
