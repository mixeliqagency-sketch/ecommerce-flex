import { NextResponse } from "next/server";
import { createOrder, getProducts } from "@/lib/google-sheets";
import { isValidEmail, generateOrderId } from "@/lib/validation";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { CartItem } from "@/types";

// Porcentaje de descuento para transferencia bancaria (lo lee del env, default 10%)
const DESCUENTO_TRANSFERENCIA = Number(process.env.NEXT_PUBLIC_TRANSFER_DISCOUNT ?? 10) / 100;
const FREE_SHIPPING_THRESHOLD = 50000;

interface TransferenciaBody {
  items: CartItem[];
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
}

export async function POST(request: Request) {
  try {
    // Rate limiting — maximo 30 requests por minuto por IP
    const rateCheck = checkRateLimit(request, "checkout-transferencia", RATE_LIMITS.general);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });
    }

    const body: TransferenciaBody = await request.json();
    const { items, nombre, apellido, email, telefono, direccion, ciudad, codigo_postal } = body;

    // Validaciones basicas
    if (!items?.length) {
      return NextResponse.json({ error: "Carrito vacio" }, { status: 400 });
    }
    if (!email || !nombre || !apellido) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Validar formato de email
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email invalido" }, { status: 400 });
    }

    // Validar largo razonable de campos de texto (previene payloads abusivos)
    if (nombre.length > 200 || apellido.length > 200 || email.length > 254) {
      return NextResponse.json({ error: "Datos demasiado largos" }, { status: 400 });
    }

    // Validar precios contra la base de datos (nunca confiar en el cliente)
    const dbProducts = await getProducts();
    for (const item of items) {
      const dbProduct = dbProducts.find((p: any) => p.slug === item.product.slug);
      if (!dbProduct) {
        return NextResponse.json({ error: `Producto no encontrado: ${item.product.nombre}` }, { status: 400 });
      }
      // Usar precio real de base de datos
      item.product.precio = dbProduct.precio;
    }

    // Calcular totales con descuento de transferencia
    const subtotalOriginal = items.reduce(
      (sum, i) => sum + i.product.precio * i.cantidad,
      0
    );
    const envioGratis = subtotalOriginal >= FREE_SHIPPING_THRESHOLD;
    const envio = envioGratis ? 0 : 5000;

    // El descuento se aplica solo al subtotal (no al envio)
    const descuentoMonto = Math.round(subtotalOriginal * DESCUENTO_TRANSFERENCIA);
    const subtotalConDescuento = subtotalOriginal - descuentoMonto;
    const totalConDescuento = subtotalConDescuento + envio;

    // Generar ID de orden (criptograficamente seguro)
    const orderId = generateOrderId();

    // Guardar orden en Google Sheets como "pendiente_transferencia"
    await createOrder({
      id: orderId,
      email,
      telefono,
      nombre,
      apellido,
      direccion,
      ciudad,
      codigo_postal,
      items,
      subtotal: subtotalConDescuento,
      envio,
      total: totalConDescuento,
      metodo_pago: "transferencia",
      estado: "pendiente",
      fecha: new Date().toISOString(),
    });

    // Responder con los datos necesarios para mostrar la pantalla de confirmacion
    return NextResponse.json({
      order_id: orderId,
      total_original: subtotalOriginal + envio,
      descuento_monto: descuentoMonto,
      total_con_descuento: totalConDescuento,
      subtotal_con_descuento: subtotalConDescuento,
      envio,
    });
  } catch (error) {
    console.error("Error registrando pedido por transferencia:", error);
    return NextResponse.json(
      { error: "Error al registrar el pedido. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
