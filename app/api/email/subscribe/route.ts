import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addSubscriber } from "@/lib/sheets/subscribers";
import { enqueue } from "@/lib/sheets/queue";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email().max(200),
  source: z.string().max(50).optional(), // "popup", "footer", etc.
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit — 10 subs por minuto por IP (anti-spam)
    const rateCheck = checkRateLimit(req, "email-subscribe", {
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Muchas solicitudes" }, { status: 429 });
    }
    const body = await req.json();
    const { email, source } = schema.parse(body);

    // Suscribir (idempotente) y encolar welcome solo si es nuevo
    try {
      const { subscriber, wasCreated } = await addSubscriber(
        email,
        source ?? "unknown"
      );

      if (wasCreated) {
        await enqueue("welcome_series_start", {
          email: subscriber.email,
          subscriberId: subscriber.id,
          source,
        });
      }
    } catch (err) {
      console.error("[api/email/subscribe] Error al suscribir:", err);
      // Fallback: el error ya se logueó arriba con console.error
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
