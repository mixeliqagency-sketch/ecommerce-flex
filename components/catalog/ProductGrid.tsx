"use client";

import ProductCard from "./ProductCard";
import { useAssistant } from "@/context/AssistantContext";
import { themeConfig } from "@/theme.config";
import type { Product } from "@/types";

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  searchQuery?: string;
}

export default function ProductGrid({ products, loading, searchQuery }: ProductGridProps) {
  const { openAssistant } = useAssistant();

  if (loading) {
    return (
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 min-[360px]:gap-3 md:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-bg-card rounded-card border border-border-glass overflow-hidden animate-pulse"
          >
            <div className="aspect-square bg-bg-secondary" />
            <div className="p-3 space-y-2">
              <div className="h-2 bg-bg-secondary rounded w-1/3" />
              <div className="h-3 bg-bg-secondary rounded w-full" />
              <div className="h-3 bg-bg-secondary rounded w-2/3" />
              <div className="h-4 bg-bg-secondary rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mx-auto text-text-muted mb-4"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
          <path d="M8 11h6" />
        </svg>
        <p className="text-text-secondary text-lg font-heading">
          No encontramos productos
        </p>
        <p className="text-text-muted text-sm mt-1 mb-4">
          Intenta con otra busqueda o categoria
        </p>
        {/* Derivar al asistente si hay una busqueda activa */}
        {searchQuery && (
          <button
            onClick={() => openAssistant(`Busque "${searchQuery}" pero no encontre nada. Me podes ayudar?`)}
            className="inline-flex items-center gap-2 bg-accent-emerald/10 hover:bg-accent-emerald/20 text-accent-emerald text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Preguntarle a {themeConfig.assistant.name}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 min-[360px]:gap-3 md:gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
