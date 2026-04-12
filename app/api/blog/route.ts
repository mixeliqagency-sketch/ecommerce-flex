// API de blog — GET público (lista) + POST admin (crear)
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { getPublishedBlogPosts, createBlogPost } from "@/lib/sheets/blog";

const createSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  titulo: z.string().min(1),
  descripcion: z.string().min(1).max(160),
  contenido: z.string().min(1),
  categoria: z.string().min(1),
  autor: z.string().min(1),
  fecha: z.string(),
  imagen_url: z.string().optional(),
  keywords: z.array(z.string()),
  publicado: z.boolean(),
});

// GET público — lista posts publicados
export async function GET() {
  try {
    const posts = await getPublishedBlogPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("[api/blog GET]", error);
    return NextResponse.json({ error: "Error al obtener posts" }, { status: 500 });
  }
}

// POST admin — crear post
export async function POST(req: NextRequest) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    await createBlogPost(data);
    return NextResponse.json({ success: true, slug: data.slug });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", issues: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes("ya existe")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("[api/blog POST]", error);
    return NextResponse.json({ error: "Error al crear post" }, { status: 500 });
  }
}
