import { NextResponse } from "next/server";
import { createOrder } from "@/lib/google-sheets";
import { generateOrderId } from "@/lib/validation";
import { validateCheckout } from "@/lib/checkout-validation";
import { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_COST } from "@/lib/utils";

// Porcentaje de descuento para transferencia bancaria (lo lee del env, default 10%)
const DESCUENTO_TRANSFERENCIA = Number(process.env.NEXT_PUBLIC_TRANSFER_DISCOUNT ?? 10) / 100;

export async function POST(request: Request) {
  try {
    // Validar datos del checkout (rate limit, campos, precios contra DB)
    const result = await validateCheckout(request, "checkout-transferencia");
    if (!result.ok) return result.error;

    const { items, nombre, apellido, email, telefono, direccion, ciudad, codigo_postal } = result.body;

    // Calcular totales con descuento de transferencia
    const subtotalOriginal = items.reduce(
      (sum, i) => sum + i.product.precio * i.cantidad,
      0
    );
    const envioGratis = subtotalOriginal >= FREE_SHIPPING_THRESHOLD;
    const envio = envioGratis ? 0 : FLAT_SHIPPING_COST;

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
