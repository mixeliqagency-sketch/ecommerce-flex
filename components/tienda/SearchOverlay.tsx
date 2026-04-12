"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { formatPrice } from "@/lib/utils";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [buscar, setBuscar] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cuando se abre el overlay, focus automatico en el input
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Buscar productos en tiempo real con debounce de 300ms
  useEffect(() => {
    if (!buscar.trim()) { setResultados([]); return; }
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

  // Cerrar overlay y limpiar estado al navegar a otra ruta
  useEffect(() => {
    onClose();
    setBuscar("");
    setResultados([]);
  }, [pathname]);

  // Limpiar estado interno cuando se cierra el overlay desde afuera
  useEffect(() => {
    if (!isOpen) {
      setBuscar("");
      setResultados([]);
    }
  }, [isOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (buscar.trim()) {
      router.push(`/productos?buscar=${encodeURIComponent(buscar.trim())}`);
      onClose();
      setBuscar("");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay de busqueda — se expande desde el top con animacion slide-down */}
      <div className="fixed inset-0 z-50" onClick={onClose}>
        {/* Fondo oscuro con blur */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Panel de busqueda */}
        <div
          className="absolute top-0 left-0 right-0 bg-bg-primary border-b border-border-glass shadow-2xl animate-slide-down"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-2xl mx-auto px-4 py-4">
            {/* Input grande con icono lupa y boton cerrar */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                aria-hidden="true"
              >
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
                onClick={onClose}
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
                    onClick={onClose}
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
                      {formatPrice(producto.precio)}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Sin resultados — solo aparece cuando hay mas de 2 caracteres */}
            {buscar.trim().length > 2 && resultados.length === 0 && (
              <p className="mt-4 text-center text-sm text-text-muted">No se encontraron productos</p>
            )}
          </div>
        </div>
      </div>

      {/* Estilos para la animacion slide-down del panel */}
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
