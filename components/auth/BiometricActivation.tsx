"use client";

// Card de "Activar huella digital" — usa WebAuthn (PublicKeyCredential API)
// para registrar una credencial biométrica en el dispositivo. Portado del flow
// de AOURA con simplificaciones para Ecomflex + soporte DEMO_MODE.
//
// Flow:
//   1. Usuario clickea "Activar"
//   2. Chequeamos si el navegador soporta WebAuthn (Safari iOS 14+, Chrome, Firefox)
//   3. En DEMO_MODE: simulamos el success sin llamar a APIs
//   4. En produccion: POST /api/auth/webauthn/register-options → navigator.credentials.create
//      → POST /api/auth/webauthn/register-verify (Sheets guarda la credential)
//
// REGLA ECOMFLEX: todos los textos vienen de themeConfig.copy.biometric.*

import { useEffect, useState } from "react";
import { themeConfig } from "@/theme.config";
import { isDemoModeClient } from "@/lib/demo-data";

const { biometric: copy } = themeConfig.copy;

type Status = "idle" | "checking" | "unsupported" | "ready" | "registering" | "registered" | "error";

export default function BiometricActivation() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Regla UX (Pablo 2026-04-14): esta card solo tiene sentido dentro de
    // la PWA instalada — en el browser comun la huella digital no aporta
    // porque el user ya esta tipeando contrasena. Chequeamos display-mode
    // standalone (iOS Safari + Android Chrome la prenden cuando la app
    // se abre desde el icono de la home screen, no desde la pestana).
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari legacy check
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
    if (!standalone) {
      setStatus("unsupported");
      return;
    }

    // Chequeo de soporte WebAuthn. En iOS funciona desde Safari 14+ (2020+),
    // en Android desde Chrome 70+ con biometric sensor. Desktop funciona con
    // Windows Hello, Touch ID, etc.
    if (!window.PublicKeyCredential) {
      setStatus("unsupported");
      return;
    }
    // Chequeo adicional: el dispositivo tiene un authenticator disponible
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then((available) => {
        setStatus(available ? "ready" : "unsupported");
      })
      .catch(() => setStatus("unsupported"));

    // Si ya hay credencial registrada para este usuario, mostrar estado registered.
    // En produccion esto llama a GET /api/auth/webauthn/status. En DEMO leemos
    // localStorage para persistir el mock entre reloads.
    if (isDemoModeClient() && localStorage.getItem("demo_biometric_registered") === "true") {
      setStatus("registered");
    }
  }, []);

  const handleActivate = async () => {
    setError(null);
    setStatus("registering");

    if (isDemoModeClient()) {
      // Simulacion de DEMO_MODE — delay realista (1.5s) + success
      await new Promise((r) => setTimeout(r, 1500));
      localStorage.setItem("demo_biometric_registered", "true");
      setStatus("registered");
      return;
    }

    // Produccion: flujo WebAuthn real
    try {
      const optRes = await fetch("/api/auth/webauthn/register-options", { method: "POST" });
      if (!optRes.ok) throw new Error("No se pudo iniciar el registro");
      const options = await optRes.json();

      // Convertir strings base64url a ArrayBuffer (WebAuthn requiere binarios)
      const publicKey = {
        ...options,
        challenge: base64urlToBuffer(options.challenge),
        user: { ...options.user, id: base64urlToBuffer(options.user.id) },
        excludeCredentials: (options.excludeCredentials ?? []).map((c: { id: string; type: string }) => ({
          ...c,
          id: base64urlToBuffer(c.id),
        })),
      };

      const cred = await navigator.credentials.create({ publicKey });
      if (!cred) throw new Error("Registro cancelado");

      const verify = await fetch("/api/auth/webauthn/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cred),
      });
      if (!verify.ok) throw new Error("El servidor rechazo la credencial");

      setStatus("registered");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : copy.errorGeneric;
      setError(msg);
      setStatus("error");
    }
  };

  if (status === "unsupported") return null; // no mostramos nada si el device no soporta

  return (
    <div className="bg-bg-card border border-border-glass rounded-card p-4 md:p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-accent-emerald/10 text-accent-emerald flex items-center justify-center flex-shrink-0">
          {/* Icono fingerprint */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2a.506.506 0 01.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.25.13.34.43.21.67-.09.18-.26.28-.44.28zM3.5 9.72a.499.499 0 01-.41-.79c.99-1.4 2.25-2.5 3.75-3.27C9.98 4.04 14 4.03 17.15 5.66c1.5.77 2.76 1.86 3.75 3.25a.5.5 0 01-.12.7c-.23.16-.54.11-.7-.12a9.388 9.388 0 00-3.39-2.94c-2.87-1.48-6.54-1.47-9.4.01-1.36.7-2.5 1.7-3.4 2.96-.08.14-.23.2-.39.2zm6.25 12.07a.47.47 0 01-.35-.15c-.87-.87-1.34-1.43-2.01-2.64-.69-1.23-1.05-2.73-1.05-4.34 0-2.97 2.54-5.39 5.66-5.39s5.66 2.42 5.66 5.39a.5.5 0 01-1 0c0-2.42-2.09-4.39-4.66-4.39-2.57 0-4.66 1.97-4.66 4.39 0 1.44.32 2.77.93 3.85.64 1.15 1.08 1.64 1.85 2.42.19.2.19.51 0 .71-.11.1-.24.15-.37.15zm7.17-1.85c-1.19 0-2.24-.3-3.1-.89-1.49-1.01-2.38-2.65-2.38-4.39a.5.5 0 011 0c0 1.4.72 2.72 1.94 3.55.71.48 1.54.73 2.54.73.24 0 .64-.03 1.04-.1.27-.05.53.13.58.41.05.27-.13.53-.41.58-.57.11-1.07.12-1.21.12zM14.91 22c-.04 0-.09-.01-.13-.02-1.59-.44-2.63-1.03-3.72-2.1a7.297 7.297 0 01-2.17-5.22c0-1.62 1.38-2.94 3.08-2.94 1.7 0 3.08 1.32 3.08 2.94 0 1.07.93 1.94 2.08 1.94s2.08-.87 2.08-1.94c0-3.77-3.25-6.83-7.25-6.83-2.84 0-5.44 1.58-6.61 4.03-.39.81-.59 1.76-.59 2.8 0 .78.07 2.01.67 3.61.1.26-.03.55-.29.64-.26.1-.55-.04-.64-.29a11.14 11.14 0 01-.73-3.96c0-1.2.23-2.29.68-3.24 1.33-2.79 4.28-4.6 7.51-4.6 4.55 0 8.25 3.51 8.25 7.83 0 1.62-1.38 2.94-3.08 2.94s-3.08-1.32-3.08-2.94c0-1.07-.93-1.94-2.08-1.94s-2.08.87-2.08 1.94c0 1.71.66 3.31 1.87 4.51.95.94 1.86 1.46 3.27 1.85.27.07.42.35.35.61-.05.23-.26.38-.47.38z" fill="currentColor" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-heading font-semibold text-sm text-text-primary">{copy.title}</p>
          <p className="text-[11px] text-text-muted mt-0.5 leading-snug">{copy.subtitle}</p>
        </div>
      </div>

      {status === "registered" ? (
        <div className="flex items-center gap-2 bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/30 rounded-lg px-4 py-3 text-sm font-semibold">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20,6 9,17 4,12" />
          </svg>
          {copy.activeLabel}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleActivate}
          disabled={status === "registering" || status === "checking"}
          className="w-full min-h-[44px] rounded-card border-2 border-accent-emerald text-accent-emerald hover:bg-accent-emerald hover:text-white transition-colors font-semibold text-sm py-2.5 disabled:opacity-60 disabled:cursor-wait"
        >
          {status === "registering" ? copy.registering : copy.activateButton}
        </button>
      )}

      {error && (
        <p className="mt-2 text-xs text-accent-red">{error}</p>
      )}
    </div>
  );
}

// Utility: base64url → ArrayBuffer (WebAuthn manda los binarios como base64url)
function base64urlToBuffer(base64url: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
