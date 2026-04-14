"use client";

import { useState, useEffect, useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const [local, setLocal] = useState(value);
  const isFirstRender = useRef(true);

  // Debounce: espera 400ms despues de que el usuario deja de tipear.
  // Skipea el primer render para no disparar onChange con el valor inicial.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => onChange(local), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  // Sincronizar si el padre cambia el valor (ej: limpiar filtros)
  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    // Buscador destacado de la tienda — es el CTA principal de /productos.
    // Estilo prominente con border emerald + glow permanente porque la lupa
    // del Header esta oculta en /productos, asi que este tiene que ser
    // inconfundible como punto de entrada al filtrado.
    <div className="relative">
      {/* Halo emerald detras del input para darle peso visual */}
      <div
        className="absolute inset-0 rounded-xl bg-accent-emerald/10 blur-xl -z-10 pointer-events-none"
        aria-hidden="true"
      />
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-emerald"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        type="text"
        placeholder="Buscar productos..."
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        aria-label="Buscar productos"
        className="w-full pl-12 pr-12 py-3.5 bg-bg-card border-2 border-accent-emerald/40 rounded-xl text-base text-text-primary placeholder-text-muted/70 font-medium shadow-[0_0_20px_rgba(16,185,129,0.15)] focus:outline-none focus:border-accent-emerald focus:ring-4 focus:ring-accent-emerald/20 focus:shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:border-accent-emerald/70 transition-all duration-300"
      />
      {local && (
        <button
          onClick={() => { setLocal(""); onChange(""); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent-emerald transition-colors p-1"
          aria-label="Limpiar busqueda"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
