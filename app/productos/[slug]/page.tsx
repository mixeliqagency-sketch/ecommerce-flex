"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, calcDiscount } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useReviews } from "@/context/ReviewsContext";
import StarRating from "@/components/reviews/StarRating";
import ReviewSection from "@/components/reviews/ReviewSection";
import type { Product } from "@/types";

export default function ProductoDetallePage() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedVariante, setSelectedVariante] = useState<string | undefined>();
  const [cantidad, setCantidad] = useState(1);
  const { summaries } = useReviews();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/productos/${slug}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setProduct(data);
        if (data.variantes?.length) setSelectedVariante(data.variantes[0]);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-bg-card rounded-card" />
          <div className="space-y-4">
            <div className="h-4 bg-bg-card rounded w-1/4" />
            <div className="h-8 bg-bg-card rounded w-3/4" />
            <div className="h-6 bg-bg-card rounded w-1/3" />
            <div className="h-20 bg-bg-card rounded" />
            <div className="h-12 bg-bg-card rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-text-secondary text-lg mb-4">Producto no encontrado</p>
        <Link href="/productos" className="text-accent-emerald hover:underline">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  const descuento = calcDiscount(product.precio_anterior || 0, product.precio);

  const handleAddToCart = () => {
    addItem(product, cantidad, selectedVariante);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-text-muted mb-6">
        <Link href="/" className="hover:text-text-secondary">Inicio</Link>
        <span>/</span>
        <Link href="/productos" className="hover:text-text-secondary">Tienda</Link>
        <span>/</span>
        <span className="text-text-secondary">{product.nombre}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Imagen */}
        <div className="relative aspect-square bg-bg-card rounded-card overflow-hidden border border-border-glass">
          {product.imagen_url ? (
            <Image
              src={product.imagen_url}
              alt={product.nombre}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-text-muted">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}

          {/* Badge */}
          {product.badge && (
            <span
              className={`absolute top-3 left-3 text-xs font-bold uppercase px-3 py-1 rounded-full ${
                product.badge === "oferta"
                  ? "bg-accent-red text-white"
                  : product.badge === "nuevo"
                  ? "bg-accent-emerald text-black"
                  : "bg-accent-yellow text-black"
              }`}
            >
              {product.badge}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <p className="text-xs text-text-muted uppercase tracking-wider">
            {product.marca} · {product.categoria}
          </p>

          <h1 className="font-heading text-2xl md:text-3xl font-bold">
            {product.nombre}
          </h1>

          {/* Estrellas resumen */}
          {summaries[product.slug] && summaries[product.slug].total > 0 && (
            <div className="flex items-center gap-2">
              <StarRating
                rating={summaries[product.slug].promedio}
                size={16}
                showNumber
                count={summaries[product.slug].total}
              />
            </div>
          )}

          {/* Precios */}
          <div className="flex items-end gap-3">
            <span className="font-heading text-3xl font-bold text-accent-emerald">
              {formatPrice(product.precio)}
            </span>
            {product.precio_anterior && product.precio_anterior > product.precio && (
              <>
                <span className="text-lg text-text-muted line-through">
                  {formatPrice(product.precio_anterior)}
                </span>
                <span className="text-sm font-bold text-accent-red">
                  -{descuento}%
                </span>
              </>
            )}
          </div>

          {/* Descripcion */}
          <p className="text-text-secondary leading-relaxed">
            {product.descripcion}
          </p>

          {/* Variantes */}
          {product.variantes && product.variantes.length > 0 && (
            <div>
              <p className="text-xs text-text-muted mb-2">Variante</p>
              <div className="flex gap-2 flex-wrap">
                {product.variantes.map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVariante(v)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      selectedVariante === v
                        ? "border-accent-emerald bg-accent-emerald/10 text-accent-emerald"
                        : "border-border-glass text-text-secondary hover:border-accent-emerald/40"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cantidad + Agregar */}
          {product.tipo === "suplemento" && product.stock > 0 && (
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center border border-border-glass rounded-lg" role="group" aria-label="Seleccionar cantidad">
                <button
                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  className="px-3 py-2 text-text-secondary hover:text-text-primary active:scale-90 transition-transform"
                  aria-label="Reducir cantidad"
                >
                  -
                </button>
                <span className="px-3 py-2 text-sm font-medium min-w-[2rem] text-center" aria-live="polite" aria-label={`Cantidad: ${cantidad}`}>
                  {cantidad}
                </span>
                <button
                  onClick={() => setCantidad(Math.min(product.stock, cantidad + 1))}
                  className="px-3 py-2 text-text-secondary hover:text-text-primary active:scale-90 transition-transform"
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 bg-accent-orange text-white py-3 rounded-card font-semibold transition-all hover:brightness-125 hover:scale-[1.02] active:scale-[0.98]"
              >
                Agregar al carrito
              </button>
            </div>
          )}

          {product.stock === 0 && product.tipo === "suplemento" && (
            <p className="text-accent-red font-semibold py-3">Sin stock</p>
          )}


          {/* Stock */}
          {product.stock > 0 && product.stock <= 5 && (
            <p className="text-xs text-accent-yellow">
              Solo quedan {product.stock} unidades
            </p>
          )}
        </div>
      </div>

      {/* Seccion de resenas */}
      <ReviewSection productSlug={product.slug} />
    </div>
  );
}
