"use client";

import { useState, useEffect, useRef } from "react";
import { themeConfig } from "@/theme.config";
import type { BeforeInstallPromptEvent } from "@/types";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [show, setShow] = useState(false);
  const [isManual, setIsManual] = useState(false);

  useEffect(() => {
    // Registrar service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Si ya esta instalada como PWA, no mostrar nada
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Verificar si ya fue descartado
    let wasDismissed = false;
    try {
      wasDismissed = !!localStorage.getItem("shop_install_dismissed");
    } catch { /* Safari privado */ }

    if (wasDismissed) return;

    // Capturar el evento de instalacion del browser
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
      // Si el evento nativo llego, cancelar el fallback manual
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Fallback: si en 3s no se dispara el evento, mostrar instrucciones manuales
    // Guardamos el id en un ref para poder cancelarlo desde el handler nativo
    fallbackTimerRef.current = setTimeout(() => {
      if (!deferredPromptRef.current) {
        setIsManual(true);
        setShow(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    try { localStorage.setItem("shop_install_dismissed", "true"); } catch { /* Safari privado */ }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm z-35 bg-bg-card border border-accent-emerald/30 rounded-2xl p-4 shadow-2xl animate-slide-up">
      <div className="flex items-start gap-3">
        {/* Icono descarga */}
        <div className="w-10 h-10 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-center justify-center flex-shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-emerald">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-sm text-text-primary">Instalar {themeConfig.brand.name}</p>
          <p className="text-xs text-text-secondary mt-0.5">
            {isManual
              ? "Toca el menu del navegador y selecciona \"Agregar a pantalla de inicio\""
              : "Accede mas rapido desde tu pantalla de inicio"}
          </p>
        </div>
        {/* Cerrar */}
        <button
          onClick={handleDismiss}
          className="text-text-muted hover:text-text-primary p-1 flex-shrink-0"
          aria-label="Cerrar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      {!isManual ? (
        <button
          onClick={handleInstall}
          className="w-full mt-3 bg-accent-emerald text-white py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-125 hover:scale-[1.01] active:scale-[0.98]"
        >
          Instalar app
        </button>
      ) : (
        <div className="mt-3 flex items-center gap-2 bg-accent-emerald/10 rounded-xl px-3 py-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent-emerald flex-shrink-0"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          <p className="text-xs text-accent-emerald font-medium">Menu &gt; &quot;Agregar a pantalla de inicio&quot;</p>
        </div>
      )}
    </div>
  );
}
