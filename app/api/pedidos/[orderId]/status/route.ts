import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { getOrderById, updateOrderStatus } from "@/lib/sheets/orders";
import { registerConversion } from "@/lib/sheets/referrals";
import { enqueue } from "@/lib/sheets/queue";

const updateStatusSchema = z.object({
  status: z.enum([
    "creado",
    "pendiente_pago",
    "pagado",
    "preparando",
    "enviado",
    "entregado",
    "cancelado",
    "reembolsado",
  ]),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { orderId } = params;

  try {
    const body = await req.json();
    const { status } = updateStatusSchema.parse(body);

    // Leer el estado previo antes de actualizar — necesario para detectar
    // transiciones (ej. transferencia: pendiente_pago -> pagado).
    const prevOrder = await getOrderById(orderId);

    await updateOrderStatus(orderId, status);

    // Si la transicion es hacia "pagado" y la orden existe, encolar
    // confirmacion + registrar conversion de referido. Esto cubre metodos
    // sin webhook automatico (transferencia, crypto, etc).
    // MercadoPago dispara los mismos eventos desde el webhook — excluirlo
    // para evitar duplicar emails al cliente.
    const needsManualTrigger =
      prevOrder && prevOrder.metodo_pago !== "mercadopago";

    if (
      status === "pagado" &&
      prevOrder &&
      prevOrder.estado !== "pagado" &&
      needsManualTrigger
    ) {
      try {
        await enqueue("post_purchase_confirmation", {
          orderId,
          email: prevOrder.email,
        });
        await enqueue("post_purchase_tips", { orderId, email: prevOrder.email });
        await enqueue("post_purchase_review_request", { orderId, email: prevOrder.email });
        await enqueue("post_purchase_cross_sell", { orderId, email: prevOrder.email });
      } catch (err) {
        console.error("[pedidos/status] Error encolando post_purchase_*:", err);
      }

      if (prevOrder.referral_code) {
        try {
          await registerConversion(prevOrder.referral_code, prevOrder.total);
        } catch (err) {
          console.error("[pedidos/status] Error registrando conversion referral:", err);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("Transición inválida")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("no encontrado")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("[pedidos/status]", orderId, error);
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 });
  }
}
