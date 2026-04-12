import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, PaymentRefund } from "mercadopago";
import { getAuthSession } from "@/lib/auth";
import { getOrderById, updateOrderStatus } from "@/lib/sheets/orders";

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
});

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { orderId } = params;

  try {
    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    if (order.estado === "reembolsado") {
      return NextResponse.json({ error: "El pedido ya fue reembolsado" }, { status: 409 });
    }

    // Solo MercadoPago tiene refund API. Transferencia/crypto se marcan como reembolsado manualmente.
    if (order.metodo_pago !== "mercadopago" || !order.mercadopago_id) {
      await updateOrderStatus(orderId, "reembolsado");
      return NextResponse.json({
        success: true,
        manual: true,
        message: "Estado actualizado. El reembolso debe procesarse manualmente.",
      });
    }

    // Llamar a la Refund API de MercadoPago
    const refundClient = new PaymentRefund(mpClient);
    await refundClient.create({
      payment_id: Number(order.mercadopago_id),
    });

    await updateOrderStatus(orderId, "reembolsado");

    return NextResponse.json({ success: true, manual: false });
  } catch (error) {
    console.error("[refund]", orderId, error);
    const message = error instanceof Error ? error.message : "Error al procesar reembolso";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
