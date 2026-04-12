"use client";

// Prompt para solicitar permisos de notificaciones push.
// Se muestra 30 segundos despues de cargar la pagina si el usuario no lo
// rechazo antes y todavia no otorgo/denegó el permiso.

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  isPushSupported,
  getPushPermission,
  subscribeUserToPush,
} from "@/lib/push-client";

const STORAGE_KEY = "push_prompt_dismissed";
const DELAY_MS = 30 * 1000;

export function PushPermissionPrompt() {
  const [show, setShow] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const pathname = usePathname();

  // Respetar el toggle pushNotifications del panel/config
  useEffect(() => {
    let cancelled = false;
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg) => {
        if (cancelled) return;
        if (!cfg?.pushNotifications?.enabled) setDisabled(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (disabled) return;
    const shouldSkip =
      pathname?.startsWith("/checkout") ||
      pathname?.startsWith("/auth") ||
      pathname?.startsWith("/cuenta") ||
      pathname?.startsWith("/tracking");
    if (shouldSkip) return;
    if (!isPushSupported()) return;
    if (localStorage.getItem(STORAGE_KEY) === "true") return;
    const perm = getPushPermission();
    if (perm === "granted" || perm === "denied") return;

    const timer = setTimeout(() => setShow(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, [pathname, disabled]);

  if (disabled) return null;

  async function handleAccept() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.error("[push-prompt] NEXT_PUBLIC_VAPID_PUBLIC_KEY no configurado");
      setShow(false);
      return;
    }
    const ok = await subscribeUserToPush(vapidKey);
    if (ok) {
      localStorage.setItem(STORAGE_KEY, "true");
      setShow(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40 bg-[var(--bg-card)] rounded-[var(--radius-card)] p-4 border border-[var(--border-glass)] shadow-lg"
      role="dialog"
      aria-label="Notificaciones"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">
            Notificaciones
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Enterate primero de ofertas y novedades. Podes desactivarlas cuando
            quieras.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-button)] text-sm font-semibold"
            >
              Activar
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-[var(--text-muted)] rounded-[var(--radius-button)] text-sm"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
