"use client";

import { useCart } from "@/context/CartContext";
import { formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/utils";
import CartItem from "./CartItem";
import CartCrossSell from "./CartCrossSell";
import Link from "next/link";
import { themeConfig } from "@/theme.config";

const { cart: cartCopy } = themeConfig.copy;

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
            {cartCopy.title}
          </h2>
          {/* Spacer para balancear la flecha */}
          <div className="w-[22px] flex-shrink-0" />
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              {/* Icono carrito vacio — visual hierarchy primero */}
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted/40 mb-4" aria-hidden="true">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
              </svg>
              <p className="text-text-primary text-base font-semibold mb-1">
                {cartCopy.empty}
              </p>
              <p className="text-text-muted text-xs mb-5 max-w-[240px]">
                {cartCopy.emptyDescription}
              </p>
              <Link
                href="/productos"
                onClick={closeCart}
                className="inline-flex items-center gap-2 bg-accent-orange text-white px-6 py-3 rounded-card font-semibold text-sm transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
              >
                {cartCopy.emptyCta}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
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
            {/* Barra envio gratis — progress bar visual para gamificar AOV.
                REGLA MARKETING: ver el progreso hacia el beneficio (envio gratis)
                aumenta Average Order Value 15-30% vs solo texto. */}
            {!envioGratis && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">
                    {cartCopy.freeShippingMessage.replace("{amount}", formatPrice(faltaParaEnvioGratis))}
                  </span>
                  <span className="text-text-muted font-mono">
                    {Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))}%
                  </span>
                </div>
                <div className="h-1.5 bg-bg-card rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-emerald to-accent-orange transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                    role="progressbar"
                    aria-valuenow={Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100))}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Progreso hacia envio gratis"
                  />
                </div>
              </div>
            )}
            {envioGratis && (
              <div className="flex items-center justify-center gap-2 text-xs text-accent-emerald font-semibold bg-accent-emerald/10 rounded-lg py-2 px-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                {cartCopy.freeShippingIncluded}
              </div>
            )}

            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">{cartCopy.subtotal}</span>
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
              {cartCopy.checkout}
            </Link>
            <button
              onClick={closeCart}
              className="block w-full text-accent-emerald text-center py-2 text-sm hover:underline"
            >
              {cartCopy.continueShopping}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
