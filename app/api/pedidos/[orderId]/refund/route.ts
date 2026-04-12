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

    // Solo MercadoPago tiene refund API automático.
    // Para transferencia/crypto, requerimos acción manual del admin.
    if (order.metodo_pago !== "mercadopago" || !order.mercadopago_id) {
      return NextResponse.json({
        success: false,
        requiresManualAction: true,
        message:
          "Este método de pago no soporta reembolso automático. " +
          "Reembolsá el monto manualmente y luego cambiá el estado a 'reembolsado' desde el panel.",
      }, { status: 200 });
    }

    // Validar que el payment_id sea un número válido antes de llamar a MP
    const paymentId = Number(order.mercadopago_id);
    if (!Number.isFinite(paymentId) || paymentId <= 0) {
      return NextResponse.json(
        { error: "ID de pago de MercadoPago inválido. Procesar reembolso manualmente desde el panel." },
        { status: 400 }
      );
    }

    // Llamar a la Refund API de MercadoPago
    const refundClient = new PaymentRefund(mpClient);
    await refundClient.create({ payment_id: paymentId });

    // Forzar transición a "reembolsado" aunque VALID_TRANSITIONS no la permita
    // desde el estado actual (p.ej. "preparando"). El refund en MP ya es irreversible;
    // el estado local debe reflejarlo para no dejar un pedido activo con plata devuelta.
    await updateOrderStatus(orderId, "reembolsado", true);

    return NextResponse.json({ success: true, manual: false });
  } catch (error) {
    // Log completo solo server-side, cliente recibe mensaje generico
    console.error("[refund]", orderId, error);
    return NextResponse.json(
      { error: "Error al procesar reembolso" },
      { status: 500 }
    );
  }
}
