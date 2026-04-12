/**
 * Tracking de codigos de referido en el cliente.
 * Captura ?ref=XXX de la URL, lo guarda en localStorage con TTL de 30 dias,
 * y lo reporta al backend para trackear visitas.
 */

const STORAGE_KEY = "ecomflex_ref_code";
const STORAGE_TTL_DAYS = 30;
const STORAGE_TTL_MS = STORAGE_TTL_DAYS * 24 * 60 * 60 * 1000;

interface StoredReferral {
  code: string;
  timestamp: number;
}

/**
 * Lee ?ref= de la URL actual, lo guarda en localStorage y reporta al backend.
 * Debe llamarse una sola vez al montar la app (en el layout o provider raiz).
 * No bloquea la UI — el POST al backend es fire-and-forget.
 */
export function captureReferralFromUrl(): void {
  if (typeof window === "undefined") return;

  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("ref");
    if (!code) return;

    // Guardar en localStorage con timestamp
    const data: StoredReferral = {
      code,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    // Reportar visita al backend (fire-and-forget)
    fetch("/api/referidos/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo: code }),
    }).catch((err) => {
      console.warn("[referral-tracking] Error reportando visita:", err);
    });
  } catch (error) {
    console.warn("[referral-tracking] Error capturando referral:", error);
  }
}

/**
 * Devuelve el codigo de referido guardado si sigue vigente (< 30 dias).
 * Si expiro, lo limpia de localStorage y devuelve null.
 */
export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data: StoredReferral = JSON.parse(raw);
    const age = Date.now() - data.timestamp;

    if (age > STORAGE_TTL_MS) {
      // Expirado — limpiar
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return data.code;
  } catch (error) {
    console.warn("[referral-tracking] Error leyendo referral:", error);
    return null;
  }
}

/**
 * Borra el codigo de referido guardado.
 * Se llama despues de una conversion exitosa para evitar doble-conteo.
 */
export function clearStoredReferralCode(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("[referral-tracking] Error limpiando referral:", error);
  }
}
