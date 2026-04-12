// lib/sheets/carts.ts
// Tracking de carritos abandonados (tab "Carritos" en sheet privada)

import crypto from "crypto";
import { getRows, appendRow, findRowIndex, updateCell, colLetter } from "./helpers";
import { getPrivateSheetId } from "./client";
import { RANGES, COL } from "./constants";
import type { AbandonedCart, CartItem } from "@/types";

type CartStatus = AbandonedCart["estado"];

function mapRowToCart(row: string[]): AbandonedCart {
  const c = COL.CARRITO;
  let items: CartItem[] = [];
  try {
    const raw = row[c.ITEMS];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) items = parsed;
    }
  } catch {
    items = [];
  }
  return {
    id: row[c.ID] ?? "",
    email: row[c.EMAIL] || null,
    items,
    timestamp: row[c.TIMESTAMP] ?? "",
    estado: (row[c.ESTADO] ?? "abandonado") as CartStatus,
  };
}

/**
 * Guarda un carrito abandonado. Se llama desde el endpoint que detecta que
 * el usuario llegó al checkout y se fue sin completar.
 * @returns el ID del carrito persistido
 */
export async function saveAbandonedCart(
  email: string | null,
  items: CartItem[]
): Promise<string> {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  await appendRow(getPrivateSheetId(), RANGES.CARRITOS, [
    id,
    email ?? "",
    JSON.stringify(items),
    timestamp,
    "abandonado",
  ]);

  return id;
}

export async function getAbandonedCarts(): Promise<AbandonedCart[]> {
  const rows = await getRows(getPrivateSheetId(), RANGES.CARRITOS);
  return rows.map(mapRowToCart);
}

/**
 * Devuelve los carritos abandonados de hoy (para el widget del dashboard).
 */
export async function getAbandonedCartsToday(): Promise<AbandonedCart[]> {
  const all = await getAbandonedCarts();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return all.filter((c) => new Date(c.timestamp) >= hoy && c.estado === "abandonado");
}

async function updateCartStatus(cartId: string, status: CartStatus): Promise<void> {
  const rowIndex = await findRowIndex(getPrivateSheetId(), RANGES.CARRITOS, COL.CARRITO.ID, cartId);
  if (rowIndex === -1) return;
  await updateCell(
    getPrivateSheetId(),
    `Carritos!${colLetter(COL.CARRITO.ESTADO)}${rowIndex}`,
    status
  );
}

export function markCartAsRecovered(cartId: string): Promise<void> {
  return updateCartStatus(cartId, "recuperado");
}

export function markCartAsConverted(cartId: string): Promise<void> {
  return updateCartStatus(cartId, "convertido");
}
