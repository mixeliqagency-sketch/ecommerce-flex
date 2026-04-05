"use client";

import { useState, useEffect } from "react";

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const [local, setLocal] = useState(value);

  // Debounce: espera 400ms despues de que el usuario deja de tipear
  useEffect(() => {
    const timer = setTimeout(() => onChange(local), 400);
    return () => clearTimeout(timer);
  }, [local, onChange]);

  // Sincronizar si el padre cambia el valor (ej: limpiar filtros)
  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <div className="relative">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
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
        className="w-full pl-10 pr-4 py-2.5 bg-bg-card border border-border-glass rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-emerald focus:ring-2 focus:ring-accent-emerald/20 transition-colors"
      />
      {local && (
        <button
          onClick={() => { setLocal(""); onChange(""); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          aria-label="Limpiar busqueda"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
