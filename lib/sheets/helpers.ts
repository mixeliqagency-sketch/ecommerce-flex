// lib/sheets/helpers.ts
// Funciones genéricas para leer/escribir en Google Sheets con retry y error handling

import { getSheets } from "./client";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

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

export async function findRow(
  spreadsheetId: string,
  range: string,
  colIndex: number,
  value: string
): Promise<string[] | null> {
  const rows = await getRows(spreadsheetId, range);
  return rows.find((row) => row[colIndex] === value) ?? null;
}

export async function findRows(
  spreadsheetId: string,
  range: string,
  colIndex: number,
  value: string
): Promise<string[][]> {
  const rows = await getRows(spreadsheetId, range);
  return rows.filter((row) => row[colIndex] === value);
}

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

/**
 * Convierte un índice de columna 0-based a letra de columna (A, B, C, ..., Z, AA, AB, ...).
 * Ejemplo: colLetter(0) = "A", colLetter(4) = "E", colLetter(26) = "AA"
 */
export function colLetter(index: number): string {
  let result = "";
  let n = index;
  while (n >= 0) {
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

/**
 * Parsea un valor de Sheets a booleano.
 * Acepta: "true", "TRUE", "True", "1", "si", "sí", "yes" → true.
 * Acepta: "false", "FALSE", "0", "no", "" → false.
 */
export function parseSheetBool(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return ["true", "1", "si", "sí", "yes"].includes(normalized);
}

/**
 * Serializa un booleano para escribir en Sheets.
 */
export function serializeSheetBool(value: boolean): "true" | "false" {
  return value ? "true" : "false";
}

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
