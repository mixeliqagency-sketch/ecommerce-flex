import { NextResponse } from "next/server";
import { createOrder } from "@/lib/sheets/orders";
import { generateOrderId } from "@/lib/validation";
import { validateCheckout } from "@/lib/checkout-validation";
import { calcEnvio, calcTransferPrice } from "@/lib/utils";
import { getProductBySlug } from "@/lib/sheets/products";
import { validateCoupon, incrementCouponUsage } from "@/lib/sheets/coupons";
import { enqueue } from "@/lib/sheets/queue";

export async function POST(request: Request) {
  try {
    // Validar datos del checkout (rate limit, campos, precios contra DB)
    const result = await validateCheckout(request, "checkout-transferencia");
    if (!result.ok) return result.error;

    const { items, nombre, apellido, email, telefono, direccion, ciudad, codigo_postal, coupon_code, referral_code } = result.body;

    // Si vino un codigo de referido, loguearlo — la conversion real se trackea en Phase 3.5
    if (referral_code) {
      console.log("[checkout] Orden con referral_code:", referral_code, "- conversion tracking pendiente de Phase 3.5");
    }

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

    // Calcular totales con descuento de transferencia
    const subtotalOriginal = items.reduce(
      (sum, i) => sum + i.product.precio * i.cantidad,
      0
    );

    // Aplicar cupón si corresponde (antes del descuento por transferencia)
    let couponDiscount = 0;
    let appliedCoupon: string | null = null;
    if (coupon_code) {
      const coupon = await validateCoupon(coupon_code);
      if (coupon) {
        couponDiscount = Math.round(subtotalOriginal * (coupon.descuento_porcentaje / 100));
        appliedCoupon = coupon.codigo;
      }
    }

    const subtotalConCupon = subtotalOriginal - couponDiscount;
    const envio = calcEnvio(subtotalConCupon);

    // El descuento se aplica solo al subtotal (no al envio)
    const subtotalConDescuento = calcTransferPrice(subtotalConCupon);
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
      estado: "pendiente_pago",
      fecha: new Date().toISOString(),
    });

    // Incrementar uso del cupón (no bloquear si falla)
    if (appliedCoupon) {
      incrementCouponUsage(appliedCoupon).catch((err) => {
        console.error("[checkout-transferencia] Error incrementando uso de cupón:", err);
      });
    }

    // Encolar confirmación inmediata (email de "gracias por tu orden")
    // Los emails posteriores (tips, review, cross-sell) se encolan cuando el pago se confirma
    await enqueue("post_purchase_confirmation", {
      orderId: orderId,
      email,
    }).catch((err) => {
      console.error("[checkout-transferencia] Error encolando post_purchase_confirmation:", err);
      // No bloquear el checkout por esto
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
