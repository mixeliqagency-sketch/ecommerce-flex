import crypto from "crypto";

// Validacion de email — regex simple pero efectiva
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}

// Genera un ID de orden criptograficamente seguro
// Formato: ORD-{timestamp}-{random hex 8 chars}
// Entropia: ~32 bits de random (vs 21 bits anterior con Math.random)
export function generateOrderId(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// Limites de tamano para inputs
export const INPUT_LIMITS = {
  // Imagen base64 — maximo 4MB (base64 es ~33% mas grande que binario)
  imageBase64MaxLength: 4 * 1024 * 1024 * 1.34,
  // Texto TTS — maximo 500 caracteres
  ttsTextMaxLength: 500,
  // Mensaje de chat — maximo 2000 caracteres
  chatMessageMaxLength: 2000,
  // Campo de texto generico — maximo 500 caracteres
  textFieldMaxLength: 500,
};

// Sanitiza un string para inyeccion en prompt de IA
// Remueve caracteres de control y limita largo
export function sanitizeForPrompt(text: string, maxLength: number = 500): string {
  // Remover caracteres de control excepto newlines y tabs
  // eslint-disable-next-line no-control-regex
  const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return cleaned.slice(0, maxLength);
}
