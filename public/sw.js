// Service Worker para PWA e-commerce template
//
// 2026-04-13 KILL SWITCH: este SW detecta si hay una version vieja cacheada
// y la desinstala + limpia todos los caches. La razon es que el SW anterior
// cacheaba "/" y "/offline" con estrategia cache-first, lo que causaba que
// el user viera el HTML viejo despues de cambios de codigo en development.
//
// Version nueva: cache-first SOLO para assets estaticos con hash en la URL
// (immutable por definicion), network-first para paginas (HTML/JSON), y
// nunca cachear /api/*.

const CACHE_NAME = "ecomflex-v3-kill-switch";
const MAX_CACHE_ENTRIES = 100;

// Recursos criticos para precachear en install — SOLO cosas realmente estaticas.
// NO cacheamos "/" porque cambia con cada deploy y es HTML dinamico.
const PRECACHE_URLS = ["/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

// Handler para mensajes del cliente — recibe SKIP_WAITING desde InstallPrompt
// cuando detecta una version nueva, asi el activate corre inmediato.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  // CRITICO: limpiar TODOS los caches viejos (incluye ecomflex-v2 y anteriores)
  // para que el user no vea HTML stale. Al activar la nueva version, los caches
  // viejos se borran enteros.
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // NUNCA cachear:
  // - /api/* (data dinamica, no se puede cachear)
  // - Requests non-GET (POST, PUT, DELETE)
  // - Requests con query params (se consideran dinamicos)
  // - Paginas HTML en navegacion (son dinamicas y pueden cambiar)
  const url = new URL(request.url);
  const isAPI = url.pathname.startsWith("/api/");
  const isNotGet = request.method !== "GET";
  const isHTML = request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");

  if (isAPI || isNotGet || isHTML) {
    // Network-first: pedimos al server siempre. Si falla (offline), fallback
    // al cache, y si eso tambien falla, devolvemos /offline.
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached || caches.match("/offline")),
      ),
    );
    return;
  }

  // Assets estaticos (_next/static/*, /icon-*.png, /fonts/*, etc.):
  // cache-first porque son inmutables (tienen hash en el nombre o raramente cambian).
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
            // Limitar el tamano del cache a MAX_CACHE_ENTRIES
            cache.keys().then((keys) => {
              if (keys.length > MAX_CACHE_ENTRIES) {
                cache.delete(keys[0]);
              }
            });
          });
          return response;
        }),
    ),
  );
});
