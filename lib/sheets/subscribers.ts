// lib/sheets/subscribers.ts
// CRUD idempotente de suscriptores email (tab Suscriptores en sheet privada)

import crypto from "crypto";
import {
  getRows,
  findRow,
  appendRow,
  findRowIndex,
  updateCell,
  colLetter,
} from "./helpers";
import { getPrivateSheetId } from "./client";
import { RANGES, COL } from "./constants";
import type { Subscriber } from "@/types";

function mapRowToSubscriber(row: string[]): Subscriber {
  const c = COL.SUSCRIPTOR;
  return {
    id: row[c.ID] ?? "",
    email: row[c.EMAIL] ?? "",
    fecha: row[c.FECHA] ?? "",
    source: row[c.SOURCE] ?? "",
    estado: (row[c.ESTADO] ?? "activo") as Subscriber["estado"],
    ultima_actividad: row[c.ULTIMA_ACTIVIDAD] || undefined,
  };
}

export async function getAllSubscribers(): Promise<Subscriber[]> {
  const rows = await getRows(getPrivateSheetId(), RANGES.SUSCRIPTORES);
  return rows.map(mapRowToSubscriber).filter((s) => s.email);
}

export async function getSubscriberByEmail(
  email: string
): Promise<Subscriber | null> {
  const row = await findRow(
    getPrivateSheetId(),
    RANGES.SUSCRIPTORES,
    COL.SUSCRIPTOR.EMAIL,
    email
  );
  return row ? mapRowToSubscriber(row) : null;
}

/**
 * Crea un nuevo suscriptor. Idempotente:
 * - Si ya existe y está activo, devuelve el existente sin tocar nada.
 * - Si ya existe pero inactivo/rebote, lo reactiva.
 * - Si no existe, lo crea.
 *
 * NOTA: chequeo no atómico. Dos requests simultáneas con el mismo email
 * pueden crear duplicados. Aceptable para MVP (volumen bajo, doble-click
 * raro). Mitigar en frontend con debounce o disabled tras submit.
 */
export async function addSubscriber(
  email: string,
  source: string
): Promise<{ subscriber: Subscriber; wasCreated: boolean }> {
  const existing = await getSubscriberByEmail(email);
  if (existing) {
    if (existing.estado !== "activo") {
      await updateSubscriberStatus(email, "activo");
      return {
        subscriber: { ...existing, estado: "activo" },
        wasCreated: false,
      };
    }
    return { subscriber: existing, wasCreated: false };
  }

  const subscriber: Subscriber = {
    id: crypto.randomUUID(),
    email,
    fecha: new Date().toISOString(),
    source,
    estado: "activo",
  };

  await appendRow(getPrivateSheetId(), RANGES.SUSCRIPTORES, [
    subscriber.id,
    subscriber.email,
    subscriber.fecha,
    subscriber.source,
    subscriber.estado,
    "",
  ]);

  return { subscriber, wasCreated: true };
}

export async function updateSubscriberStatus(
  email: string,
  estado: Subscriber["estado"]
): Promise<void> {
  const rowIndex = await findRowIndex(
    getPrivateSheetId(),
    RANGES.SUSCRIPTORES,
    COL.SUSCRIPTOR.EMAIL,
    email
  );
  if (rowIndex === -1) {
    console.warn(`[subscribers] Suscriptor ${email} no encontrado`);
    return;
  }
  await updateCell(
    getPrivateSheetId(),
    `Suscriptores!${colLetter(COL.SUSCRIPTOR.ESTADO)}${rowIndex}`,
    estado
  );
}

export async function countActiveSubscribers(): Promise<number> {
  const all = await getAllSubscribers();
  return all.filter((s) => s.estado === "activo").length;
}

/**
 * Retorna suscriptores activos sin actividad hace N días.
 * Usado por el flujo n8n de sunset cleanup.
 */
export async function getInactiveSubscribers(
  daysInactive: number
): Promise<Subscriber[]> {
  const all = await getAllSubscribers();
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - daysInactive);
  return all.filter((s) => {
    if (s.estado !== "activo") return false;
    const lastActivity = s.ultima_actividad || s.fecha;
    return new Date(lastActivity) < threshold;
  });
}
