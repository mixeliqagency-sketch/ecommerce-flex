// lib/sheets/push.ts
// CRUD de suscripciones Web Push (tab PushSubs en sheet privada)

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
import type { PushSubscriptionRecord } from "@/types";

function mapRowToPushSub(row: string[]): PushSubscriptionRecord {
  const c = COL.PUSH_SUB;
  return {
    id: row[c.ID] ?? "",
    email: row[c.EMAIL] || null,
    endpoint: row[c.ENDPOINT] ?? "",
    p256dh: row[c.P256DH] ?? "",
    auth: row[c.AUTH] ?? "",
    user_agent: row[c.USER_AGENT] ?? "",
    fecha_suscripcion: row[c.FECHA] ?? "",
    estado: (row[c.ESTADO] ?? "activo") as PushSubscriptionRecord["estado"],
  };
}

export async function getAllPushSubs(): Promise<PushSubscriptionRecord[]> {
  const rows = await getRows(getPrivateSheetId(), RANGES.PUSH_SUBS);
  return rows.map(mapRowToPushSub).filter((p) => p.endpoint);
}

export async function getActivePushSubs(): Promise<PushSubscriptionRecord[]> {
  const all = await getAllPushSubs();
  return all.filter((p) => p.estado === "activo");
}

/**
 * Guarda una suscripcion push. Idempotente por endpoint.
 * Si el endpoint ya existe pero inactivo, lo reactiva.
 */
export async function saveSubscription(params: {
  email: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string;
}): Promise<PushSubscriptionRecord> {
  const existing = await findRow(
    getPrivateSheetId(),
    RANGES.PUSH_SUBS,
    COL.PUSH_SUB.ENDPOINT,
    params.endpoint
  );
  if (existing) {
    const sub = mapRowToPushSub(existing);
    if (sub.estado !== "activo") {
      await updateSubscriptionStatus(params.endpoint, "activo");
      return { ...sub, estado: "activo" };
    }
    return sub;
  }

  const sub: PushSubscriptionRecord = {
    id: crypto.randomUUID(),
    email: params.email,
    endpoint: params.endpoint,
    p256dh: params.p256dh,
    auth: params.auth,
    user_agent: params.user_agent,
    fecha_suscripcion: new Date().toISOString(),
    estado: "activo",
  };

  await appendRow(getPrivateSheetId(), RANGES.PUSH_SUBS, [
    sub.id,
    sub.email ?? "",
    sub.endpoint,
    sub.p256dh,
    sub.auth,
    sub.user_agent,
    sub.fecha_suscripcion,
    sub.estado,
  ]);

  return sub;
}

export async function updateSubscriptionStatus(
  endpoint: string,
  estado: PushSubscriptionRecord["estado"]
): Promise<void> {
  const rowIndex = await findRowIndex(
    getPrivateSheetId(),
    RANGES.PUSH_SUBS,
    COL.PUSH_SUB.ENDPOINT,
    endpoint
  );
  if (rowIndex === -1) return;
  await updateCell(
    getPrivateSheetId(),
    `PushSubs!${colLetter(COL.PUSH_SUB.ESTADO)}${rowIndex}`,
    estado
  );
}
