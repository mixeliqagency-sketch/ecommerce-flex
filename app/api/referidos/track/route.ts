import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { incrementClicks, getReferralByCode } from "@/lib/sheets/referrals";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  codigo: z.string().min(1).max(50),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit — 20 por minuto por IP
    const rateCheck = checkRateLimit(req, "referidos-track", {
      maxRequests: 20,
      windowMs: 60_000,
    });
    if (!rateCheck.allowed) {
      return NextResponse.json({ valid: false }, { status: 429 });
    }
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
