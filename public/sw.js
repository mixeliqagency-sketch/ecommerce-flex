// Service Worker para PWA e-commerce template
// Estrategia: cache-first para assets estaticos, network-first para paginas

const CACHE_NAME = "ecomflex-v1";

// Recursos criticos para precachear en install
const PRECACHE_URLS = ["/", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Limpiar caches viejos
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Solo cachear requests GET
  if (event.request.method !== "GET") return;

  // No cachear requests a APIs
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return;

  // Cache-first para assets estaticos de Next.js (JS, CSS, imagenes compiladas)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first para el resto (paginas, datos dinamicos)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cachear la respuesta exitosa
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Fallback offline cuando no hay cache ni red
          if (event.request.mode === "navigate") {
            return caches.match("/offline");
          }
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain" },
          });
        });
      })
  );
});
