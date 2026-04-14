"use client";

import { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { themeConfig } from "@/theme.config";
import BrandWordmark from "@/components/layout/BrandWordmark";
import { isDemoModeClient } from "@/lib/demo-data";
import { setDemoSession } from "@/lib/demo-auth";
import type { BeforeInstallPromptEvent } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  // Regla de UX: despues del login SIEMPRE vamos al home. Ignoramos el
  // callbackUrl (aunque el que redirigio aca lo haya mandado) porque el
  // user lo prefiere asi — evita que entre al carrito/checkout/producto
  // especifico y le rompe la expectativa de "primer paso tras loguear =
  // ver la tienda fresca desde la home".
  const callbackUrl = "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // PWA install
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installDone, setInstallDone] = useState(false);
  const [showManualInstall, setShowManualInstall] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  // Biometric login — solo se muestra si (a) estamos en PWA standalone y
  // (b) el user ya activo la huella desde /cuenta. Regla Pablo 2026-04-14:
  // no mostrar WebAuthn fuera de la app porque pierde sentido UX.
  const [canBiometricLogin, setCanBiometricLogin] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const autoPromptedRef = useRef(false);

  useEffect(() => {
    // Ya instalada como PWA
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    // Biometric login visible solo si: standalone + soporte WebAuthn + ya
    // hay una credencial registrada (flag en localStorage para demo mode,
    // o respuesta del endpoint de webauthn status en prod).
    if (standalone && typeof window.PublicKeyCredential !== "undefined") {
      const registered =
        (isDemoModeClient() && localStorage.getItem("demo_biometric_registered") === "true") ||
        localStorage.getItem("biometric_credential_id") !== null;
      if (registered) setCanBiometricLogin(true);
    }

    if (standalone) {
      setIsInstalled(true);
      return;
    }

    // Detectar navegadores in-app (Telegram, Instagram, Facebook, etc.)
    const ua = navigator.userAgent || "";
    const inApp = /Telegram|Instagram|FBAN|FBAV|Line|WhatsApp|Snapchat/i.test(ua);
    setIsInAppBrowser(inApp);

    // Mostrar instrucciones manuales inmediatamente (se reemplaza si beforeinstallprompt dispara)
    setShowManualInstall(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowManualInstall(false);
    };
    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // Auto-trigger del panel biometrico al abrir la app. Si el user ya activo
  // huella previamente (canBiometricLogin=true) y estamos en PWA standalone,
  // levantamos el prompt nativo del OS a los 600ms de mount — el tiempo
  // justo para que el PWA termine de montar. Pablo 2026-04-14: queria que
  // el bottom sheet de huella apareciera automaticamente al abrir la app.
  // NOTA: algunos browsers requieren user gesture reciente — si falla, el
  // user puede tap el boton manualmente como fallback.
  useEffect(() => {
    if (!canBiometricLogin || autoPromptedRef.current) return;
    autoPromptedRef.current = true;
    const timer = setTimeout(() => {
      handleBiometricLogin();
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canBiometricLogin]);

  // Login con huella — WebAuthn REAL en demo y prod. En demo no hay
  // verificacion backend, pero el browser igual llama al OS para que
  // levante el panel nativo de huella (el "bottom sheet" de Android).
  // Si el dedo matchea con la credencial registrada → setDemoSession.
  const handleBiometricLogin = async () => {
    setBioLoading(true);
    setError("");
    try {
      const credIdB64 = localStorage.getItem("biometric_credential_id");
      if (!credIdB64) throw new Error("No hay huella registrada");

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKey: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [
          {
            id: base64urlToBuffer(credIdB64),
            type: "public-key",
            transports: ["internal"],
          },
        ],
        userVerification: "required",
        timeout: 60000,
        rpId: window.location.hostname,
      };

      // Esto dispara el panel nativo del OS — en Android aparece desde
      // abajo hacia arriba pidiendo el dedo, en iOS Face ID o Touch ID.
      const assertion = await navigator.credentials.get({ publicKey });
      if (!assertion) throw new Error("Login biometrico cancelado");

      // Demo: confiamos en la assertion del OS, no hay verify del backend.
      // Prod: aca iria el POST a /api/auth/webauthn/login-verify.
      setDemoSession(true);
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error
        ? (err.name === "NotAllowedError" ? "Huella cancelada" : err.message)
        : "No pudimos validar la huella";
      setError(msg);
    } finally {
      setBioLoading(false);
    }
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === "accepted") {
      setInstallDone(true);
    }
    setInstallPrompt(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // DEMO_MODE: no hay NextAuth configurado, asi que simulamos el login
    // seteando una session fake en localStorage. Cualquier email/password
    // con al menos 1 caracter sirve — es solo para testear el flow.
    if (isDemoModeClient()) {
      if (!email || !password) {
        setError("Completa email y contraseña");
        setLoading(false);
        return;
      }
      setDemoSession(true);
      setLoading(false);
      router.push(callbackUrl);
      router.refresh();
      return;
    }

    // Produccion: NextAuth credentials
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email o contraseña incorrectos");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4">
      {/* Logo wordmark (el mismo que en el header) + tagline + titulo */}
      <div className="text-center mb-5">
        <div className="mb-2">
          <BrandWordmark className="text-4xl" />
        </div>
        <p className="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto mb-4">
          {themeConfig.brand.tagline}
        </p>
        <h1 className="font-heading text-lg font-bold">
          Iniciar sesion
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div>
          <label htmlFor="email" className="block text-xs text-text-muted mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full bg-bg-card border border-border-glass rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-emerald transition-colors"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs text-text-muted mb-1">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full bg-bg-card border border-border-glass rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-emerald transition-colors"
          />
        </div>

        {error && (
          <div className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3 text-accent-red text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent-emerald disabled:bg-accent-emerald/50 text-white py-2.5 rounded-card font-semibold transition-all hover:brightness-125 hover:scale-[1.01] active:scale-[0.98]"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      {/* Separador */}
      <div className="flex items-center gap-3 my-3">
        <div className="flex-1 h-px bg-border-glass" />
        <span className="text-xs text-text-muted">o</span>
        <div className="flex-1 h-px bg-border-glass" />
      </div>

      {/* Boton de Google — en DEMO_MODE simulamos el login instantaneo */}
      <button
        type="button"
        onClick={() => {
          if (isDemoModeClient()) {
            setDemoSession(true);
            router.push(callbackUrl);
            router.refresh();
            return;
          }
          signIn("google", { callbackUrl });
        }}
        className="w-full flex items-center justify-center gap-2 bg-bg-card border border-border-glass rounded-lg px-3 py-2.5 text-sm text-text-primary hover:border-accent-emerald/50 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Ingresar con Google
      </button>

      <p className="text-sm text-text-secondary text-center mt-3">
        No tenes cuenta?{" "}
        <Link href="/auth/registro" className="text-accent-emerald hover:underline">
          Crear cuenta
        </Link>
      </p>

      {/* Activacion biometrica movida a /cuenta (post-login). No tiene sentido
          mostrarla antes de que el user este autenticado — Pablo 2026-04-14. */}

      {/* Boton "Ingresar con huella" — solo aparece si el user ya activo
          la huella desde /cuenta Y esta en la PWA instalada. Ver canBiometricLogin. */}
      {canBiometricLogin && (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleBiometricLogin}
            disabled={bioLoading}
            className="w-full flex items-center justify-center gap-2 bg-accent-emerald/10 border border-accent-emerald/40 hover:bg-accent-emerald hover:text-white text-accent-emerald rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41" />
              <path d="M3.5 9.72a.499.499 0 01-.41-.79c.99-1.4 2.25-2.5 3.75-3.27" />
              <path d="M9.75 21.79c-.87-.87-1.34-1.43-2.01-2.64-.69-1.23-1.05-2.73-1.05-4.34 0-2.97 2.54-5.39 5.66-5.39s5.66 2.42 5.66 5.39" />
              <path d="M14.91 22c-1.59-.44-2.63-1.03-3.72-2.1a7.297 7.297 0 01-2.17-5.22" />
            </svg>
            {bioLoading ? "Validando huella..." : "Ingresar con huella"}
          </button>
        </div>
      )}

      {/* Banner de instalacion PWA */}
      {!isInstalled && !installDone && (
        <div className="mt-3">
          {installPrompt ? (
            <button
              onClick={handleInstall}
              className="w-full py-2.5 rounded-xl bg-accent-emerald/10 border border-accent-emerald/25 text-accent-emerald font-semibold text-sm transition-all hover:bg-accent-emerald hover:text-white active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Instalar {themeConfig.brand.name} gratis
            </button>
          ) : showManualInstall ? (
            isInAppBrowser ? (
              <div className="bg-bg-card border border-accent-orange/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-accent-orange/10 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-orange">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </div>
                  <p className="font-heading font-bold text-sm text-text-primary">Abri en tu navegador</p>
                </div>
                <p className="text-xs text-text-secondary mb-2">
                  Para instalar {themeConfig.brand.name} como app, necesitas abrir este link en Chrome o tu navegador.
                </p>
                <button
                  type="button"
                  onClick={() => { window.open(window.location.href, "_blank"); }}
                  className="w-full py-2 rounded-lg bg-accent-orange/10 border border-accent-orange/25 text-accent-orange font-semibold text-xs transition-all active:scale-[0.98]"
                >
                  Abrir en navegador
                </button>
              </div>
            ) : (
              <div className="bg-bg-card border border-accent-emerald/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-accent-emerald/10 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-emerald">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </div>
                  <p className="font-heading font-bold text-sm text-text-primary">Instala la app en tu celular</p>
                </div>
                <div className="flex flex-col gap-1.5 text-xs text-text-secondary">
                  <p className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-accent-emerald/15 text-accent-emerald text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <span>Toca el menu del navegador
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="inline ml-1 -mt-0.5 text-text-muted"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-accent-emerald/15 text-accent-emerald text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    <span>Selecciona <strong className="text-text-primary">&quot;Agregar a pantalla de inicio&quot;</strong></span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-accent-emerald/15 text-accent-emerald text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    <span>Listo — {themeConfig.brand.name} aparece como app en tu celular</span>
                  </p>
                </div>
              </div>
            )
          ) : null}
        </div>
      )}

      {/* Confirmacion post-instalacion */}
      {installDone && (
        <div className="mt-4 text-center p-4 bg-accent-emerald/10 border border-accent-emerald/25 rounded-2xl">
          <p className="text-sm text-accent-emerald font-semibold flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {themeConfig.brand.name} instalada! Buscala en tu pantalla de inicio
          </p>
        </div>
      )}
    </div>
  );
}

// Utility: base64url → ArrayBuffer. Usado para reconstruir el credential id
// almacenado en localStorage antes de pasarlo a navigator.credentials.get().
function base64urlToBuffer(base64url: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
