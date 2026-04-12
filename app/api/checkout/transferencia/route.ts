import { NextResponse } from "next/server";
import { createOrder } from "@/lib/sheets/orders";
import { generateOrderId } from "@/lib/validation";
import { validateCheckout } from "@/lib/checkout-validation";
import { calcEnvio, calcTransferPrice } from "@/lib/utils";

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
    const envio = calcEnvio(subtotalOriginal);

    // El descuento se aplica solo al subtotal (no al envio)
    const subtotalConDescuento = calcTransferPrice(subtotalOriginal);
    const descuentoMonto = subtotalOriginal - subtotalConDescuento;
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
