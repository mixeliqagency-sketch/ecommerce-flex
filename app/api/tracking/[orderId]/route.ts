import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/sheets/orders";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: "ID de pedido requerido" }, { status: 400 });
    }

    // Validar formato de orderId para evitar enumeracion e inyeccion
    const orderIdPattern = /^ORD-\d+-[A-Z0-9]+$/;
    if (!orderIdPattern.test(orderId)) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    // Serializar items al formato "nombre xN, nombre xN" que espera la pagina de tracking
    const itemsSummary = order.items
      .map((it) => `${it.product?.nombre ?? "Producto"} x${it.cantidad}`)
      .join(", ");

    // No exponer datos sensibles (email completo, telefono)
    return NextResponse.json({
      id: order.id,
      fecha: order.fecha,
      nombre: order.nombre, // mapRowToOrder ya devuelve solo el primer nombre
      direccion_ciudad: [order.ciudad, order.codigo_postal].filter(Boolean).join(", "),
      items: itemsSummary,
      total: order.total,
      estado: order.estado,
      metodo_pago: order.metodo_pago,
    });
  } catch (error) {
    console.error("Error fetching tracking:", error);
    return NextResponse.json(
      { error: "Error al obtener el tracking" },
      { status: 500 }
    );
  }
}
