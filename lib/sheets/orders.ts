// lib/sheets/orders.ts
// Funciones para crear y consultar pedidos en Google Sheets (sheet privada)
//
// Layout real de columnas en la hoja "Pedidos" (heredado del monolito):
// 0: id, 1: fecha, 2: email, 3: telefono, 4: nombre_completo,
// 5: direccion_completa, 6: items_resumen, 7: subtotal, 8: envio,
// 9: total, 10: metodo_pago, 11: estado, 12: mercadopago_id

import { getRows, findRow, appendRow, findRowIndex, updateCell, colLetter } from "./helpers";
import { getPrivateSheetId } from "./client";
import { RANGES, COL } from "./constants";
import type { Order, OrderStatus } from "@/types";

// Mapea una fila cruda de la hoja Pedidos al tipo Order del dominio.
// Nota: items se devuelve vacío porque la hoja solo guarda un resumen textual
// (items_resumen). Quien necesite los items reales debe persistirlos aparte.
function mapRowToOrder(row: string[]): Order {
  const nombreCompleto = row[COL.PEDIDO.NOMBRE_COMPLETO] || "";
  const [nombre, ...restoApellido] = nombreCompleto.split(" ");
  const direccionCompleta = row[COL.PEDIDO.DIRECCION_COMPLETA] || "";
  const [direccion = "", ciudad = "", codigo_postal = ""] = direccionCompleta
    .split(",")
    .map((s) => s.trim());
  return {
    id: row[COL.PEDIDO.ID] || "",
    fecha: row[COL.PEDIDO.FECHA] || "",
    email: row[COL.PEDIDO.EMAIL] || "",
    telefono: row[COL.PEDIDO.TELEFONO] || "",
    nombre: nombre || "",
    apellido: restoApellido.join(" "),
    direccion,
    ciudad,
    codigo_postal,
    items: [],
    subtotal: Number(row[COL.PEDIDO.SUBTOTAL]) || 0,
    envio: Number(row[COL.PEDIDO.ENVIO]) || 0,
    total: Number(row[COL.PEDIDO.TOTAL]) || 0,
    metodo_pago: (row[COL.PEDIDO.METODO_PAGO] || "mercadopago") as Order["metodo_pago"],
    estado: (row[COL.PEDIDO.ESTADO] || "pendiente_pago") as OrderStatus,
    mercadopago_id: row[COL.PEDIDO.MERCADOPAGO_ID] || "",
  };
}

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
  estado: OrderStatus;
} | null> {
  const row = await findRow(getPrivateSheetId(), RANGES.PEDIDOS, COL.PEDIDO.ID, orderId);
  if (!row) return null;
  return {
    id: row[COL.PEDIDO.ID],
    fecha: row[COL.PEDIDO.FECHA],
    email: row[COL.PEDIDO.EMAIL],
    telefono: row[COL.PEDIDO.TELEFONO],
    nombre: row[COL.PEDIDO.NOMBRE_COMPLETO],
    direccion: row[COL.PEDIDO.DIRECCION_COMPLETA],
    items: row[COL.PEDIDO.ITEMS_RESUMEN],
    subtotal: Number(row[COL.PEDIDO.SUBTOTAL]) || 0,
    envio: Number(row[COL.PEDIDO.ENVIO]) || 0,
    total: Number(row[COL.PEDIDO.TOTAL]) || 0,
    metodo_pago: row[COL.PEDIDO.METODO_PAGO] || "",
    estado: (row[COL.PEDIDO.ESTADO] || "pendiente_pago") as OrderStatus,
  };
}

// Devuelve todos los pedidos de un email dado (para el asistente virtual)
export async function getOrdersByEmail(email: string): Promise<{
  fecha: string;
  items: string;
  total: number;
  estado: OrderStatus;
}[]> {
  const rows = await getRows(getPrivateSheetId(), RANGES.PEDIDOS);
  return rows
    .filter((r) => r[COL.PEDIDO.EMAIL] === email)
    .map((r) => ({
      fecha: r[COL.PEDIDO.FECHA] || "",
      items: r[COL.PEDIDO.ITEMS_RESUMEN] || "",
      total: Number(r[COL.PEDIDO.TOTAL]) || 0,
      estado: (r[COL.PEDIDO.ESTADO] || "pendiente_pago") as OrderStatus,
    }));
}

/**
 * Retorna TODOS los pedidos. Usado por el dashboard y Kira para análisis.
 * NOTA: para tiendas con miles de pedidos esto puede ser lento.
 * En ese caso, usar ISR de 5 min en el endpoint que lo consume.
 */
export async function getOrdersAll(): Promise<Order[]> {
  const rows = await getRows(getPrivateSheetId(), RANGES.PEDIDOS);
  return rows.map(mapRowToOrder);
}

/**
 * Estado del ciclo de vida del pedido — transiciones permitidas según spec sección 4.1.
 * Las transiciones prohibidas devuelven error; usar skipValidation solo en casos muy
 * justificados (webhook con datos de terceros, migraciones).
 */
export const VALID_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  creado: ["pendiente_pago", "cancelado"],
  pendiente_pago: ["pagado", "cancelado"],
  pagado: ["preparando", "reembolsado", "cancelado"],
  preparando: ["enviado", "cancelado"],
  enviado: ["entregado", "reembolsado"],
  entregado: ["reembolsado"],
  cancelado: [],
  reembolsado: [],
} as const;

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// Actualiza el estado de un pedido (ej: "pendiente_pago" → "pagado")
// Valida que la transición sea legal según VALID_TRANSITIONS.
// Usar skipValidation=true solo en casos excepcionales (webhooks con datos de terceros, migraciones).
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  skipValidation = false
): Promise<void> {
  if (!skipValidation) {
    const order = await getOrderById(orderId);
    if (!order) throw new Error(`Pedido ${orderId} no encontrado`);

    const currentStatus = order.estado;
    if (currentStatus && !canTransition(currentStatus, newStatus)) {
      throw new Error(
        `Transición inválida: ${currentStatus} → ${newStatus}. ` +
          `Estados permitidos desde "${currentStatus}": ${
            VALID_TRANSITIONS[currentStatus]?.join(", ") || "ninguno"
          }`
      );
    }
  }

  const rowIndex = await findRowIndex(
    getPrivateSheetId(),
    RANGES.PEDIDOS,
    COL.PEDIDO.ID,
    orderId
  );
  if (rowIndex === -1) throw new Error(`Pedido ${orderId} no encontrado`);
  await updateCell(
    getPrivateSheetId(),
    `Pedidos!${colLetter(COL.PEDIDO.ESTADO)}${rowIndex}`,
    newStatus
  );
}
