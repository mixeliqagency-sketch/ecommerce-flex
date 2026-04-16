"use client";

import { useState } from "react";
import { formatPrice, FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_COST, calcSubtotal } from "@/lib/utils";
import type { CartItem } from "@/types";

interface CartSummaryProps {
  items: CartItem[];
  descuento?: number;
  labelDescuento?: string;
  // Cupón: si se pasa onCouponApplied, se muestra el input de código
  showCouponInput?: boolean;
  onCouponApplied?: (coupon: { codigo: string; descuento_porcentaje: number } | null) => void;
}

export default function CartSummary({
  items,
  descuento = 0,
  labelDescuento,
  showCouponInput = false,
  onCouponApplied,
}: CartSummaryProps) {
  const subtotal = calcSubtotal(items);
  const envioGratis = subtotal >= FREE_SHIPPING_THRESHOLD;
  const envio = envioGratis ? 0 : FLAT_SHIPPING_COST;
  const total = subtotal - descuento + envio;

  // Estado del cupón
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ codigo: string; descuento_porcentaje: number } | null>(null);

  async function handleApplyCoupon() {
    if (!couponCode.trim() || couponLoading) return;
    setCouponLoading(true);
    setCouponError("");

    try {
      const res = await fetch("/api/cupones/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: couponCode.trim().toUpperCase() }),
      });
      const data = await res.json();

      if (data.valid) {
        setAppliedCoupon({ codigo: data.codigo, descuento_porcentaje: data.descuento_porcentaje });
        onCouponApplied?.({ codigo: data.codigo, descuento_porcentaje: data.descuento_porcentaje });
      } else {
        setCouponError(data.error || "Cupón inválido");
        setAppliedCoupon(null);
        onCouponApplied?.(null);
      }
    } catch {
      setCouponError("Error al validar el cupón");
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
    onCouponApplied?.(null);
  }

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

      {/* Input de cupón */}
      {showCouponInput && !appliedCoupon && (
        <div className="border-t border-border-glass pt-3">
          <label className="text-xs text-text-muted mb-1.5 block">Código de descuento</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setCouponError("");
              }}
              placeholder="ANDAX10"
              className="flex-1 bg-bg-primary border border-border-glass rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-emerald transition-colors uppercase tracking-wider"
              maxLength={50}
              onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={!couponCode.trim() || couponLoading}
              className="bg-accent-emerald hover:bg-accent-emerald/80 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {couponLoading ? "..." : "Aplicar"}
            </button>
          </div>
          {couponError && (
            <p className="text-xs text-red-400 mt-1.5">{couponError}</p>
          )}
        </div>
      )}

      {/* Cupón aplicado */}
      {showCouponInput && appliedCoupon && (
        <div className="border-t border-border-glass pt-3">
          <div className="flex items-center justify-between bg-accent-emerald/10 border border-accent-emerald/20 rounded-lg px-3 py-2">
            <div>
              <span className="text-xs text-accent-emerald font-semibold tracking-wider">{appliedCoupon.codigo}</span>
              <span className="text-xs text-text-muted ml-2">{appliedCoupon.descuento_porcentaje}% OFF</span>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-text-muted hover:text-red-400 transition-colors p-1"
              aria-label="Quitar cupón"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

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
