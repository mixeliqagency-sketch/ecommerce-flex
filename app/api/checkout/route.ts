import { NextResponse } from "next/server";
import { createPreference } from "@/lib/mercadopago";
import { createOrder, getProducts } from "@/lib/google-sheets";
import { isValidEmail, generateOrderId } from "@/lib/validation";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { CartItem } from "@/types";

interface CheckoutBody {
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
    const rateCheck = checkRateLimit(request, "checkout", RATE_LIMITS.general);
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Demasiados intentos. Espera un momento." }, { status: 429 });
    }

    const body: CheckoutBody = await request.json();
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

    // Validar precios contra la base de datos
    const dbProducts = await getProducts();
    for (const item of items) {
      const dbProduct = dbProducts.find((p: any) => p.slug === item.product.slug);
      if (!dbProduct) {
        return NextResponse.json({ error: `Producto no encontrado: ${item.product.nombre}` }, { status: 400 });
      }
      // Usar el precio real de la base de datos, no el del cliente
      item.product.precio = dbProduct.precio;
    }

    // Calcular totales
    const subtotal = items.reduce(
      (sum, i) => sum + i.product.precio * i.cantidad,
      0
    );
    const envioGratis = subtotal >= 50000;
    const envio = envioGratis ? 0 : 5000;
    const total = subtotal + envio;

    // Generar ID de orden (criptograficamente seguro)
    const orderId = generateOrderId();

    // Guardar orden en Google Sheets como "pendiente"
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
      subtotal,
      envio,
      total,
      metodo_pago: "mercadopago",
      estado: "pendiente",
      fecha: new Date().toISOString(),
    });

    // Crear preferencia de pago en MercadoPago
    const mpItems = items.map((i) => ({
      title: `${i.product.nombre}${i.variante ? ` (${i.variante})` : ""}`,
      quantity: i.cantidad,
      unit_price: i.product.precio,
    }));

    const preference = await createPreference({
      orderId,
      items: mpItems,
      payer: { email, name: nombre, surname: apellido },
      shipmentCost: envio,
    });

    return NextResponse.json({
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point,
      order_id: orderId,
    });
  } catch (error) {
    console.error("Error creating checkout:", error);
    return NextResponse.json(
      { error: "Error al procesar el pago" },
      { status: 500 }
    );
  }
}
