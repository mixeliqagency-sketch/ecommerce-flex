import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { saveSubscription } from "@/lib/sheets/push";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, keys } = schema.parse(body);

    const session = await getAuthSession();
    const email = session?.user?.email ?? null;

    const userAgent = req.headers.get("user-agent") ?? "unknown";

    const sub = await saveSubscription({
      email,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: userAgent,
    });

    return NextResponse.json({ success: true, id: sub.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }
    console.error("[api/push/subscribe]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
