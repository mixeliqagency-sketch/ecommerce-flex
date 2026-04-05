"use client";

import { useCart } from "@/context/CartContext";
import { formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/utils";
import CartItem from "./CartItem";
import CartCrossSell from "./CartCrossSell";
import Link from "next/link";

export default function CartDrawer() {
  const { items, isOpen, closeCart, subtotal } = useCart();
  const envioGratis = subtotal >= FREE_SHIPPING_THRESHOLD;
  const faltaParaEnvioGratis = FREE_SHIPPING_THRESHOLD - subtotal;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay oscuro */}
      <div className="fixed inset-0 bg-black/60 z-40 animate-fade-in" onClick={closeCart} />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className="fixed top-0 right-0 h-full w-full max-w-md bg-bg-secondary z-50 flex flex-col shadow-2xl animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center px-5 py-4 border-b border-border-glass">
          {/* Flecha atras para cerrar */}
          <button
            onClick={closeCart}
            className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
            aria-label="Cerrar carrito"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          {/* Titulo centrado */}
          <h2 className="flex-1 font-heading text-lg font-bold text-center">
            Tu carrito
          </h2>
          {/* Spacer para balancear la flecha */}
          <div className="w-[22px] flex-shrink-0" />
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-text-muted text-lg mb-2">
                Tu carrito esta vacio
              </p>
              <button
                onClick={closeCart}
                className="text-accent-emerald hover:underline text-sm"
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={`${item.product.id}-${item.variante || ""}`}
                item={item}
              />
            ))
          )}
        </div>

        {/* Cross-sell: Completa tu compra */}
        {items.length > 0 && <CartCrossSell />}

        {/* Footer con subtotal y boton pagar */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-border-glass space-y-3">
            {/* Barra envio gratis */}
            {!envioGratis && (
              <p className="text-xs text-text-secondary text-center">
                Agrega {formatPrice(faltaParaEnvioGratis)} mas para envio gratis
              </p>
            )}
            {envioGratis && (
              <p className="text-xs text-accent-emerald text-center font-semibold">
                Envio gratis incluido
              </p>
            )}

            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Subtotal</span>
              <span className="font-heading font-bold text-lg">
                {formatPrice(subtotal)}
              </span>
            </div>

            {/* Boton pagar */}
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full bg-accent-orange text-white text-center py-3 rounded-card font-semibold transition-all hover:brightness-125 hover:scale-[1.01] active:scale-[0.98]"
            >
              Ir a pagar
            </Link>
            <button
              onClick={closeCart}
              className="block w-full text-accent-emerald text-center py-2 text-sm hover:underline"
            >
              Seguir comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}
