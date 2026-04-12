// lib/sheets/orders.ts
// Funciones para crear y consultar pedidos en Google Sheets (sheet privada)
//
// Layout de columnas en la hoja "Pedidos" — 17 columnas (A..Q):
// 0: id, 1: fecha, 2: email, 3: telefono, 4: nombre, 5: apellido,
// 6: direccion, 7: ciudad, 8: codigo_postal, 9: items_json,
// 10: subtotal, 11: envio, 12: total, 13: metodo_pago, 14: estado,
// 15: mercadopago_id, 16: referral_code
//
// BREAKING CHANGE vs layout legacy (13 cols, nombre/direccion concatenadas):
// filas viejas quedaran con ciudad/codigo_postal/apellido vacios tras migrar;
// el admin debe re-ingresar esos campos manualmente desde la Sheet.

import { getRows, findRow, appendRow, findRowIndex, updateCell, colLetter } from "./helpers";
import { getPrivateSheetId } from "./client";
import { RANGES, COL } from "./constants";
import type { Order, OrderStatus, CartItem } from "@/types";

// NOTA: getOrderById y getOrdersByEmail delegan en mapRowToOrder para
// devolver el tipo Order completo con items parseados como CartItem[].

// Parsea el campo items_json de la hoja. Filas legacy con text summary
// no son parseables como JSON y devuelven array vacío.
function parseItems(raw: string | undefined): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Row legacy con text summary — no parseable, devolver vacío
    return [];
  }
}

// Mapea una fila cruda de la hoja Pedidos al tipo Order del dominio.
// Lee campos separados (sin split de CSV) — ver layout en header del archivo.
function mapRowToOrder(row: string[]): Order {
  return {
    id: row[COL.PEDIDO.ID] || "",
    fecha: row[COL.PEDIDO.FECHA] || "",
    email: row[COL.PEDIDO.EMAIL] || "",
    telefono: row[COL.PEDIDO.TELEFONO] || "",
    nombre: row[COL.PEDIDO.NOMBRE] || "",
    apellido: row[COL.PEDIDO.APELLIDO] || "",
    direccion: row[COL.PEDIDO.DIRECCION] || "",
    ciudad: row[COL.PEDIDO.CIUDAD] || "",
    codigo_postal: row[COL.PEDIDO.CODIGO_POSTAL] || "",
    items: parseItems(row[COL.PEDIDO.ITEMS_JSON]),
    subtotal: Number(row[COL.PEDIDO.SUBTOTAL]) || 0,
    envio: Number(row[COL.PEDIDO.ENVIO]) || 0,
    total: Number(row[COL.PEDIDO.TOTAL]) || 0,
    metodo_pago: (row[COL.PEDIDO.METODO_PAGO] || "mercadopago") as Order["metodo_pago"],
    estado: (row[COL.PEDIDO.ESTADO] || "pendiente_pago") as OrderStatus,
    mercadopago_id: row[COL.PEDIDO.MERCADOPAGO_ID] || "",
    referral_code: row[COL.PEDIDO.REFERRAL_CODE] || undefined,
  };
}

// Crea un nuevo pedido en la hoja Pedidos.
// IMPORTANTE: guarda cada campo en su propia columna. Nada de concatenar
// direccion/nombre con comas o espacios (eso rompia cuando el usuario
// ingresaba "Av. Rivadavia 1234, Dep 2B" o nombres compuestos).
// Filas legacy con datos concatenados quedaran con ciudad/codigo_postal/
// apellido vacios: el admin debe re-ingresarlos manualmente.
export async function createOrder(order: Order): Promise<void> {
  const row: (string | number | boolean)[] = new Array(17).fill("");
  row[COL.PEDIDO.ID] = order.id;
  row[COL.PEDIDO.FECHA] = order.fecha;
  row[COL.PEDIDO.EMAIL] = order.email.toLowerCase().trim();
  row[COL.PEDIDO.TELEFONO] = order.telefono;
  row[COL.PEDIDO.NOMBRE] = order.nombre;
  row[COL.PEDIDO.APELLIDO] = order.apellido;
  row[COL.PEDIDO.DIRECCION] = order.direccion;
  row[COL.PEDIDO.CIUDAD] = order.ciudad;
  row[COL.PEDIDO.CODIGO_POSTAL] = order.codigo_postal;
  row[COL.PEDIDO.ITEMS_JSON] = JSON.stringify(order.items);
  row[COL.PEDIDO.SUBTOTAL] = order.subtotal;
  row[COL.PEDIDO.ENVIO] = order.envio;
  row[COL.PEDIDO.TOTAL] = order.total;
  row[COL.PEDIDO.METODO_PAGO] = order.metodo_pago;
  row[COL.PEDIDO.ESTADO] = order.estado;
  row[COL.PEDIDO.MERCADOPAGO_ID] = order.mercadopago_id || "";
  row[COL.PEDIDO.REFERRAL_CODE] = order.referral_code || "";

  await appendRow(getPrivateSheetId(), RANGES.PEDIDOS, row);
}

// Busca un pedido por su ID único
export async function getOrderById(orderId: string): Promise<Order | null> {
  const row = await findRow(getPrivateSheetId(), RANGES.PEDIDOS, COL.PEDIDO.ID, orderId);
  return row ? mapRowToOrder(row) : null;
}

// Devuelve todos los pedidos de un email dado (case-insensitive)
export async function getOrdersByEmail(email: string): Promise<Order[]> {
  const emailLc = email.toLowerCase().trim();
  const rows = await getRows(getPrivateSheetId(), RANGES.PEDIDOS);
  return rows
    .filter((r) => (r[COL.PEDIDO.EMAIL] || "").toLowerCase().trim() === emailLc)
    .map(mapRowToOrder)
    .filter((o) => o.id);
}

/**
 * Retorna TODOS los pedidos. Usado por el dashboard y Kira para análisis.
 * NOTA: para tiendas con miles de pedidos esto puede ser lento.
 * En ese caso, usar ISR de 5 min en el endpoint que lo consume.
 */
export async function getOrdersAll(): Promise<Order[]> {
  const rows = await getRows(getPrivateSheetId(), RANGES.PEDIDOS);
  return rows.map(mapRowToOrder).filter((o) => o.id);
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
