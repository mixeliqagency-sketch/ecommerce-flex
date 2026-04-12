import { NextResponse } from "next/server";
import { getProducts } from "@/lib/sheets/products";
import { isValidEmail } from "@/lib/validation";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { CartItem } from "@/types";

// Interfaz del body esperado en ambos endpoints de checkout
export interface CheckoutBody {
  items: CartItem[];
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
}

// Resultado de la validacion — exito con body parseado o error con Response
type ValidationResult =
  | { ok: true; body: CheckoutBody }
  | { ok: false; error: Response };

/**
 * Validacion compartida para los endpoints de checkout (MercadoPago y transferencia).
 * Verifica: rate limit, campos requeridos, formato de email, largos de campo
 * y precios contra la base de datos.
 *
 * @param request - Request HTTP entrante
 * @param rateLimitPrefix - Prefijo unico para el rate limiter (ej: "checkout", "checkout-transferencia")
 * @returns Body validado o Response de error listo para devolver
 */
export async function validateCheckout(
  request: Request,
  rateLimitPrefix: string
): Promise<ValidationResult> {
  // Rate limiting — maximo 30 requests por minuto por IP
  const rateCheck = checkRateLimit(request, rateLimitPrefix, RATE_LIMITS.general);
  if (!rateCheck.allowed) {
    return {
      ok: false,
      error: NextResponse.json(
        { error: "Demasiados intentos. Espera un momento." },
        { status: 429 }
      ),
    };
  }

  // Parsear body
  const body: CheckoutBody = await request.json();
  const { items, nombre, apellido, email } = body;

  // Validaciones basicas
  if (!items?.length) {
    return {
      ok: false,
      error: NextResponse.json({ error: "Carrito vacio" }, { status: 400 }),
    };
  }
  if (!email || !nombre || !apellido) {
    return {
      ok: false,
      error: NextResponse.json({ error: "Datos incompletos" }, { status: 400 }),
    };
  }

  // Validar formato de email
  if (!isValidEmail(email)) {
    return {
      ok: false,
      error: NextResponse.json({ error: "Email invalido" }, { status: 400 }),
    };
  }

  // Validar largo razonable de campos de texto (previene payloads abusivos)
  if (nombre.length > 200 || apellido.length > 200 || email.length > 254) {
    return {
      ok: false,
      error: NextResponse.json({ error: "Datos demasiado largos" }, { status: 400 }),
    };
  }

  // Validar precios contra la base de datos (nunca confiar en el cliente)
  const dbProducts = await getProducts();
  for (const item of items) {
    const dbProduct = dbProducts.find((p: any) => p.slug === item.product.slug);
    if (!dbProduct) {
      return {
        ok: false,
        error: NextResponse.json(
          { error: `Producto no encontrado: ${item.product.nombre}` },
          { status: 400 }
        ),
      };
    }
    // Usar precio real de base de datos
    item.product.precio = dbProduct.precio;
  }

  return { ok: true, body };
}
