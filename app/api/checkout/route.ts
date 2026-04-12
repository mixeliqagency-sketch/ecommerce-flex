import { NextResponse } from "next/server";
import { createPreference } from "@/lib/mercadopago";
import { createOrder } from "@/lib/sheets/orders";
import { generateOrderId } from "@/lib/validation";
import { validateCheckout } from "@/lib/checkout-validation";
import { calcEnvio } from "@/lib/utils";
import { getProductBySlug } from "@/lib/sheets/products";

export async function POST(request: Request) {
  try {
    // Validar datos del checkout (rate limit, campos, precios contra DB)
    const result = await validateCheckout(request, "checkout");
    if (!result.ok) return result.error;

    const { items, nombre, apellido, email, telefono, direccion, ciudad, codigo_postal } = result.body;

    // Validar stock contra la DB antes de crear la orden
    for (const item of items) {
      const product = await getProductBySlug(item.product.slug);
      if (!product) {
        return NextResponse.json(
          { error: `Producto ${item.product.slug} no encontrado` },
          { status: 404 }
        );
      }
      if (product.stock < item.cantidad) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product.nombre}. Disponible: ${product.stock}, solicitado: ${item.cantidad}` },
          { status: 409 }
        );
      }
    }

    // Calcular totales
    const subtotal = items.reduce(
      (sum, i) => sum + i.product.precio * i.cantidad,
      0
    );
    const envio = calcEnvio(subtotal);
    const total = subtotal + envio;

    // Generar ID de orden (criptograficamente seguro)
    const orderId = generateOrderId();

    // Guardar orden en Google Sheets como "pendiente_pago"
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
      estado: "pendiente_pago",
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
