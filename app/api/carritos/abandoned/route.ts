import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveAbandonedCart } from "@/lib/sheets/carts";
import { enqueue } from "@/lib/sheets/queue";
import { checkRateLimit } from "@/lib/rate-limit";
import type { CartItem } from "@/types";

// Schema estricto — evita que alguien use el endpoint como relay de spam
const cartItemSchema = z
  .object({
    product: z
      .object({
        slug: z.string().min(1).max(100),
        nombre: z.string().min(1).max(300),
        precio: z.number().nonnegative(),
      })
      .passthrough(),
    cantidad: z.number().int().min(1).max(99),
  })
  .passthrough();

const schema = z.object({
  email: z.string().email().max(200).nullable().optional(),
  items: z.array(cartItemSchema).max(50),
});

// Dedup en memoria: ultimo guardado por email (previene spam relay)
const lastSaveByEmail = new Map<string, number>();
const DEDUP_MS = 5 * 60 * 1000; // 5 minutos

export async function POST(req: NextRequest) {
  try {
    // Rate limit duro — 3 por minuto por IP (anti-spam relay)
    const rateCheck = checkRateLimit(req, "carritos-abandoned", {
      maxRequests: 3,
      windowMs: 60_000,
    });
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Muchas solicitudes" }, { status: 429 });
    }

    const rawBody = await req.json();
    const parsed = schema.safeParse(rawBody);
    if (!parsed.success) {
      // Public endpoint — no exponer detalles del schema
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }
    const { email, items } = parsed.data;

    if (!items || items.length === 0) {
      return NextResponse.json({ saved: false }, { status: 200 });
    }

    // Dedup: si el mismo email se guardo hace menos de 5 min, NO encolamos emails
    // (solo se guarda el carrito para metricas). Esto previene que alguien
    // use este endpoint para bombardear emails a una victima.
    let shouldSendEmails = !!email;
    if (email) {
      const key = email.toLowerCase();
      const last = lastSaveByEmail.get(key);
      const now = Date.now();
      if (last && now - last < DEDUP_MS) {
        shouldSendEmails = false;
      } else {
        lastSaveByEmail.set(key, now);
      }
      // Limpieza oportunista
      if (lastSaveByEmail.size > 1000) {
        lastSaveByEmail.forEach((t, k) => {
          if (now - t > DEDUP_MS) lastSaveByEmail.delete(k);
        });
      }
    }

    const id = await saveAbandonedCart(email ?? null, items as unknown as CartItem[]);

    // Encolar 3 emails de recuperacion SOLO si hay email Y no es dedup
    if (email && shouldSendEmails) {
      const now = Date.now();
      const events = [
        { tipo: "abandoned_cart_1h" as const, delayMs: 60 * 60 * 1000 },
        { tipo: "abandoned_cart_24h" as const, delayMs: 24 * 60 * 60 * 1000 },
        { tipo: "abandoned_cart_48h" as const, delayMs: 48 * 60 * 60 * 1000 },
      ];
      for (const { tipo, delayMs } of events) {
        try {
          await enqueue(tipo, {
            email,
            cartId: id,
            scheduledFor: new Date(now + delayMs).toISOString(),
          });
        } catch (err) {
          console.error(`[carritos/abandoned] Error encolando ${tipo}:`, err);
        }
      }
    }

    return NextResponse.json({ saved: true, id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }
    console.error("[api/carritos/abandoned]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
