// API de blog post individual — GET público + PUT admin
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthSession } from "@/lib/auth";
import { getBlogPostBySlug, updateBlogPost } from "@/lib/sheets/blog";

const updateSchema = z.object({
  titulo: z.string().optional(),
  descripcion: z.string().max(160).optional(),
  contenido: z.string().optional(),
  categoria: z.string().optional(),
  autor: z.string().optional(),
  fecha: z.string().optional(),
  imagen_url: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  publicado: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const post = await getBlogPostBySlug(params.slug);
    if (!post) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // Solo admin puede ver drafts — usuarios normales reciben 404 para no
    // filtrar la existencia del borrador.
    if (!post.publicado) {
      const session = await getAuthSession();
      if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      }
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("[api/blog GET slug]", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    await updateBlogPost(params.slug, data);
    // Invalidar ISR del listado y la pagina del post
    revalidatePath("/blog");
    revalidatePath(`/blog/${params.slug}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", issues: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes("no encontrado")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("[api/blog PUT]", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
