"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Interfaz para el evento de instalacion PWA
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function LoginPage() {
  const router = useRouter();
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

  useEffect(() => {
    // Ya instalada como PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
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

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email o contraseña incorrectos");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4">
      {/* Logo + descripcion de la app */}
      <div className="text-center mb-5">
        <p className="text-3xl mb-2">
          <span className="text-accent-emerald tracking-wider drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ fontFamily: "var(--font-logo)" }}>AOURA</span>
        </p>
        <p className="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto mb-4">
          Tu gym, tu nutricionista y tus suplementos en una sola app. Gratis.
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

      {/* Boton de Google */}
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/" })}
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
              Instalar AOURA gratis
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
                  Para instalar AOURA como app, necesitas abrir este link en Chrome o tu navegador.
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
                    <span>Listo — AOURA aparece como app en tu celular</span>
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
            AOURA instalada! Buscala en tu pantalla de inicio
          </p>
        </div>
      )}
    </div>
  );
}
