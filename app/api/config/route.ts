// API de config — GET público (lee toggles), PUT admin (actualiza)
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { getConfig, updateConfigProperty } from "@/lib/sheets/config";

const updateSchema = z.object({
  modulo: z.string().min(1),
  propiedad: z.string().min(1),
  valor: z.union([z.string(), z.number(), z.boolean()]),
});

// GET — público: lee config de módulos (para que la tienda sepa qué mostrar)
//
// IMPORTANTE: Este endpoint expone TODO el objeto ModuleConfig sin filtrar.
// NUNCA agregar campos sensibles (API keys, secrets, webhooks privados) al
// config. Si se necesita config sensible, crear un endpoint separado
// /api/config/admin con auth check.
export async function GET() {
  try {
    const config = await getConfig();
    return NextResponse.json(config, {
      headers: {
        // s-maxage bajo para minimizar drift cuando admin actualiza config
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("[api/config GET]", error);
    return NextResponse.json({ error: "Error al leer config" }, { status: 500 });
  }
}

// PUT — admin: actualiza una propiedad
export async function PUT(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { modulo, propiedad, valor } = updateSchema.parse(body);
    await updateConfigProperty(modulo, propiedad, valor);
    // Invalidar cache CDN para que los clientes reciban la nueva config
    try {
      revalidatePath("/api/config");
      revalidatePath("/");
    } catch (e) {
      console.warn("[api/config PUT] revalidatePath fallo:", e);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    console.error("[api/config PUT]", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
