"use client";

// =============================================
// Sistema de analytics invisible para AOURA
// Captura eventos del usuario sin afectar la experiencia
// Los acumula en memoria y los envia en batch a Google Sheets
// =============================================

interface AuraEvent {
  timestamp: string;
  tipo: string;
  pagina: string;
  datos: string;
  dispositivo: string;
  referrer: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
}

// Cola de eventos pendientes de enviar
let eventQueue: AuraEvent[] = [];
let sessionId = "";
let utmParams = { source: "", medium: "", campaign: "" };
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let analyticsInitialized = false;

// Generar ID de sesion unico
function getSessionId(): string {
  if (sessionId) return sessionId;
  const stored = sessionStorage.getItem("aura_session_id");
  if (stored) {
    sessionId = stored;
    return stored;
  }
  sessionId = `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  sessionStorage.setItem("aura_session_id", sessionId);
  return sessionId;
}

// Detectar dispositivo
function getDeviceType(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

// Capturar UTM params de la URL (solo la primera vez)
function captureUtmParams(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source");
  const medium = params.get("utm_medium");
  const campaign = params.get("utm_campaign");

  if (source || medium || campaign) {
    utmParams = {
      source: source || "",
      medium: medium || "",
      campaign: campaign || "",
    };
    // Guardar en sessionStorage para que persistan durante la visita
    sessionStorage.setItem("aura_utm", JSON.stringify(utmParams));
  } else {
    // Intentar recuperar de sessionStorage
    const stored = sessionStorage.getItem("aura_utm");
    if (stored) {
      try {
        utmParams = JSON.parse(stored);
      } catch {
        // No pasa nada
      }
    }
  }
}

// Enviar eventos acumulados al servidor
function flushEvents(): void {
  if (eventQueue.length === 0) return;

  const eventsToSend = [...eventQueue];
  eventQueue = [];

  // Intentar obtener email del usuario
  let userEmail = "";
  try {
    const profile = localStorage.getItem("aura_nia_profile");
    if (profile) {
      const parsed = JSON.parse(profile);
      if (parsed.email) userEmail = parsed.email;
    }
  } catch {
    // No pasa nada
  }

  // Fire-and-forget — si falla, los eventos se pierden (aceptable para analytics)
  fetch("/api/sync/evento", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: getSessionId(),
      user_email: userEmail,
      eventos: eventsToSend,
    }),
  }).catch(() => {
    // Si falla, no reintentamos para no sobrecargar
  });
}

// Programar envio de eventos cada 30 segundos
function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushEvents();
    flushTimer = null;
  }, 30000);
}

// === API PUBLICA ===

// Registrar un evento
export function trackEvent(tipo: string, datos: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;

  // Capturar UTMs en el primer evento
  if (eventQueue.length === 0) captureUtmParams();

  const event: AuraEvent = {
    timestamp: new Date().toISOString(),
    tipo,
    pagina: window.location.pathname,
    datos: JSON.stringify(datos),
    dispositivo: getDeviceType(),
    referrer: document.referrer || "",
    utm_source: utmParams.source,
    utm_medium: utmParams.medium,
    utm_campaign: utmParams.campaign,
  };

  eventQueue.push(event);
  scheduleFlush();
}

// Eventos especificos pre-definidos para facil uso
export function trackPageView(pagina?: string): void {
  trackEvent("page_view", { path: pagina || window.location.pathname });
}

// TODO: integrar tracking en las páginas correspondientes
export function trackProductView(productSlug: string, productName: string): void {
  trackEvent("product_view", { slug: productSlug, nombre: productName });
}

export function trackAddToCart(productSlug: string, productName: string, precio: number): void {
  trackEvent("add_to_cart", { slug: productSlug, nombre: productName, precio });
}

export function trackRemoveFromCart(productSlug: string): void {
  trackEvent("remove_from_cart", { slug: productSlug });
}

export function trackCheckoutStart(total: number, items: number): void {
  trackEvent("checkout_start", { total, items });
}

export function trackCheckoutComplete(orderId: string, total: number): void {
  trackEvent("checkout_complete", { order_id: orderId, total });
}

export function trackSearch(query: string): void {
  trackEvent("search", { query });
}

export function trackFeatureUse(feature: string): void {
  trackEvent("feature_use", { feature });
}

// Inicializar analytics (llamar una vez en el layout)
export function initAnalytics(): void {
  if (typeof window === "undefined") return;
  if (analyticsInitialized) return;
  analyticsInitialized = true;

  captureUtmParams();
  getSessionId();

  // Enviar eventos pendientes cuando el usuario cierra la pagina
  window.addEventListener("beforeunload", flushEvents);

  // Enviar eventos cuando la pagina pierde el foco (usuario cambia de tab)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushEvents();
    }
  });

  // Track page view inicial
  trackPageView();
}
