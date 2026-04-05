"use client";

import { formatPrice, FREE_SHIPPING_THRESHOLD } from "@/lib/utils";
import type { CartItem } from "@/types";

const FLAT_SHIPPING = 5000;

interface CartSummaryProps {
  items: CartItem[];
  descuento?: number;
  labelDescuento?: string;
}

export default function CartSummary({ items, descuento = 0, labelDescuento }: CartSummaryProps) {
  const subtotal = items.reduce(
    (sum, i) => sum + i.product.precio * i.cantidad,
    0
  );
  const envioGratis = subtotal >= FREE_SHIPPING_THRESHOLD;
  const envio = envioGratis ? 0 : FLAT_SHIPPING;
  const total = subtotal - descuento + envio;

  return (
    <div className="space-y-3 bg-bg-card rounded-card p-5">
      <h3 className="font-heading font-bold text-lg">Resumen</h3>

      {/* Lista de items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={`${item.product.id}-${item.variante || ""}`}
            className="flex justify-between text-sm"
          >
            <span className="text-text-secondary truncate mr-2">
              {item.product.nombre}
              {item.variante && ` (${item.variante})`} x{item.cantidad}
            </span>
            <span className="text-text-primary font-medium whitespace-nowrap">
              {formatPrice(item.product.precio * item.cantidad)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-border-glass pt-3 space-y-2">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Subtotal</span>
          <span className="text-text-primary">{formatPrice(subtotal)}</span>
        </div>

        {/* Descuento (solo si aplica) */}
        {descuento > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-accent-emerald">{labelDescuento || "Descuento"}</span>
            <span className="text-accent-emerald font-medium whitespace-nowrap">- {formatPrice(descuento)}</span>
          </div>
        )}

        {/* Envio */}
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Envio</span>
          <span
            className={envioGratis ? "text-accent-emerald font-semibold" : "text-text-primary"}
          >
            {envioGratis ? "Gratis" : formatPrice(envio)}
          </span>
        </div>

        {/* Total */}
        <div className="flex justify-between border-t border-border-glass pt-3">
          <div>
            <span className="font-heading font-bold text-lg">Total</span>
            <p className="text-[10px] text-text-muted">IVA incluido</p>
          </div>
          <span className="font-heading font-bold text-lg text-accent-emerald">
            {formatPrice(total)}
          </span>
        </div>
      </div>
    </div>
  );
}
