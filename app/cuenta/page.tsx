"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ReferralSection } from "@/components/tienda/ReferralSection";

export default function CuentaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  if (status === "unauthenticated") { router.push("/auth/login"); return null; }
  if (status === "loading") {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><p className="text-text-secondary">Cargando...</p></div>;
  }

  const initial = session?.user?.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-5">
      <h1 className="font-heading text-2xl font-bold">Mi Cuenta</h1>

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
              {session?.user?.name || "Usuario"}
            </p>
            <p className="text-sm text-text-secondary truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Referidos */}
      <ReferralSection />

      {/* Cerrar sesion */}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full bg-bg-card border border-border-glass rounded-card p-4 text-accent-red hover:border-accent-red/40 transition-colors text-sm font-medium"
      >
        Cerrar sesion
      </button>
    </div>
  );
}
