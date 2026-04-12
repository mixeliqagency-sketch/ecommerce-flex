// lib/sheets/queue.ts
// Cola de eventos en Sheets — procesada por n8n cada hora.
// Pattern: la app escribe eventos acá, n8n los lee, procesa, y marca como "procesado".
// Resiliente a reinicios de n8n (la cola vive en Sheets, no en memoria).

import crypto from "crypto";
import {
  getRows,
  appendRow,
  findRowIndex,
  updateCell,
  colLetter,
} from "./helpers";
import { getPrivateSheetId } from "./client";
import { RANGES, COL } from "./constants";
import type { QueueEvent, QueueEventType } from "@/types";

const MAX_RETRIES = 3;

function mapRowToEvent(row: string[]): QueueEvent {
  const c = COL.COLA_EVENTO;
  let datos: Record<string, unknown> = {};
  try {
    const raw = row[c.DATOS];
    if (raw) datos = JSON.parse(raw);
  } catch {
    datos = {};
  }
  return {
    id: row[c.ID] ?? "",
    tipo: (row[c.TIPO] ?? "") as QueueEventType,
    datos,
    timestamp: row[c.TIMESTAMP] ?? "",
    estado: (row[c.ESTADO] ?? "pendiente") as QueueEvent["estado"],
    intentos: Number(row[c.INTENTOS]) || 0,
  };
}

/**
 * Encola un evento para procesamiento async por n8n.
 * @returns el ID del evento persistido
 */
export async function enqueue(
  tipo: QueueEventType,
  datos: Record<string, unknown>
): Promise<string> {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  await appendRow(getPrivateSheetId(), RANGES.COLA, [
    id,
    tipo,
    JSON.stringify(datos),
    timestamp,
    "pendiente",
    0,
  ]);

  return id;
}

/**
 * Lee eventos pendientes. Usado por n8n (o endpoints internos).
 */
export async function getPendingEvents(): Promise<QueueEvent[]> {
  const rows = await getRows(getPrivateSheetId(), RANGES.COLA);
  return rows.map(mapRowToEvent).filter((e) => e.estado === "pendiente");
}

/**
 * Marca un evento como procesado exitosamente.
 * Silent si el evento no se encuentra (evento pudo ser limpiado manualmente).
 */
export async function markEventProcessed(eventId: string): Promise<void> {
  const rowIndex = await findRowIndex(
    getPrivateSheetId(),
    RANGES.COLA,
    COL.COLA_EVENTO.ID,
    eventId
  );
  if (rowIndex === -1) {
    console.warn(`[queue] markEventProcessed: evento ${eventId} no encontrado`);
    return;
  }
  await updateCell(
    getPrivateSheetId(),
    `Cola!${colLetter(COL.COLA_EVENTO.ESTADO)}${rowIndex}`,
    "procesado"
  );
}

/**
 * Marca un evento como fallido e incrementa contador de intentos.
 * Si supera MAX_RETRIES, lo deja en "fallido" permanente (para alerta manual).
 * Si no, lo vuelve a "pendiente" para que n8n reintente en la próxima corrida.
 */
export async function markEventFailed(
  eventId: string,
  error?: string
): Promise<void> {
  const rowIndex = await findRowIndex(
    getPrivateSheetId(),
    RANGES.COLA,
    COL.COLA_EVENTO.ID,
    eventId
  );
  if (rowIndex === -1) {
    console.warn(`[queue] markEventFailed: evento ${eventId} no encontrado`);
    return;
  }

  // Leer el row actual para obtener intentos.
  // rowIndex = idx_array + 2 (número de fila en Sheets: data empieza en fila 2),
  // por lo tanto idx_array = rowIndex - 2
  const rows = await getRows(getPrivateSheetId(), RANGES.COLA);
  const currentRow = rows[rowIndex - 2];
  const intentos = Number(currentRow?.[COL.COLA_EVENTO.INTENTOS]) || 0;
  const newIntentos = intentos + 1;

  const nuevoEstado = newIntentos >= MAX_RETRIES ? "fallido" : "pendiente";

  await updateCell(
    getPrivateSheetId(),
    `Cola!${colLetter(COL.COLA_EVENTO.INTENTOS)}${rowIndex}`,
    newIntentos
  );
  await updateCell(
    getPrivateSheetId(),
    `Cola!${colLetter(COL.COLA_EVENTO.ESTADO)}${rowIndex}`,
    nuevoEstado
  );

  if (error) {
    console.error(
      `[queue] Evento ${eventId} fallido (intento ${newIntentos}/${MAX_RETRIES}):`,
      error
    );
  }
}
