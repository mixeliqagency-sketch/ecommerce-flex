"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { themeConfig } from "@/theme.config";
import { isDemoModeClient, DEMO_PRODUCTS } from "@/lib/demo-data";
import type { Product } from "@/types";

const { cart: cartCopy } = themeConfig.copy;
const CACHE_KEY = "ecomflex_all_products";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

// Mapa de categorias complementarias (si tiene X, sugerir Y)
const COMPLEMENTOS: Record<string, string[]> = {
  proteinas: ["creatina", "colageno", "adaptogenos"],
  creatina: ["proteinas", "adaptogenos", "superfoods"],
  colageno: ["proteinas", "superfoods", "adaptogenos"],
  adaptogenos: ["proteinas", "creatina", "superfoods"],
  superfoods: ["proteinas", "adaptogenos", "colageno"],
  deportivo: ["wellness", "belleza"],
  wellness: ["deportivo", "belleza"],
  belleza: ["wellness", "deportivo"],
};

// Filtrado puro de sugerencias — no toca DOM ni hace I/O.
// Se comparte entre el shortcut DEMO y el fetch en produccion.
function computeSuggestions(allProducts: Product[], cartItems: { product: Product }[]): Product[] {
  const cartIds = new Set(cartItems.map((i) => i.product.id));
  const cartCategorias = Array.from(new Set(cartItems.map((i) => i.product.categoria)));

  const targetCategorias = new Set<string>();
  for (const cat of cartCategorias) {
    const complementos = COMPLEMENTOS[cat] || [];
    for (const c of complementos) {
      if (!cartCategorias.includes(c)) targetCategorias.add(c);
    }
  }

  let sugeridos = allProducts.filter(
    (p) =>
      !cartIds.has(p.id) &&
      p.tipo === "suplemento" &&
      p.stock > 0 &&
      targetCategorias.has(p.categoria),
  );

  if (sugeridos.length === 0) {
    sugeridos = allProducts.filter(
      (p) => !cartIds.has(p.id) && p.tipo === "suplemento" && p.stock > 0,
    );
  }

  sugeridos.sort((a, b) => {
    if (a.badge === "oferta" && b.badge !== "oferta") return -1;
    if (b.badge === "oferta" && a.badge !== "oferta") return 1;
    return 0;
  });

  return sugeridos.slice(0, 3);
}

// Lee productos cacheados de sessionStorage si no pasaron mas de CACHE_TTL_MS.
// Esto es critico porque CartCrossSell se monta/desmonta cada vez que se abre
// el drawer — sin cache cada apertura hace un fetch de red y la seccion
// "Completa tu compra" se demora en aparecer, matando la oportunidad de upsell.
function readCache(): Product[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw) as { ts: number; data: Product[] };
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data: Product[]): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // sessionStorage lleno o denegado — seguimos sin cache, degrada a fetch en cada abrir
  }
}

export default function CartCrossSell() {
  const { items, addItem } = useCart();
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  // Dependencia estable: solo recalcular cuando cambian los productos del
  // carrito (no las cantidades, no el isOpen).
  const itemSlugs = items.map((i) => i.product.slug).sort().join(",");

  useEffect(() => {
    if (items.length === 0) {
      setSuggestions([]);
      return;
    }

    // SHORTCUT DEMO_MODE: usamos DEMO_PRODUCTS directamente, sin fetch ni
    // sessionStorage. El render es sincronico — "Completa tu compra" aparece
    // en el primer paint del drawer.
    if (isDemoModeClient()) {
      setSuggestions(computeSuggestions(DEMO_PRODUCTS, items));
      return;
    }

    // PRODUCCION: primero intentamos cache en sessionStorage (hit = sync, sin
    // loading state visible). Solo hacemos network si el cache esta frio.
    const cached = readCache();
    if (cached) {
      setSuggestions(computeSuggestions(cached, items));
      return;
    }

    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/productos", { signal: ac.signal });
        if (!res.ok) return;
        const allProducts: Product[] = await res.json();
        writeCache(allProducts);
        if (!ac.signal.aborted) {
          setSuggestions(computeSuggestions(allProducts, items));
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error("[cross-sell]", err);
        setSuggestions([]);
      }
    })();
    return () => ac.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemSlugs]);

  if (suggestions.length === 0) return null;

  return (
    <div className="px-5 py-3 border-t border-border-glass">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2.5">
        {cartCopy.completePurchase}
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
