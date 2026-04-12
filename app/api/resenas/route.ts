import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getReviewsByProduct,
  getReviewSummary,
  getAllReviewSummaries,
  getFeaturedReviews,
  createReview,
  isVerifiedBuyer,
} from "@/lib/sheets/reviews";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

// Schema estricto — largos maximos previenen payloads abusivos.
// El escape contra formula injection se aplica en la capa de datos (appendRow).
const createReviewSchema = z.object({
  product_slug: z.string().min(1).max(200),
  nombre: z.string().min(1).max(100),
  calificacion: z.union([z.number(), z.string()]),
  titulo: z.string().min(1).max(200),
  contenido: z.string().min(1).max(1000),
});

// GET /api/resenas?producto=slug — resenas de un producto
// GET /api/resenas?destacadas=true — resenas destacadas para home
// GET /api/resenas?resumenes=true — resumenes de todos los productos
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const producto = searchParams.get("producto");
  const destacadas = searchParams.get("destacadas");
  const resumenes = searchParams.get("resumenes");

  try {
    if (destacadas === "true") {
      const reviews = await getFeaturedReviews();
      return NextResponse.json(reviews);
    }

    if (resumenes === "true") {
      const summaries = await getAllReviewSummaries();
      return NextResponse.json(summaries);
    }

    if (!producto) {
      return NextResponse.json({ error: "Falta parametro producto" }, { status: 400 });
    }

    const [reviews, summary] = await Promise.all([
      getReviewsByProduct(producto),
      getReviewSummary(producto),
    ]);

    return NextResponse.json({ reviews, summary });
  } catch (err) {
    console.error("Error en GET /api/resenas:", err);
    return NextResponse.json({ error: "Error al obtener resenas" }, { status: 500 });
  }
}

// POST /api/resenas — crear nueva resena
export async function POST(req: NextRequest) {
  try {
    // Rate limiting estricto — maximo 5 resenas por minuto por IP (anti-spam)
    const rateCheck = checkRateLimit(req, "resenas", {
      maxRequests: 5,
      windowMs: 60_000,
    });
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Demasiados intentos." }, { status: 429 });
    }

    // Auth obligatoria para crear resenas
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: "Debes iniciar sesion para dejar una resena" }, { status: 401 });
    }

    // Usar el email de la sesion, no el del body (previene spoofing)
    const email = session.user!.email!;

    const rawBody = await req.json();
    const parsed = createReviewSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    }
    const { product_slug, nombre, titulo, contenido } = parsed.data;

    // Validar que calificacion sea un numero entero entre 1 y 5
    const calif = Number(parsed.data.calificacion);
    if (!Number.isInteger(calif) || calif < 1 || calif > 5) {
      return NextResponse.json({ error: "Calificacion debe ser un numero entero entre 1 y 5" }, { status: 400 });
    }

    // Verificar si compro el producto
    const verificado = await isVerifiedBuyer(email, product_slug);

    // Auto-aprobar si es comprador verificado, pendiente si no
    const aprobado = verificado ? "si" : "pendiente";

    await createReview({
      product_slug,
      nombre,
      email,
      calificacion: calif as 1 | 2 | 3 | 4 | 5,
      titulo,
      contenido,
      verificado,
      aprobado: aprobado as "si" | "no" | "pendiente",
      destacada: false,
    });

    return NextResponse.json({
      ok: true,
      verificado,
      aprobado,
      mensaje: verificado
        ? "Resena publicada! Gracias por tu opinion."
        : "Resena enviada! La vamos a revisar y publicar pronto.",
    });
  } catch (err) {
    console.error("Error en POST /api/resenas:", err);
    return NextResponse.json({ error: "Error al crear resena" }, { status: 500 });
  }
}
