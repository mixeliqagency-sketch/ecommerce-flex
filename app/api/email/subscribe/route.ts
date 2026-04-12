import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { appendRow } from "@/lib/sheets/helpers";
import { getPrivateSheetId } from "@/lib/sheets/client";

const schema = z.object({
  email: z.string().email(),
  source: z.string().optional(), // "popup", "footer", etc.
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, source } = schema.parse(body);

    // Append a tab "Suscriptores" — si no existe, falla silencioso pero logueamos
    try {
      await appendRow(getPrivateSheetId(), "Suscriptores!A2:D", [
        crypto.randomUUID(),
        email,
        new Date().toISOString(),
        source ?? "unknown",
      ]);
    } catch (err) {
      console.error(
        "[api/email/subscribe] Error al guardar (probablemente tab 'Suscriptores' no existe):",
        err
      );
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
