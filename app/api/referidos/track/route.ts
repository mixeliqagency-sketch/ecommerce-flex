import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { incrementClicks, getReferralByCode } from "@/lib/sheets/referrals";

const schema = z.object({
  codigo: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { codigo } = schema.parse(body);

    const ref = await getReferralByCode(codigo);
    if (!ref || !ref.activo) {
      return NextResponse.json({ valid: false }, { status: 200 });
    }

    await incrementClicks(codigo);
    return NextResponse.json({ valid: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Codigo invalido" }, { status: 400 });
    }
    console.error("[api/referidos/track]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
