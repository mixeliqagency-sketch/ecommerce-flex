// Helpers para firmar/verificar tokens HMAC de unsubscribe.
// Separado del route handler porque Next.js no permite exports arbitrarios
// desde un archivo route.ts.

import crypto from "crypto";

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET no configurado");
  return secret;
}

/**
 * Genera un token firmado para el email. Usado por n8n al armar
 * el link de "Desuscribirme" en los emails enviados.
 *
 * Ejemplo: `${UNSUBSCRIBE_URL}?token=${generateUnsubscribeToken(email)}`
 */
export function generateUnsubscribeToken(email: string): string {
  const hmac = crypto
    .createHmac("sha256", getSecret())
    .update(email.toLowerCase())
    .digest("hex");
  const encoded = Buffer.from(email).toString("base64url");
  return `${encoded}.${hmac}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, hmac] = parts;
  try {
    const email = Buffer.from(encoded, "base64url").toString("utf-8");
    const expected = crypto
      .createHmac("sha256", getSecret())
      .update(email.toLowerCase())
      .digest("hex");
    // timing-safe compare
    const match = crypto.timingSafeEqual(
      Buffer.from(hmac, "hex"),
      Buffer.from(expected, "hex")
    );
    return match ? email : null;
  } catch {
    return null;
  }
}
