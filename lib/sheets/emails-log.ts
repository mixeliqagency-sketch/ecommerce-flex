// lib/sheets/emails-log.ts
// Historial de emails enviados — para métricas de email marketing

import crypto from "crypto";
import {
  getRows,
  appendRow,
  findRowIndex,
  updateCell,
  colLetter,
  parseSheetBool,
  serializeSheetBool,
  startOfDayArgentina,
} from "./helpers";
import { getPrivateSheetId } from "./client";
import { RANGES, COL } from "./constants";
import type { EmailLog } from "@/types";

function mapRowToLog(row: string[]): EmailLog {
  const c = COL.EMAIL_LOG;
  return {
    id: row[c.ID] ?? "",
    tipo: row[c.TIPO] ?? "",
    destinatario: row[c.DESTINATARIO] ?? "",
    asunto: row[c.ASUNTO] ?? "",
    fecha_envio: row[c.FECHA_ENVIO] ?? "",
    abierto: parseSheetBool(row[c.ABIERTO]),
    fecha_apertura: row[c.FECHA_APERTURA] || undefined,
    error: row[c.ERROR] || undefined,
  };
}

export async function logEmailSent(
  tipo: string,
  destinatario: string,
  asunto: string,
  error?: string
): Promise<string> {
  const id = crypto.randomUUID();
  await appendRow(getPrivateSheetId(), RANGES.EMAILS_LOG, [
    id,
    tipo,
    destinatario,
    asunto,
    new Date().toISOString(),
    serializeSheetBool(false),
    "",
    error ?? "",
  ]);
  return id;
}

export async function markEmailOpened(logId: string): Promise<void> {
  const rowIndex = await findRowIndex(
    getPrivateSheetId(),
    RANGES.EMAILS_LOG,
    COL.EMAIL_LOG.ID,
    logId
  );
  if (rowIndex === -1) return;

  await updateCell(
    getPrivateSheetId(),
    `EmailsLog!${colLetter(COL.EMAIL_LOG.ABIERTO)}${rowIndex}`,
    serializeSheetBool(true)
  );
  await updateCell(
    getPrivateSheetId(),
    `EmailsLog!${colLetter(COL.EMAIL_LOG.FECHA_APERTURA)}${rowIndex}`,
    new Date().toISOString()
  );
}

export async function getEmailStats(): Promise<{
  enviados_hoy: number;
  enviados_semana: number;
  tasa_apertura_pct: number;
  total_enviados: number;
}> {
  const rows = await getRows(getPrivateSheetId(), RANGES.EMAILS_LOG);
  const logs = rows.map(mapRowToLog);

  const hoy = startOfDayArgentina(new Date());
  const semanaAtras = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);

  const enviadosHoy = logs.filter(
    (l) => new Date(l.fecha_envio) >= hoy && !l.error
  ).length;
  const enviadosSemana = logs.filter(
    (l) => new Date(l.fecha_envio) >= semanaAtras && !l.error
  ).length;

  const total = logs.filter((l) => !l.error).length;
  const abiertos = logs.filter((l) => l.abierto && !l.error).length;
  const tasa = total > 0 ? (abiertos / total) * 100 : 0;

  return {
    enviados_hoy: enviadosHoy,
    enviados_semana: enviadosSemana,
    tasa_apertura_pct: Math.round(tasa * 10) / 10,
    total_enviados: total,
  };
}
