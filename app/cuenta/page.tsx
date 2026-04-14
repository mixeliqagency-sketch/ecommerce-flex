"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ReferralSection } from "@/components/tienda/ReferralSection";
import BiometricActivation from "@/components/auth/BiometricActivation";
import { useIsAuthenticated } from "@/hooks/useIsAuthenticated";
import { setDemoSession, setDemoAdmin, useDemoAdmin, DEMO_USER } from "@/lib/demo-auth";
import { isDemoModeClient } from "@/lib/demo-data";
import { useCart } from "@/context/CartContext";

export default function CuentaPage() {
  const { data: session } = useSession();
  const { authenticated, loading: authLoading } = useIsAuthenticated();
  const { isAdmin: isDemoAdminActive } = useDemoAdmin();
  const { clearCart } = useCart();
  const router = useRouter();

  // El user es admin del panel si:
  //  a) produccion: session.user.role === "admin" en Sheets
  //  b) demo: la perilla "Soy el dueño (demo)" esta activa en localStorage
  const isPanelAdmin = isDemoModeClient()
    ? isDemoAdminActive
    : session?.user?.role === "admin";

  // Foto de perfil
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Tema: oscuro (default) o claro
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const savedAvatar = localStorage.getItem("shop_avatar");
    if (savedAvatar) setAvatarUrl(savedAvatar);

    const savedTheme = localStorage.getItem("shop_theme");
    if (savedTheme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      setIsLightMode(true);
    }
  }, []);

  const handleToggleTheme = () => {
    const next = !isLightMode;
    setIsLightMode(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("shop_theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("shop_theme", "dark");
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const size = 200;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        localStorage.setItem("shop_avatar", dataUrl);
        setAvatarUrl(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Redirigir a login cuando no esta autenticado. Usa useIsAuthenticated que
  // abstrae NextAuth (produccion) y session fake de localStorage (DEMO_MODE).
  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push("/auth/login?callbackUrl=/cuenta");
    }
  }, [authLoading, authenticated, router]);

  if (authLoading || !authenticated) {
    return (
      <main className="container mx-auto px-4 py-24 text-center">
        <p className="text-[var(--text-secondary)]">Cargando...</p>
      </main>
    );
  }

  // En DEMO_MODE no hay session real de NextAuth — usamos el DEMO_USER fake.
  const displayUser = isDemoModeClient() ? DEMO_USER : session?.user;
  const initial = displayUser?.name?.charAt(0)?.toUpperCase() || "U";

  // Cerrar sesion — clear NextAuth Y demo session Y carrito Y flag biometrico.
  // Regla UX (Pablo 2026-04-14): sesion nueva = estado fresco. Si el user
  // se desloguea, no debe quedar data persistida (carrito, huella activada,
  // etc). Si quiere biometrico otra vez, re-activa en /cuenta post-login.
  const handleLogout = () => {
    clearCart();
    try {
      localStorage.removeItem("demo_biometric_registered");
      localStorage.removeItem("biometric_credential_id");
    } catch { /* Safari privado */ }
    if (isDemoModeClient()) {
      setDemoSession(false);
      router.push("/");
    } else {
      signOut({ callbackUrl: "/" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Mi Cuenta</h1>
        {/* Boton "Cerrar sesion" arriba a la derecha — antes vivia al fondo
            del todo despues de Referidos y el user no lo encontraba. En
            mobile se ve como icono, en desktop con texto. */}
        <button
          onClick={handleLogout}
          aria-label="Cerrar sesion"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-accent-red hover:bg-accent-red/10 transition-colors text-sm font-medium flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="hidden sm:inline">Cerrar sesion</span>
        </button>
      </div>

      {/* Apariencia */}
      <div className="bg-bg-card rounded-card border border-border-glass px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLightMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-emerald flex-shrink-0">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-emerald flex-shrink-0">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            <span className="text-sm text-text-secondary">{isLightMode ? "Modo claro" : "Modo oscuro"}</span>
          </div>
          <button
            onClick={handleToggleTheme}
            aria-label={isLightMode ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
            className="relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none flex-shrink-0"
            style={{ backgroundColor: isLightMode ? "#10B981" : "#374151" }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300"
              style={{ transform: isLightMode ? "translateX(20px)" : "translateX(0px)" }}
            />
          </button>
        </div>
      </div>

      {/* Avatar + Nombre */}
      <div className="bg-bg-card rounded-card border border-border-glass p-5">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-accent-emerald/20 flex items-center justify-center">
                <span className="text-accent-emerald font-heading font-bold text-2xl">{initial}</span>
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent-emerald flex items-center justify-center shadow-lg border-2 border-bg-primary"
              aria-label="Cambiar foto"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          <div className="min-w-0">
            <p className="font-heading font-semibold text-lg truncate">
              {displayUser?.name || "Usuario"}
            </p>
            <p className="text-sm text-text-secondary truncate">
              {displayUser?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Panel de administracion — solo visible si el user es admin.
          En prod aparece cuando session.user.role === "admin" en la Sheet.
          En demo aparece cuando la perilla "Soy el dueño (demo)" esta activa. */}
      {isPanelAdmin && (
        <Link
          href="/panel"
          className="flex items-center gap-3 bg-bg-card border border-accent-emerald/40 hover:border-accent-emerald rounded-card p-4 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
        >
          <div className="w-11 h-11 rounded-full bg-accent-emerald/10 text-accent-emerald flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-sm text-text-primary">Panel de administración</p>
            <p className="text-[11px] text-text-muted mt-0.5">Gestionar productos, pedidos, marketing y toggles de módulos</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted flex-shrink-0" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      )}

      {/* Perilla "Soy el dueño" — solo en DEMO_MODE, permite simular admin
          sin configurar NextAuth/Sheets. Tocala ON → se habilita la card
          "Panel de administracion" arriba. OFF → desaparece. */}
      {isDemoModeClient() && (
        <div className="bg-bg-card border border-border-glass rounded-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-sm text-text-primary">
                Soy el dueño (demo)
              </p>
              <p className="text-[11px] text-text-muted mt-0.5 leading-snug">
                Activá esta perilla para desbloquear el panel de administración en modo demo.
                Simula tener <code className="text-accent-emerald">role: admin</code> sin configurar NextAuth/Sheets.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDemoAdmin(!isDemoAdminActive)}
              aria-pressed={isDemoAdminActive}
              aria-label={`${isDemoAdminActive ? "Desactivar" : "Activar"} modo admin demo`}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 mt-1 ${
                isDemoAdminActive ? "bg-accent-emerald" : "bg-gray-600"
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  isDemoAdminActive ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Acceso biometrico */}
      <BiometricActivation />

      {/* Referidos */}
      <ReferralSection />

    </div>
  );
}
