"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { themeConfig } from "@/theme.config";

const NAV_LINKS = [
  { href: "/productos", label: "Tienda" },
];

export default function Header() {
  const { openCart, totalItems } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Estado del buscador expandible
  const [searchOpen, setSearchOpen] = useState(false);
  const [buscar, setBuscar] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Cuando se abre el buscador, focus automatico
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  // Buscar productos en tiempo real
  useEffect(() => {
    if (!buscar.trim()) { setResultados([]); return; }
    // Buscar en los productos cargados en la pagina
    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/productos?buscar=${encodeURIComponent(buscar.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResultados(Array.isArray(data) ? data.slice(0, 6) : []);
        }
      } catch { setResultados([]); }
    };
    const timeout = setTimeout(fetchResults, 300);
    return () => clearTimeout(timeout);
  }, [buscar]);

  // Cerrar buscador al navegar
  useEffect(() => {
    setSearchOpen(false);
    setBuscar("");
    setResultados([]);
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (buscar.trim()) {
      router.push(`/productos?buscar=${encodeURIComponent(buscar.trim())}`);
      setSearchOpen(false);
      setBuscar("");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 glass" style={{ borderBottom: "1px solid var(--border-decorative)" }}>
        <div className="max-w-7xl mx-auto px-3 min-[400px]:px-4 h-14 flex items-center gap-2 min-[400px]:gap-3 md:gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            {themeConfig.brand.useLogo ? (
              <img src={themeConfig.brand.logo} alt={themeConfig.brand.name} className="h-8 min-[400px]:h-10" />
            ) : (
              <span className="text-accent-emerald text-xl min-[400px]:text-2xl tracking-wider font-bold" style={{ fontFamily: "var(--font-heading)" }}>{themeConfig.brand.name}</span>
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

          {/* Lupa — abre el buscador */}
          <button
            onClick={() => setSearchOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-accent-emerald transition-colors flex-shrink-0"
            aria-label="Buscar productos"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>

          {/* Usuario */}
          <Link
            href={session ? "/cuenta" : "/auth/login"}
            className="w-10 h-10 flex items-center justify-center text-text-primary hover:text-accent-emerald transition-colors flex-shrink-0"
            aria-label={session ? "Mi cuenta" : "Iniciar sesion"}
          >
            {session ? (
              <>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-accent-emerald/50" />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-accent-emerald/30 border border-accent-emerald/50 flex items-center justify-center">
                    <span className="text-accent-emerald text-sm font-bold">
                      {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
              </>
            )}
          </Link>

          {/* Carrito */}
          <button
            onClick={openCart}
            className="w-10 h-10 flex items-center justify-center relative text-text-primary hover:text-accent-emerald transition-colors flex-shrink-0"
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

      {/* Overlay de busqueda — se expande desde el centro */}
      {searchOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setSearchOpen(false)}>
          {/* Fondo oscuro */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Panel de busqueda */}
          <div
            className="absolute top-0 left-0 right-0 bg-bg-primary border-b border-border-glass shadow-2xl animate-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-2xl mx-auto px-4 py-4">
              {/* Input grande */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-bg-card border border-border-glass text-text-primary text-lg placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-emerald/50"
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  aria-label="Cerrar busqueda"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </form>

              {/* Resultados en tiempo real */}
              {resultados.length > 0 && (
                <div className="mt-3 space-y-1">
                  {resultados.map((producto: any) => (
                    <Link
                      key={producto.slug}
                      href={`/productos/${producto.slug}`}
                      onClick={() => setSearchOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-bg-card transition-colors"
                    >
                      {producto.imagen_url && (
                        <img src={producto.imagen_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{producto.nombre}</p>
                        <p className="text-xs text-text-muted">{producto.categoria}</p>
                      </div>
                      <span className="text-sm font-bold text-accent-emerald flex-shrink-0">
                        ${producto.precio?.toLocaleString("es-AR")}
                      </span>
                    </Link>
                  ))}
                </div>
              )}

              {/* Sin resultados */}
              {buscar.trim().length > 2 && resultados.length === 0 && (
                <p className="mt-4 text-center text-sm text-text-muted">No se encontraron productos</p>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-down {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-down {
          animation: slide-down 0.25s ease-out;
        }
      `}</style>
    </>
  );
}
