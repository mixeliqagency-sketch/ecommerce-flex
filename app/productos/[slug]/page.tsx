"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, calcDiscount, getBadgeClasses } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useReviews } from "@/context/ReviewsContext";
import StarRating from "@/components/reviews/StarRating";
import ReviewSection from "@/components/reviews/ReviewSection";
import { FaqSchema } from "@/components/seo/FaqSchema";
import { themeConfig } from "@/theme.config";
import { useIsAuthenticated } from "@/hooks/useIsAuthenticated";

const { product: productCopy } = themeConfig.copy;
import type { Product } from "@/types";

export default function ProductoDetallePage() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const { authenticated } = useIsAuthenticated();
  const router = useRouter();
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

  // FAQs dinamicas para schema.org FAQPage (rich snippet en Google)
  const faqs: { question: string; answer: string }[] = [];
  if (product.beneficios || product.descripcion) {
    faqs.push({
      question: `¿Para qué sirve ${product.nombre}?`,
      answer: product.beneficios || product.descripcion,
    });
  }
  if (product.dosis_recomendada) {
    faqs.push({
      question: `¿Cómo se toma ${product.nombre}?`,
      answer: product.dosis_recomendada,
    });
  }
  if (product.mejor_momento) {
    faqs.push({
      question: "¿Cuál es el mejor momento para tomarlo?",
      answer: product.mejor_momento,
    });
  }
  faqs.push({
    question: `¿Cuánto cuesta ${product.nombre}?`,
    answer: `El precio actual es $${product.precio.toLocaleString("es-AR")} con envío a todo el país.`,
  });

  const handleAddToCart = () => {
    if (!authenticated) {
      router.push(`/auth/login?callbackUrl=/productos/${slug}`);
      return;
    }
    addItem(product, cantidad, selectedVariante);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <FaqSchema items={faqs} />
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
              className={`absolute top-3 left-3 text-xs font-bold uppercase px-3 py-1 rounded-full ${getBadgeClasses(product.badge)}`}
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
                className="flex-1 bg-accent-orange text-white min-h-[48px] py-3 rounded-card font-semibold transition-all hover:brightness-125 hover:scale-[1.02] active:scale-[0.98]"
              >
                {productCopy.addToCart}
              </button>
            </div>
          )}

          {product.stock === 0 && product.tipo === "suplemento" && (
            <p className="text-accent-red font-semibold py-3">{productCopy.outOfStock}</p>
          )}


          {/* Stock */}
          {product.stock > 0 && product.stock <= 5 && (
            <p className="text-xs text-accent-yellow">
              Solo quedan {product.stock} unidades
            </p>
          )}
        </div>
      </div>

      {/* Preguntas frecuentes — acordeones con las FAQs del producto.
          El array `faqs` ya se construye para el JSON-LD (rich snippet en Google),
          pero ademas lo renderizamos visualmente para reducir friccion/objections
          del usuario antes de comprar. */}
      {faqs.length > 0 && (
        <section className="max-w-3xl mx-auto mt-10 mb-6">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-text-primary mb-4">
            Preguntas frecuentes
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="group bg-bg-card border border-border-glass rounded-card overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer list-none hover:bg-bg-secondary transition-colors">
                  <span className="font-semibold text-sm text-text-primary">{faq.question}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted group-open:rotate-180 transition-transform flex-shrink-0" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </summary>
                <div className="px-4 pb-4 pt-1 text-sm text-text-secondary leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Seccion de resenas */}
      <ReviewSection productSlug={product.slug} />
    </div>
  );
}
