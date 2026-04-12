import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { createSocialPost } from "@/lib/sheets/social-log";
import { enqueue } from "@/lib/sheets/queue";

const schema = z.object({
  platform: z.enum(["instagram", "twitter", "tiktok"]),
  contenido: z.string().min(1).max(2200),
  imagen_url: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const post = await createSocialPost(data);

    await enqueue("social_media_publish", {
      postId: post.id,
      platform: data.platform,
      contenido: data.contenido,
      imagen_url: data.imagen_url,
    });

    return NextResponse.json({ success: true, postId: post.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos invalidos", issues: error.issues }, { status: 400 });
    }
    console.error("[api/social/publish]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
