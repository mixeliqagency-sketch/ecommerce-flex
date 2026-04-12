// Rate limiter en memoria para proteger endpoints costosos (IA, TTS)
// En produccion se recomienda Redis, pero para MVP esto es suficiente

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Almacen global por IP — se limpia automaticamente
const store = new Map<string, RateLimitEntry>();

// Limpieza periodica para evitar memory leak (cada 5 min)
let cleanupScheduled = false;
function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (now > entry.resetAt) store.delete(key);
    });
  }, 5 * 60 * 1000);
}

interface RateLimitConfig {
  // Maximo de requests permitidos en la ventana
  maxRequests: number;
  // Duracion de la ventana en segundos
  windowSeconds?: number;
  // Alternativa: duracion en milisegundos (mas explicito)
  windowMs?: number;
}

// Presets para diferentes endpoints
export const RATE_LIMITS = {
  // Endpoints de IA (costosos — OpenAI gpt-4o)
  ai: { maxRequests: 10, windowSeconds: 60 } as RateLimitConfig,
  // TTS (menos costoso pero no gratuito)
  tts: { maxRequests: 15, windowSeconds: 60 } as RateLimitConfig,
  // Endpoints generales (checkout, resenas, etc)
  general: { maxRequests: 30, windowSeconds: 60 } as RateLimitConfig,
};

// Extrae IP del request (compatible con Vercel y proxies)
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}

// Verifica rate limit — acepta Request o string (IP) como primer argumento.
// NOTA: el limiter es in-memory y best-effort — en Vercel serverless cada
// instancia tiene su propio store. Migrar a Upstash Redis para produccion.
export function checkRateLimit(
  requestOrIp: Request | string,
  prefix: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  scheduleCleanup();

  const ip = typeof requestOrIp === "string" ? requestOrIp : getClientIP(requestOrIp);
  const key = `${prefix}:${ip}`;
  const now = Date.now();

  // Resolver duracion de la ventana: windowMs tiene prioridad, fallback a windowSeconds
  const windowMs = config.windowMs ?? (config.windowSeconds ?? 60) * 1000;
  const windowSeconds = Math.ceil(windowMs / 1000);

  const entry = store.get(key);

  // Primera request o ventana expirada
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: windowSeconds };
  }

  // Dentro de la ventana
  entry.count++;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const resetIn = Math.ceil((entry.resetAt - now) / 1000);

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining, resetIn };
}
