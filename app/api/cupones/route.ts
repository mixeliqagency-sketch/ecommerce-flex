// API de cupones — GET/POST (solo admin)
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { getCoupons, createCoupon } from "@/lib/sheets/coupons";

const createCouponSchema = z.object({
  codigo: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, "Solo mayúsculas, números, _ y -"),
  descuento_porcentaje: z.number().int().min(1).max(100),
  fecha_vencimiento: z.string(), // ISO date
  usos_maximos: z.number().int().min(0),
  activo: z.boolean(),
  descripcion: z.string().optional(),
});

// GET /api/cupones — listar cupones (solo admin)
export async function GET() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const coupons = await getCoupons();
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("[api/cupones GET]", error);
    return NextResponse.json({ error: "Error al obtener cupones" }, { status: 500 });
  }
}

// POST /api/cupones — crear cupón (solo admin)
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createCouponSchema.parse(body);
    await createCoupon(data);
    return NextResponse.json({ success: true, codigo: data.codigo });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("ya existe")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("[api/cupones POST]", error);
    return NextResponse.json({ error: "Error al crear cupón" }, { status: 500 });
  }
}
