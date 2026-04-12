import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addSubscriber } from "@/lib/sheets/subscribers";
import { enqueue } from "@/lib/sheets/queue";

const schema = z.object({
  email: z.string().email(),
  source: z.string().optional(), // "popup", "footer", etc.
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, source } = schema.parse(body);

    // Suscribir (idempotente) y encolar welcome solo si es nuevo
    try {
      const subscriber = await addSubscriber(email, source ?? "unknown");

      // Detectar si es nuevo: fecha creada hace menos de 5 segundos = recien creado
      const isNew =
        Math.abs(Date.now() - new Date(subscriber.fecha).getTime()) < 5000;
      if (isNew) {
        await enqueue("welcome_series_start", {
          email: subscriber.email,
          subscriberId: subscriber.id,
          source,
        });
      }
    } catch (err) {
      console.error("[api/email/subscribe] Error al suscribir:", err);
      // Fallback: loguear para que Pablo vea el email
      console.log("[email-captured]", email, source);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    console.error("[api/email/subscribe]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
