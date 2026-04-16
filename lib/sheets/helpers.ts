// lib/sheets/helpers.ts
// Funciones genéricas para leer/escribir en Google Sheets con retry y error handling

import { getSheets } from "./client";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

// Safety net: si estamos en DEMO_MODE *sin* credenciales reales de Sheets,
// devolvemos datos vacíos para no crashear. Pero si GOOGLE_SHEETS_ID existe
// (tiene credenciales reales), dejamos que lea del Sheet aunque DEMO_MODE=true.
// Esto permite que cupones, pedidos, y otros datos admin funcionen en producción
// mientras la tienda sigue mostrando productos demo.
const isDemo = () =>
  process.env.DEMO_MODE === "true" && !process.env.GOOGLE_SHEETS_ID;

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
  if (isDemo()) return [];
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

/**
 * Escapa strings para evitar formula injection en Sheets.
 * Prefija con apostrofe si empieza con =, +, -, @, \t, \r (caracteres que
 * Sheets interpretaria como formula con valueInputOption USER_ENTERED).
 * Un usuario malicioso podria inyectar =HYPERLINK("javascript:...") o
 * =IMPORTXML(...) via campos de resena/pedido/suscripcion.
 */
export function escapeFormulaInjection(value: unknown): unknown {
  if (typeof value !== "string") return value;
  if (value.length === 0) return value;
  const firstChar = value[0];
  if (
    firstChar === "=" ||
    firstChar === "+" ||
    firstChar === "-" ||
    firstChar === "@" ||
    firstChar === "\t" ||
    firstChar === "\r"
  ) {
    return `'${value}`;
  }
  return value;
}

export async function appendRow(
  spreadsheetId: string,
  range: string,
  values: (string | number | boolean)[]
): Promise<void> {
  if (isDemo()) return;
  return withRetry(async () => {
    const sheets = getSheets();
    const safeValues = values.map(escapeFormulaInjection);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [safeValues] },
    });
  }, `appendRow(${range})`);
}

export async function updateCell(
  spreadsheetId: string,
  range: string,
  value: string | number
): Promise<void> {
  if (isDemo()) return;
  return withRetry(async () => {
    const sheets = getSheets();
    const safeValue = escapeFormulaInjection(value);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[safeValue]] },
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

const AR_OFFSET_HOURS = -3;

/**
 * Devuelve el inicio del día en zona horaria de Argentina (UTC-3).
 * Vercel corre en UTC; sin este ajuste las métricas "hoy" estarían
 * desfasadas 3 horas.
 */
export function startOfDayArgentina(date: Date): Date {
  const arTime = new Date(date.getTime() + AR_OFFSET_HOURS * 60 * 60 * 1000);
  arTime.setUTCHours(0, 0, 0, 0);
  return new Date(arTime.getTime() - AR_OFFSET_HOURS * 60 * 60 * 1000);
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
