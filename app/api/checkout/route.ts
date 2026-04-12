import { NextResponse } from "next/server";
import { createPreference } from "@/lib/mercadopago";
import { createOrder } from "@/lib/sheets/orders";
import { generateOrderId } from "@/lib/validation";
import { validateCheckout } from "@/lib/checkout-validation";
import { calcEnvio } from "@/lib/utils";
import { getProductBySlug } from "@/lib/sheets/products";
import { validateCoupon, incrementCouponUsage } from "@/lib/sheets/coupons";
import { enqueue } from "@/lib/sheets/queue";

export async function POST(request: Request) {
  try {
    // Validar datos del checkout (rate limit, campos, precios contra DB)
    const result = await validateCheckout(request, "checkout");
    if (!result.ok) return result.error;

    const { items, nombre, apellido, email, telefono, direccion, ciudad, codigo_postal, coupon_code } = result.body;

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

    // Aplicar cupón si viene en el body
    let discount = 0;
    let appliedCoupon: string | null = null;
    if (coupon_code) {
      const coupon = await validateCoupon(coupon_code);
      if (coupon) {
        discount = Math.round(subtotal * (coupon.descuento_porcentaje / 100));
        appliedCoupon = coupon.codigo;
      }
    }

    const subtotalConDescuento = subtotal - discount;
    const envio = calcEnvio(subtotalConDescuento);
    const total = subtotalConDescuento + envio;

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
      subtotal: subtotalConDescuento,
      envio,
      total,
      metodo_pago: "mercadopago",
      estado: "pendiente_pago",
      fecha: new Date().toISOString(),
    });

    // Incrementar uso del cupón (no bloquear el checkout si falla)
    if (appliedCoupon) {
      incrementCouponUsage(appliedCoupon).catch((err) => {
        console.error("[checkout] Error incrementando uso de cupón:", err);
      });
    }

    // Encolar confirmación inmediata (email de "gracias por tu orden")
    // Los emails posteriores (tips, review, cross-sell) se encolan cuando el pago se confirma en el webhook
    await enqueue("post_purchase_confirmation", {
      orderId: orderId,
      email,
    }).catch((err) => {
      console.error("[checkout] Error encolando post_purchase_confirmation:", err);
      // No bloquear el checkout por esto
    });

    // Crear preferencia de pago en MercadoPago
    const mpItems = items.map((i) => ({
      title: `${i.product.nombre}${i.variante ? ` (${i.variante})` : ""}`,
      quantity: i.cantidad,
      unit_price: i.product.precio,
    }));

    // Si hay descuento por cupón, agregar línea negativa para que el total en
    // MP refleje el subtotal con descuento + envío
    if (discount > 0 && appliedCoupon) {
      mpItems.push({
        title: `Descuento cupón ${appliedCoupon}`,
        quantity: 1,
        unit_price: -discount,
      });
    }

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
