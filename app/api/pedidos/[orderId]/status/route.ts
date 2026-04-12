import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { updateOrderStatus } from "@/lib/sheets/orders";

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

    await updateOrderStatus(orderId, status);
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
