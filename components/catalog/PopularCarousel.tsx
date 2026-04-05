"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types";

interface PopularCarouselProps {
  products: Product[];
}

export default function PopularCarousel({ products }: PopularCarouselProps) {
  const { addItem } = useCart();
  const { status } = useSession();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Drag scroll state
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, scrollLeft: 0 });

  // Seleccionar los mas populares: badge "hot" o con mayor descuento
  const popular = products
    .filter((p) => p.tipo === "suplemento" && p.stock > 0)
    .sort((a, b) => {
      // Priorizar badge "hot"
      if (a.badge === "hot" && b.badge !== "hot") return -1;
      if (b.badge === "hot" && a.badge !== "hot") return 1;
      // Luego por descuento
      const descA = a.precio_anterior ? a.precio_anterior - a.precio : 0;
      const descB = b.precio_anterior ? b.precio_anterior - b.precio : 0;
      return descB - descA;
    })
    .slice(0, 8);

  // Mouse drag handlers (desktop)
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.pageX,
      scrollLeft: scrollRef.current.scrollLeft,
    };
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !scrollRef.current) return;
      e.preventDefault();
      const dx = e.pageX - dragStart.current.x;
      scrollRef.current.scrollLeft = dragStart.current.scrollLeft - dx;
    },
    [isDragging]
  );

  const onMouseUp = useCallback(() => setIsDragging(false), []);

  if (popular.length < 3) return null;

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-bold text-base italic text-text-primary">
          Lo que mas pedis
        </h2>
      </div>

      {/* Carrusel horizontal — solo se mueve por arrastre */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide select-none pr-8"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {popular.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-[130px] bg-bg-card border border-border-glass rounded-xl overflow-hidden cursor-pointer hover:border-accent-emerald/40 transition-colors"
              onClick={() => { if (!isDragging) router.push(`/productos/${product.slug}`); }}
            >
            {/* Imagen */}
            <div className="relative aspect-square bg-bg-secondary">
              {product.imagen_url ? (
                <Image
                  src={product.imagen_url}
                  alt={product.nombre}
                  fill
                  sizes="130px"
                  className="object-cover"
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-text-muted">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
              {/* Boton + para agregar */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (status !== "authenticated") {
                    router.push("/auth/login");
                    return;
                  }
                  addItem(product);
                }}
                className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-accent-emerald text-white flex items-center justify-center shadow-lg hover:brightness-125 active:scale-90 transition-all"
                aria-label={`Agregar ${product.nombre}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              {/* Badge descuento */}
              {product.precio_anterior && product.precio_anterior > product.precio && (
                <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-accent-red text-white px-1.5 py-0.5 rounded-full">
                  -{Math.round(((product.precio_anterior - product.precio) / product.precio_anterior) * 100)}%
                </span>
              )}
            </div>

            {/* Info */}
            <div className="p-2">
              <p className="font-heading font-bold text-sm text-accent-emerald leading-tight">
                {formatPrice(product.precio)}
              </p>
              {product.precio_anterior && product.precio_anterior > product.precio && (
                <p className="text-[10px] text-text-muted line-through">
                  {formatPrice(product.precio_anterior)}
                </p>
              )}
              <p className="text-[11px] text-text-primary leading-tight mt-1 line-clamp-2">
                {product.nombre}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">
                {product.marca}
              </p>
            </div>
          </div>
        ))}
        </div>
        {/* Gradiente indicador de scroll a la derecha */}
        <div className="pointer-events-none absolute top-0 right-0 w-10 h-full bg-gradient-to-l from-bg-primary to-transparent" />
      </div>
    </div>
  );
}
