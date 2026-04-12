import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { enqueue } from "@/lib/sheets/queue";

// Campos en ingles para alinear con el payload estandar Web Push
// que el Service Worker lee (payload.title, payload.body, payload.url).
const schema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(300),
  url: z.string().url().optional(),
  segmento: z.enum(["todos", "con_email", "sin_email"]).default("todos"),
});

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    await enqueue("push_notification_send", data);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos invalidos", issues: error.issues }, { status: 400 });
    }
    console.error("[api/push/send]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
