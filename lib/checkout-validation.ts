import { NextResponse } from "next/server";
import { z } from "zod";
import { getProducts } from "@/lib/sheets/products";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { CartItem } from "@/types";

// Schema estricto del body de checkout con Zod.
// Valida cantidad como entero >= 1 (previene el bug de cantidades negativas
// que generaban subtotales negativos = ordenes gratis).
export const CheckoutBodySchema = z.object({
  items: z
    .array(
      z.object({
        product: z
          .object({
            id: z.string().optional(),
            slug: z.string().min(1),
            nombre: z.string().min(1),
            precio: z.number().nonnegative(),
          })
          .passthrough(),
        cantidad: z.number().int().min(1).max(99),
        variante: z.string().optional(),
      })
    )
    .min(1)
    .max(50),
  email: z.string().email().max(200),
  nombre: z.string().min(1).max(100),
  apellido: z.string().min(1).max(100),
  telefono: z.string().min(5).max(30),
  direccion: z.string().min(3).max(300),
  ciudad: z.string().min(1).max(100),
  codigo_postal: z.string().min(1).max(20),
  coupon_code: z.string().max(50).optional(),
  referral_code: z.string().max(50).optional(),
});

// Tipo inferido del schema — compatible con CartItem para mantener retrocompatibilidad
export type CheckoutBody = z.infer<typeof CheckoutBodySchema> & {
  items: CartItem[];
};

// Resultado de la validacion — exito con body parseado o error con Response
type ValidationResult =
  | { ok: true; body: CheckoutBody }
  | { ok: false; error: Response };

/**
 * Validacion compartida para los endpoints de checkout (MercadoPago y transferencia).
 * Verifica: rate limit, schema Zod completo (incluye cantidad > 0),
 * precios contra la base de datos. La proteccion contra formula injection
 * se aplica en la capa de datos (appendRow -> escapeFormulaInjection).
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

  // Parsear body JSON — puede fallar si no es JSON valido
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return {
      ok: false,
      error: NextResponse.json({ error: "Body invalido" }, { status: 400 }),
    };
  }

  // Validar con Zod — rechaza cantidades <= 0, strings vacios, emails invalidos, etc.
  const parseResult = CheckoutBodySchema.safeParse(rawBody);
  if (!parseResult.success) {
    // No exponer detalles del schema a clientes (puede revelar estructura interna)
    return {
      ok: false,
      error: NextResponse.json({ error: "Datos invalidos" }, { status: 400 }),
    };
  }

  const body = parseResult.data as CheckoutBody;
  const { items } = body;

  // Validar precios contra la base de datos (nunca confiar en el cliente)
  const dbProducts = await getProducts();
  for (const item of items) {
    const dbProduct = dbProducts.find((p: { slug: string }) => p.slug === item.product.slug);
    if (!dbProduct) {
      return {
        ok: false,
        error: NextResponse.json(
          { error: `Producto no encontrado: ${item.product.nombre}` },
          { status: 400 }
        ),
      };
    }
    // Usar precio real de base de datos (el cliente nunca define el precio)
    item.product.precio = dbProduct.precio;
  }

  return { ok: true, body };
}
