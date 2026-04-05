"use client";

import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/types";

export default function CartItem({ item }: { item: CartItemType }) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <div className="flex gap-3 py-3 border-b border-border-glass items-center">
      {/* Imagen */}
      <div className="w-16 h-16 rounded-xl bg-bg-card flex-shrink-0 overflow-hidden">
        {item.product.imagen_url && (
          <img
            src={item.product.imagen_url}
            alt={item.product.nombre}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">
          {item.product.nombre}
        </p>
        {item.variante && (
          <p className="text-xs text-text-muted">{item.variante}</p>
        )}
        <p className="text-sm font-bold text-accent-emerald mt-1">
          {formatPrice(item.product.precio)}
        </p>
      </div>

      {/* Controles de cantidad */}
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={() => removeItem(item.product.id, item.variante)}
          className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-accent-red transition-colors"
          aria-label={`Eliminar ${item.product.nombre} del carrito`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="flex items-center gap-0 bg-bg-card rounded-xl border border-border-glass" role="group" aria-label={`Cantidad de ${item.product.nombre}`}>
          <button
            onClick={() =>
              updateQuantity(item.product.id, item.cantidad - 1, item.variante)
            }
            className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-text-primary text-lg font-bold active:scale-90 transition-all"
            aria-label="Reducir cantidad"
          >
            -
          </button>
          <span className="text-sm font-semibold text-text-primary w-6 text-center" aria-live="polite">
            {item.cantidad}
          </span>
          <button
            onClick={() =>
              updateQuantity(item.product.id, item.cantidad + 1, item.variante)
            }
            className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-text-primary text-lg font-bold active:scale-90 transition-all"
            aria-label="Aumentar cantidad"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
