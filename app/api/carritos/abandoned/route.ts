import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveAbandonedCart } from "@/lib/sheets/carts";
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
    return NextResponse.json({ saved: true, id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    console.error("[api/carritos/abandoned]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
