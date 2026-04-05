"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types";

// Mapa de categorias complementarias (si tiene X, sugerir Y)
const COMPLEMENTOS: Record<string, string[]> = {
  proteinas: ["creatina", "colageno", "adaptogenos"],
  creatina: ["proteinas", "adaptogenos", "superfoods"],
  colageno: ["proteinas", "superfoods", "adaptogenos"],
  adaptogenos: ["proteinas", "creatina", "superfoods"],
  superfoods: ["proteinas", "adaptogenos", "colageno"],
};

export default function CartCrossSell() {
  const { items, addItem } = useCart();
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await fetch("/api/productos");
        const allProducts: Product[] = await res.json();

        // IDs de productos ya en el carrito
        const cartIds = new Set(items.map((i) => i.product.id));

        // Categorias en el carrito
        const cartCategorias = Array.from(new Set(items.map((i) => i.product.categoria)));

        // Encontrar categorias complementarias
        const targetCategorias = new Set<string>();
        for (const cat of cartCategorias) {
          const complementos = COMPLEMENTOS[cat] || [];
          for (const c of complementos) {
            if (!cartCategorias.includes(c)) {
              targetCategorias.add(c);
            }
          }
        }

        // Filtrar productos sugeridos
        let sugeridos = allProducts.filter(
          (p) =>
            !cartIds.has(p.id) &&
            p.tipo === "suplemento" &&
            p.stock > 0 &&
            targetCategorias.has(p.categoria)
        );

        // Si no hay complementarios, sugerir de la misma categoria
        if (sugeridos.length === 0) {
          sugeridos = allProducts.filter(
            (p) =>
              !cartIds.has(p.id) &&
              p.tipo === "suplemento" &&
              p.stock > 0
          );
        }

        // Maximo 3 sugerencias, priorizando ofertas
        sugeridos.sort((a, b) => {
          if (a.badge === "oferta" && b.badge !== "oferta") return -1;
          if (b.badge === "oferta" && a.badge !== "oferta") return 1;
          return 0;
        });

        setSuggestions(sugeridos.slice(0, 3));
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [items]);

  if (loading || suggestions.length === 0) return null;

  return (
    <div className="px-5 py-3 border-t border-border-glass">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
        Completa tu compra
      </p>
      <div className="space-y-2">
        {suggestions.map((product) => (
          <div
            key={product.id}
            className="flex items-center gap-3 bg-bg-card rounded-lg border border-border-glass p-2.5"
          >
            {/* Imagen mini */}
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-bg-secondary">
              {product.imagen_url ? (
                <Image
                  src={product.imagen_url}
                  alt={product.nombre}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-text-muted">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium line-clamp-1">{product.nombre}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-accent-emerald">
                  {formatPrice(product.precio)}
                </span>
                {product.precio_anterior && product.precio_anterior > product.precio && (
                  <span className="text-[10px] text-text-muted line-through">
                    {formatPrice(product.precio_anterior)}
                  </span>
                )}
              </div>
            </div>

            {/* Boton agregar */}
            <button
              onClick={() => addItem(product)}
              className="flex-shrink-0 bg-accent-orange/10 hover:bg-accent-orange text-accent-orange hover:text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all hover:scale-[1.05] active:scale-[0.95]"
            >
              + Agregar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
