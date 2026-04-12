import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveAbandonedCart } from "@/lib/sheets/carts";
import { enqueue } from "@/lib/sheets/queue";
import type { CartItem } from "@/types";

const schema = z.object({
  email: z.string().email().nullable().optional(),
  items: z.array(z.any()),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, items } = schema.parse(body);
    if (!items || items.length === 0) {
      return NextResponse.json({ saved: false }, { status: 200 });
    }
    const id = await saveAbandonedCart(email ?? null, items as CartItem[]);

    // Encolar 3 emails de recuperación con delays diferentes
    // n8n chequea scheduledFor y solo procesa los que ya vencieron
    if (email) {
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
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    console.error("[api/carritos/abandoned]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
