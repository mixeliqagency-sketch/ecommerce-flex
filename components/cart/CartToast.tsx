"use client";

import { useCart } from "@/context/CartContext";
import { themeConfig } from "@/theme.config";

const { toast: toastCopy } = themeConfig.copy;

// Toast flotante que aparece cuando se agrega un producto al carrito
export default function CartToast() {
  const { toastProduct, openCart, totalItems } = useCart();

  if (!toastProduct) return null;

  return (
    <div className="fixed top-20 right-4 z-[60] animate-slide-in-right max-w-sm w-full">
      <div className="bg-bg-card border border-accent-emerald/40 rounded-card p-4 shadow-xl shadow-black/30">
        <div className="flex items-center gap-3">
          {/* Icono check */}
          <div className="w-9 h-9 rounded-full bg-accent-emerald/20 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-emerald">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </div>

          {/* Texto */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {toastProduct.nombre}
            </p>
            <p className="text-xs text-accent-emerald">
              {toastCopy.addedToCart} ({totalItems} {totalItems === 1 ? toastCopy.itemSuffix : toastCopy.itemsSuffix})
            </p>
          </div>

          {/* Boton ver carrito */}
          <button
            onClick={openCart}
            className="text-xs font-semibold text-accent-emerald hover:text-white bg-accent-emerald/10 hover:bg-accent-emerald px-3 py-1.5 rounded-lg transition-all flex-shrink-0"
          >
            {toastCopy.viewButton}
          </button>
        </div>
      </div>
    </div>
  );
}
