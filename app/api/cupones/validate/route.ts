// Validación pública de cupones (desde checkout)
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateCoupon } from "@/lib/sheets/coupons";

const validateSchema = z.object({
  codigo: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { codigo } = validateSchema.parse(body);

    const coupon = await validateCoupon(codigo);
    if (!coupon) {
      return NextResponse.json(
        { valid: false, error: "Cupón inválido o expirado" },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      codigo: coupon.codigo,
      descuento_porcentaje: coupon.descuento_porcentaje,
      descripcion: coupon.descripcion,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ valid: false, error: "Código inválido" }, { status: 400 });
    }
    console.error("[api/cupones/validate]", error);
    return NextResponse.json({ valid: false, error: "Error al validar" }, { status: 500 });
  }
}
