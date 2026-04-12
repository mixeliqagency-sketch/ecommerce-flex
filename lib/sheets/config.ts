// lib/sheets/config.ts
// Configuración de módulos: toggles on/off persistidos en Google Sheets (tab "Config")
// Cache de 5 minutos para reducir llamadas a Sheets API

import { getRows, appendRow, updateCell, colLetter, parseSheetBool, serializeSheetBool } from "./helpers";
import { getPublicSheetId } from "./client";
import { RANGES, COL } from "./constants";
import type { ModuleConfig } from "@/types";

// Defaults — se usan para inicializar el tab "Config" la primera vez
// y como fallback si Sheets falla
export const DEFAULT_CONFIG: ModuleConfig = {
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

// Cache en módulo (reduce llamadas a Sheets dentro de la misma instancia serverless).
// NOTA: No persiste entre cold starts ni entre instancias diferentes. Para cache
// persistente usar ISR de Next.js (revalidate en los endpoints que consumen esto).
let cachedConfig: ModuleConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Parsea un valor string de Sheets al tipo apropiado.
 * Booleanos -> parseSheetBool, números -> Number, strings -> as-is.
 */
function parseValue(raw: string): unknown {
  const normalized = raw.trim().toLowerCase();
  if (["true", "false", "1", "0", "si", "sí", "no", "yes"].includes(normalized)) {
    return parseSheetBool(raw);
  }
  const num = Number(raw);
  if (!isNaN(num) && raw.trim() !== "") return num;
  return raw;
}

/**
 * Lee toda la configuración de módulos desde Sheets.
 * Usa cache en memoria de 5 min. Si Sheets falla, devuelve DEFAULT_CONFIG.
 */
export async function getConfig(): Promise<ModuleConfig> {
  // Cache hit
  if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedConfig;
  }

  try {
    const rows = await getRows(getPublicSheetId(), RANGES.CONFIG);

    // Si el tab está vacío, devolver defaults
    if (rows.length === 0) {
      cachedConfig = DEFAULT_CONFIG;
      cacheTimestamp = Date.now();
      return DEFAULT_CONFIG;
    }

    // Deep clone de los defaults para no mutar el original
    const config = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as ModuleConfig;

    // Reconstruir objeto desde filas planas (modulo, propiedad, valor)
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
 * Invalida el cache automáticamente.
 */
export async function updateConfigProperty(
  modulo: string,
  propiedad: string,
  valor: string | number | boolean
): Promise<void> {
  // Invalidar cache antes de escribir
  invalidateConfigCache();

  const rows = await getRows(getPublicSheetId(), RANGES.CONFIG);
  const existingIndex = rows.findIndex(
    (row) => row[COL.CONFIG.MODULO] === modulo && row[COL.CONFIG.PROPIEDAD] === propiedad
  );

  // Serializar el valor para Sheets
  const valorStr = typeof valor === "boolean" ? serializeSheetBool(valor) : String(valor);

  if (existingIndex !== -1) {
    // Update existing — fila 1-based + header row
    const rowNum = existingIndex + 2;
    await updateCell(
      getPublicSheetId(),
      `Config!${colLetter(COL.CONFIG.VALOR)}${rowNum}`,
      valorStr
    );
  } else {
    // Append new row
    await appendRow(getPublicSheetId(), RANGES.CONFIG, [modulo, propiedad, valorStr]);
  }
}

/**
 * Invalida el cache en memoria. Útil después de cambios manuales en la Sheet
 * o desde tests.
 */
export function invalidateConfigCache(): void {
  cachedConfig = null;
  cacheTimestamp = 0;
}
