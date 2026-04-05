import { NextRequest, NextResponse } from "next/server";
import {
  getReviewsByProduct,
  getReviewSummary,
  getAllReviewSummaries,
  getFeaturedReviews,
  createReview,
  isVerifiedBuyer,
} from "@/lib/google-sheets";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

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
    // Rate limiting — maximo 30 requests por minuto por IP
    const rateCheck = checkRateLimit(req, "resenas", RATE_LIMITS.general);
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

    const body = await req.json();
    const { product_slug, nombre, calificacion, titulo, contenido } = body;

    if (!product_slug || !nombre || !calificacion || !titulo || !contenido) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    // Validar que calificacion sea un numero entre 1 y 5
    const calif = Number(calificacion);
    if (!Number.isInteger(calif) || calif < 1 || calif > 5) {
      return NextResponse.json({ error: "Calificacion debe ser un numero entero entre 1 y 5" }, { status: 400 });
    }

    // Validar largo maximo del contenido (previene payloads abusivos)
    if (typeof contenido !== "string" || contenido.length > 1000) {
      return NextResponse.json({ error: "El contenido no puede superar los 1000 caracteres" }, { status: 400 });
    }

    // Validar largo del titulo
    if (typeof titulo !== "string" || titulo.length > 200) {
      return NextResponse.json({ error: "El titulo no puede superar los 200 caracteres" }, { status: 400 });
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
