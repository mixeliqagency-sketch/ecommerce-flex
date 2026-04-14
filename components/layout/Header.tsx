"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useIsAuthenticated } from "@/hooks/useIsAuthenticated";
import { useCart } from "@/context/CartContext";
import { themeConfig } from "@/theme.config";
import SearchOverlay from "@/components/tienda/SearchOverlay";
import { UserIcon } from "@/components/shared/Icons";
import BrandWordmark from "@/components/layout/BrandWordmark";

const NAV_LINKS = [
  { href: "/productos", label: "Tus Productos" },
];

export default function Header() {
  const { openCart, totalItems } = useCart();
  // Hook unificado: en prod devuelve NextAuth, en DEMO_MODE lee la session fake
  // de localStorage. Sin esto, el boton de perfil no sabe que el user logueo
  // por Google en demo y lo manda devuelta a /auth/login en loop.
  const { authenticated: session } = useIsAuthenticated();
  const router = useRouter();
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Estado del buscador expandible — el resto del estado vive en SearchOverlay
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("shop_avatar");
      if (saved) setAvatarUrl(saved);
    } catch {}
    const handler = () => {
      try { setAvatarUrl(localStorage.getItem("shop_avatar")); } catch {}
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 glass" style={{ borderBottom: "1px solid var(--border-decorative)" }}>
        <div className="max-w-7xl mx-auto px-3 min-[400px]:px-4 h-14 flex items-center gap-2 min-[400px]:gap-3 md:gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            {themeConfig.brand.useLogo ? (
              <img src={themeConfig.brand.logo} alt={themeConfig.brand.name} className="h-8 min-[400px]:h-10" />
            ) : (
              <BrandWordmark className="text-xl min-[400px]:text-2xl" />
            )}
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-6 flex-shrink-0" aria-label="Navegacion principal">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`text-sm transition-colors ${active ? "text-accent-emerald font-semibold" : "text-text-secondary hover:text-text-primary"}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Espaciador */}
          <div className="flex-1" />

          {/* Grupo de iconos: lupa + perfil + carrito — gap uniforme */}
          <div className="flex items-center gap-1">

          {/* Lupa — abre el buscador. Oculta en /productos y /productos/[slug]
              porque la tienda tiene su propio buscador principal mas prominente
              (evita duplicar funcionalidad y confundir al usuario). */}
          {!pathname.startsWith("/productos") && (
            <button
              onClick={() => setSearchOpen(true)}
              className="w-11 h-11 flex items-center justify-center text-text-secondary hover:text-accent-emerald transition-colors flex-shrink-0"
              aria-label="Buscar productos"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          )}

          {/* Usuario */}
          <Link
            href={session ? "/cuenta" : "/auth/login"}
            className="w-11 h-11 flex items-center justify-center text-text-primary hover:text-accent-emerald transition-colors flex-shrink-0"
            aria-label={session ? "Mi cuenta" : "Iniciar sesion"}
          >
            {session ? (
              <>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-accent-emerald/50" />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-accent-emerald/30 border border-accent-emerald/50 flex items-center justify-center">
                    <span className="text-accent-emerald text-sm font-bold">
                      U
                    </span>
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <UserIcon className="w-4 h-4" />
                </span>
              </>
            )}
          </Link>

          {/* Carrito */}
          <button
            onClick={openCart}
            className="w-11 h-11 flex items-center justify-center relative text-text-primary hover:text-accent-emerald transition-colors flex-shrink-0"
            aria-label={totalItems > 0 ? `Carrito con ${totalItems} productos` : "Carrito vacio"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-accent-red text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center" aria-hidden="true">
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </button>

          </div>{/* Fin grupo iconos */}
        </div>
      </header>

      {/* Overlay de busqueda — componente independiente */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
