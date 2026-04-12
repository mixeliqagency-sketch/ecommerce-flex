import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { getOrderById, updateOrderStatus } from "@/lib/sheets/orders";

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
});
const paymentClient = new Payment(mpClient);

// Idempotencia a nivel de instancia serverless.
// NOTA: no funciona entre instancias (Vercel puede tener múltiples),
// pero combinado con la verificación de estado del pedido, es efectivo.
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

    // Idempotencia en memoria
    if (processedPayments.has(paymentId)) {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
    processedPayments.add(paymentId);
    setTimeout(() => processedPayments.delete(paymentId), CACHE_CLEANUP_MS);

    // Responder 200 inmediato y procesar async
    // NOTA: en Vercel serverless, el proceso puede ser terminado después de
    // la respuesta. Para workloads críticos considerar usar una cola (Task queue
    // en Sheets) o Edge function. Para MVP esto es aceptable.
    processPayment(paymentId).catch((err) => {
      console.error("[mp-webhook] Error procesando pago", paymentId, err);
    });

    return NextResponse.json({ received: true }, { status: 200 });
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
  } else if (status === "rejected" || status === "cancelled") {
    // Solo cancelar si está en pendiente_pago (la validación de transición ya lo verifica)
    if (order.estado === "pendiente_pago") {
      await updateOrderStatus(externalReference, "cancelado");
      console.log("[mp-webhook] Pedido", externalReference, "cancelado por MP:", status);
    }
  }
}
