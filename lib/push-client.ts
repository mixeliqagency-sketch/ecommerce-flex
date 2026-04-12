/**
 * Helpers de cliente para Web Push Notifications.
 * Se ejecuta solo en el navegador — todas las funciones chequean si el SW
 * y PushManager estan disponibles antes de operar.
 */

/**
 * Chequea si el navegador soporta Service Workers + Push API.
 */
export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window;
}

/**
 * Devuelve el estado actual del permiso de notificaciones.
 * Retorna null si el navegador no soporta notificaciones.
 */
export function getPushPermission(): NotificationPermission | null {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window)) return null;
  return Notification.permission;
}

/**
 * Pide permiso al usuario, suscribe al Push Manager con la VAPID key,
 * y envia la suscripcion al backend (/api/push/subscribe).
 *
 * @param vapidPublicKey - Clave publica VAPID en formato base64url
 * @returns true si se suscribio con exito, false en caso contrario
 */
export async function subscribeUserToPush(
  vapidPublicKey: string
): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn("[push-client] Push no soportado en este navegador");
    return false;
  }

  try {
    // Pedir permiso al usuario
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[push-client] Permiso denegado:", permission);
      return false;
    }

    // Registrar o reutilizar service worker
    const registration = await navigator.serviceWorker.ready;

    // Chequear si ya existe una suscripcion
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Crear nueva suscripcion con la VAPID key
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // Enviar suscripcion al backend
    const subJson = subscription.toJSON();
    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: subJson.keys,
      }),
    });

    if (!response.ok) {
      console.error("[push-client] Error al registrar suscripcion:", response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[push-client] Error en subscribeUserToPush:", error);
    return false;
  }
}

/**
 * Convierte una clave VAPID en base64url a Uint8Array (requerido por PushManager).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Convierte un ArrayBuffer a string base64 (util para serializar claves).
 * Exportado para posibles usos futuros en helpers de cliente.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
