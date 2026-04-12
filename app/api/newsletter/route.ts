// Encola una newsletter para ser procesada por n8n y enviada a los suscriptores.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { enqueue } from "@/lib/sheets/queue";

const schema = z.object({
  asunto: z.string().min(1).max(200),
  contenido: z.string().min(1).max(40000),
  segmento: z.enum(["todos", "compradores", "sin_compra"]).default("todos"),
});

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { asunto, contenido, segmento } = schema.parse(body);

    await enqueue("newsletter_send", { asunto, contenido, segmento });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("[api/newsletter]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
