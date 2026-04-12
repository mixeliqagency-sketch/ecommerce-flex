import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateSubscriberStatus } from "@/lib/sheets/subscribers";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);
    await updateSubscriberStatus(email, "inactivo");
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    console.error("[api/email/unsubscribe]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

// GET soporta links directos desde emails: /api/email/unsubscribe?email=xxx
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
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
