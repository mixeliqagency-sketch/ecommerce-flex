// Validación pública de cupones (desde checkout)
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateCoupon } from "@/lib/sheets/coupons";
import { checkRateLimit } from "@/lib/rate-limit";

const validateSchema = z.object({
  codigo: z.string().min(1).max(50),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit — 20 validaciones por minuto (anti brute-force de codigos)
    const rateCheck = checkRateLimit(req, "cupones-validate", {
      maxRequests: 20,
      windowMs: 60_000,
    });
    if (!rateCheck.allowed) {
      return NextResponse.json({ valid: false, error: "Muchas solicitudes" }, { status: 429 });
    }
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
