import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateSubscriberStatus } from "@/lib/sheets/subscribers";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";
import { getAuthSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
});

// POST: body con email — SOLO admin (herramientas internas).
// Los usuarios finales deben desuscribirse via GET con token HMAC firmado.
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { email } = schema.parse(body);
    await updateSubscriberStatus(email, "inactivo");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    console.error("[api/email/unsubscribe POST]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// GET: requiere token firmado HMAC (desde link de emails)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/unsubscribe?error=1", req.url));
  }

  const email = verifyUnsubscribeToken(token);
  if (!email) {
    return NextResponse.redirect(new URL("/unsubscribe?error=1", req.url));
  }

  try {
    await updateSubscriberStatus(email, "inactivo");
    return NextResponse.redirect(
      new URL(`/unsubscribe?email=${encodeURIComponent(email)}`, req.url)
    );
  } catch (error) {
    console.error("[api/email/unsubscribe GET]", error);
    return NextResponse.redirect(new URL("/unsubscribe?error=1", req.url));
  }
}
