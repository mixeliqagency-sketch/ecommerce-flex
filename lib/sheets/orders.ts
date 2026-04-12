// lib/sheets/orders.ts
// Funciones para crear y consultar pedidos en Google Sheets (sheet privada)
//
// Layout real de columnas en la hoja "Pedidos" (heredado del monolito):
// 0: id, 1: fecha, 2: email, 3: telefono, 4: nombre_completo,
// 5: direccion_completa, 6: items_resumen, 7: subtotal, 8: envio,
// 9: total, 10: metodo_pago, 11: estado, 12: mercadopago_id

import { getRows, findRow, appendRow, findRowIndex, updateCell } from "./helpers";
import { getPrivateSheetId } from "./client";
import { RANGES, COL } from "./constants";
import type { Order, OrderStatus } from "@/types";

// Crea un nuevo pedido en la hoja Pedidos
// Concatena nombre+apellido y formatea los items como texto resumido
export async function createOrder(order: Order): Promise<void> {
  const itemsSummary = order.items
    .map((i) => `${i.product.nombre} x${i.cantidad}`)
    .join(", ");

  await appendRow(getPrivateSheetId(), RANGES.PEDIDOS, [
    order.id,
    order.fecha,
    order.email,
    order.telefono,
    `${order.nombre} ${order.apellido}`,
    `${order.direccion}, ${order.ciudad}, ${order.codigo_postal}`,
    itemsSummary,
    order.subtotal,
    order.envio,
    order.total,
    order.metodo_pago,
    order.estado,
    order.mercadopago_id || "",
  ]);
}

// Busca un pedido por su ID único
export async function getOrderById(orderId: string): Promise<{
  id: string;
  fecha: string;
  email: string;
  telefono: string;
  nombre: string;
  direccion: string;
  items: string;
  subtotal: number;
  envio: number;
  total: number;
  metodo_pago: string;
  estado: string;
} | null> {
  // Columna 0 = ID del pedido (índice raw del layout real del monolito)
  const row = await findRow(getPrivateSheetId(), RANGES.PEDIDOS, COL.PEDIDO.ID, orderId);
  if (!row) return null;
  return {
    id: row[0],
    fecha: row[1],
    email: row[2],
    telefono: row[3],
    nombre: row[4],
    direccion: row[5],
    items: row[6],
    subtotal: Number(row[7]) || 0,
    envio: Number(row[8]) || 0,
    total: Number(row[9]) || 0,
    metodo_pago: row[10] || "",
    estado: (row[11] || "pendiente_pago") as OrderStatus,
  };
}

// Devuelve todos los pedidos de un email dado (para el asistente virtual)
export async function getOrdersByEmail(email: string): Promise<{
  fecha: string;
  items: string;
  total: number;
  estado: string;
}[]> {
  const rows = await getRows(getPrivateSheetId(), RANGES.PEDIDOS);
  // Columna 2 = email (índice raw del layout real del monolito)
  return rows
    .filter((r) => r[2] === email)
    .map((r) => ({
      fecha: r[1] || "",
      items: r[6] || "",
      total: Number(r[9]) || 0,
      estado: (r[11] || "pendiente_pago") as OrderStatus,
    }));
}

// Actualiza el estado de un pedido (ej: "pendiente_pago" → "pagado")
// Lanza error si el pedido no existe
export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  const rowIndex = await findRowIndex(
    getPrivateSheetId(),
    RANGES.PEDIDOS,
    COL.PEDIDO.ID,
    orderId
  );
  if (rowIndex === -1) throw new Error(`Pedido ${orderId} no encontrado`);
  // Columna L = índice 11 = estado. rowIndex ya incluye offset de header
  await updateCell(getPrivateSheetId(), `Pedidos!L${rowIndex}`, status);
}
