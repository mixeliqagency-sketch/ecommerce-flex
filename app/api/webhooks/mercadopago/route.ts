import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { getOrderById, updateOrderStatus } from "@/lib/sheets/orders";
import { decrementStock } from "@/lib/sheets/products";
import { enqueue } from "@/lib/sheets/queue";
import { registerConversion } from "@/lib/sheets/referrals";

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
});
const paymentClient = new Payment(mpClient);

/**
 * Cache de idempotencia por instancia serverless.
 * NOTA: En Vercel con múltiples instancias activas, dos webhooks del mismo
 * payment pueden colarse. La validación de estado en processPayment
 * (POST_PAYMENT_STATES) es la segunda línea de defensa: si el pedido ya está
 * pagado/enviado/etc, no se re-procesa.
 */
const processedPayments = new Set<string>();
const CACHE_CLEANUP_MS = 60 * 60 * 1000; // 1 hora

/**
 * Verifica la firma x-signature de MercadoPago.
 * Formato del header: "ts=1234567890,v1=hash_sha256"
 * Manifest: `id:{data.id};request-id:{x-request-id};ts:{ts};`
 */
function verifySignature(
  signatureHeader: string | null,
  requestId: string | null,
  dataId: string
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !signatureHeader || !requestId) {
    console.error("[mp-webhook] Falta secret, x-signature o x-request-id");
    return false;
  }

  const parts = signatureHeader.split(",");
  let ts = "";
  let hash = "";
  for (const part of parts) {
    const [key, val] = part.split("=");
    if (key?.trim() === "ts") ts = val?.trim() ?? "";
    if (key?.trim() === "v1") hash = val?.trim() ?? "";
  }

  if (!ts || !hash) return false;

  // Validar timestamp dentro de 5 minutos (prevención de replay attacks)
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return false;

  // MP puede enviar ts en segundos o milisegundos. Probar ambos.
  const tsMs = tsNum > 1e12 ? tsNum : tsNum * 1000;
  if (Math.abs(Date.now() - tsMs) > 5 * 60 * 1000) {
    console.error("[mp-webhook] Timestamp fuera de rango:", tsNum);
    return false;
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expectedHash = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(expectedHash, "hex")
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const signatureHeader = req.headers.get("x-signature");
    const requestId = req.headers.get("x-request-id");

    // Solo procesar notificaciones de tipo payment
    const isPayment =
      body.type === "payment" ||
      body.action === "payment.created" ||
      body.action === "payment.updated";
    if (!isPayment) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const paymentId = String(body.data?.id ?? "");
    if (!paymentId) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Verificar firma
    if (!verifySignature(signatureHeader, requestId, paymentId)) {
      console.error("[mp-webhook] Firma inválida para payment", paymentId);
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    // Idempotencia en memoria (detección de duplicados)
    if (processedPayments.has(paymentId)) {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }

    // Procesar sincrónicamente — puede lanzar. Recién marcamos como procesado
    // si tuvo éxito, para que MP pueda reintentar si falla.
    try {
      await processPayment(paymentId);
      processedPayments.add(paymentId);
      setTimeout(() => processedPayments.delete(paymentId), CACHE_CLEANUP_MS);
      return NextResponse.json({ received: true }, { status: 200 });
    } catch (err) {
      console.error("[mp-webhook] Error procesando pago", paymentId, err);
      // Devolver 500 para que MP reintente
      return NextResponse.json({ error: "Error procesando pago" }, { status: 500 });
    }
  } catch (error) {
    console.error("[mp-webhook] Error:", error);
    // Devolver 200 para evitar reintentos en errores no recuperables
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

async function processPayment(paymentId: string): Promise<void> {
  const payment = await paymentClient.get({ id: paymentId });
  const externalReference = payment.external_reference;
  const status = payment.status;

  if (!externalReference) {
    console.error("[mp-webhook] Pago", paymentId, "sin external_reference");
    return;
  }

  const order = await getOrderById(externalReference);
  if (!order) {
    console.error("[mp-webhook] Pedido", externalReference, "no encontrado");
    return;
  }

  // Idempotencia a nivel de datos: si ya está en un estado post-pago, no re-procesar
  const POST_PAYMENT_STATES = ["pagado", "preparando", "enviado", "entregado", "reembolsado"];
  if (POST_PAYMENT_STATES.includes(order.estado)) {
    console.log("[mp-webhook] Pedido", externalReference, "ya procesado (estado:", order.estado, ")");
    return;
  }

  if (status === "approved") {
    await updateOrderStatus(externalReference, "pagado");
    console.log("[mp-webhook] Pedido", externalReference, "marcado como pagado");

    // Decrementar stock de cada item (best-effort, no bloquear si falla)
    try {
      for (const item of order.items) {
        await decrementStock(item.product.slug, item.cantidad);
      }
    } catch (err) {
      console.error("[mp-webhook] Error decrementando stock para", externalReference, err);
      // No propagar — el pedido ya está pagado, el admin puede ajustar stock manualmente
    }

    // Encolar confirmacion inmediata + emails posteriores al pago.
    // post_purchase_confirmation se movio aca desde el endpoint de checkout:
    // antes se encolaba al crear la orden, lo que hacia que usuarios que
    // nunca pagaban recibieran igual "¡Gracias por tu compra!".
    try {
      await enqueue("post_purchase_confirmation", { orderId: externalReference, email: order.email });
      await enqueue("post_purchase_tips", { orderId: externalReference, email: order.email });
      await enqueue("post_purchase_review_request", { orderId: externalReference, email: order.email });
      await enqueue("post_purchase_cross_sell", { orderId: externalReference, email: order.email });
    } catch (err) {
      console.error("[mp-webhook] Error encolando eventos post-pago:", err);
      // No propagar — el pedido ya está pagado y el stock decrementado
    }

    // Si la orden tiene referral_code, registrar la conversion en la Sheet
    // de referidos (suma al contador del referrer, best-effort).
    if (order.referral_code) {
      try {
        await registerConversion(order.referral_code, order.total);
      } catch (err) {
        console.error("[mp-webhook] Error registrando conversion referral:", err);
      }
    }
  } else if (status === "rejected" || status === "cancelled") {
    // Solo cancelar si está en pendiente_pago (la validación de transición ya lo verifica)
    if (order.estado === "pendiente_pago") {
      await updateOrderStatus(externalReference, "cancelado");
      console.log("[mp-webhook] Pedido", externalReference, "cancelado por MP:", status);
    }
  }
}
