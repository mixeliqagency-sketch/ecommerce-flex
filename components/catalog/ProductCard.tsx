"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatPrice, calcDiscount, calcInstallments } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useReviews } from "@/context/ReviewsContext";
import StarRating from "@/components/reviews/StarRating";
import ShareButton from "@/components/shared/ShareButton";
import { themeConfig } from "@/theme.config";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { summaries } = useReviews();
  const { status } = useSession();
  const router = useRouter();

  // Si no esta logueado, redirigir a login en vez de agregar al carrito
  const handleAddToCart = () => {
    if (status !== "authenticated") {
      router.push("/auth/login");
      return;
    }
    addItem(product);
  };
  const reviewSummary = summaries[product.slug];
  const descuento = calcDiscount(product.precio_anterior || 0, product.precio);
  const cuotas = calcInstallments(product.precio);

  return (
    <article className="group bg-bg-card rounded-card border border-border-glass overflow-hidden hover:border-accent-emerald/40 transition-all duration-300 flex flex-col">
      {/* Imagen */}
      <Link href={`/productos/${product.slug}`} className="block relative aspect-square overflow-hidden">
        {product.imagen_url ? (
          <Image
            src={product.imagen_url}
            alt={product.nombre}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-bg-secondary flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-text-muted">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}

        {/* Badge */}
        {product.badge && (
          <span
            className={`absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
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

        {/* Descuento */}
        {descuento > 0 && (
          <span className="absolute top-2 right-2 text-[10px] font-bold bg-accent-red text-white px-2 py-0.5 rounded-full">
            -{descuento}%
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="p-2 min-[360px]:p-3 flex flex-col flex-1">
        <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
          {product.marca}
        </p>

        {/* Estrellas de resenas */}
        {reviewSummary && reviewSummary.total > 0 && (
          <div className="mb-1">
            <StarRating
              rating={reviewSummary.promedio}
              size={12}
              count={reviewSummary.total}
            />
          </div>
        )}

        <Link href={`/productos/${product.slug}`}>
          <h3 className="font-heading font-semibold text-xs min-[360px]:text-sm leading-tight line-clamp-2 hover:text-accent-emerald transition-colors mb-1.5">
            {product.nombre}
          </h3>
        </Link>

        {/* Spacer que empuja precios y boton al fondo */}
        <div className="flex-1" />

        {/* Precio con tarjeta (tachado como referencia) */}
        <div className="mb-1">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xs text-text-muted line-through">
              {formatPrice(product.precio)}
            </span>
            <span className="text-[10px] text-text-muted">con tarjeta</span>
          </div>
          {/* Precio por transferencia (con 10% OFF) */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-heading font-bold text-sm min-[360px]:text-base text-accent-emerald">
              {formatPrice(Math.round(product.precio * 0.9))}
            </span>
            <span className="text-[10px] font-semibold text-accent-orange">10% OFF transferencia</span>
          </div>
        </div>

        {/* Cuotas */}
        {cuotas && product.tipo === "suplemento" && (
          <p className="text-[10px] text-text-muted mb-1.5">
            {cuotas.cantidad} cuotas de {formatPrice(cuotas.monto)}
          </p>
        )}

        {/* Boton agregar + compartir en la misma fila */}
        {product.tipo === "suplemento" && product.stock > 0 && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-accent-orange text-white text-xs font-semibold py-2 rounded-lg transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
            >
              Agregar al carrito
            </button>
            <ShareButton
              title={product.nombre}
              text={`Mira ${product.nombre} en ${themeConfig.brand.name}`}
              url={typeof window !== "undefined" ? `${window.location.origin}/productos/${product.slug}` : `/productos/${product.slug}`}
              variant="icon"
            />
          </div>
        )}

        {product.tipo === "suplemento" && product.stock === 0 && (
          <div className="flex gap-2 mt-2 items-center">
            <p className="text-xs text-accent-red font-medium flex-1 text-center">
              Sin stock
            </p>
            <ShareButton
              title={product.nombre}
              text={`Mira ${product.nombre} en ${themeConfig.brand.name}`}
              url={typeof window !== "undefined" ? `${window.location.origin}/productos/${product.slug}` : `/productos/${product.slug}`}
              variant="icon"
            />
          </div>
        )}

        {product.tipo === "accesorio" && (
          <div className="flex gap-2 mt-2">
            <Link
              href={`/productos/${product.slug}`}
              className="flex-1 bg-accent-emerald text-white text-xs font-semibold py-2 rounded-lg transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] text-center"
            >
              Ver detalle
            </Link>
            <ShareButton
              title={product.nombre}
              text={`Mira ${product.nombre} en ${themeConfig.brand.name}`}
              url={typeof window !== "undefined" ? `${window.location.origin}/productos/${product.slug}` : `/productos/${product.slug}`}
              variant="icon"
            />
          </div>
        )}
      </div>
    </article>
  );
}
