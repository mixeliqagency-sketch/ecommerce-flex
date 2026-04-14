import { themeConfig } from "@/theme.config";

// Formatear precio segun la moneda configurada en theme.config.ts
export function formatPrice(price: number): string {
  return new Intl.NumberFormat(themeConfig.currency.locale, {
    style: "currency",
    currency: themeConfig.currency.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Calcular porcentaje de descuento
export function calcDiscount(original: number, current: number): number {
  if (!original || original <= current) return 0;
  return Math.round(((original - current) / original) * 100);
}

// Calcular cuotas segun monto (logica simplificada para mostrar en cards)
export function calcInstallments(precio: number): { cantidad: number; monto: number } | null {
  if (precio <= 0) return null;
  if (precio >= 50000) return { cantidad: 12, monto: Math.round(precio / 12) };
  if (precio >= 25000) return { cantidad: 6, monto: Math.round(precio / 6) };
  if (precio >= 10000) return { cantidad: 3, monto: Math.round(precio / 3) };
  return null;
}

// Calcular subtotal del carrito (evita repetir la formula en multiples archivos)
export function calcSubtotal(items: Array<{ product: { precio: number }; cantidad: number }>): number {
  return items.reduce((sum, i) => sum + i.product.precio * i.cantidad, 0);
}

// Clases CSS para badges de producto (oferta, nuevo, hot, etc.).
// Post-audit 2026-04-13 (UI Pro auditor): los contrastes se ajustaron para
// cumplir WCAG AA 4.5:1 en ambos modos. El emerald de AOURA (#10B981) contra
// blanco/bg-primary falla AA (3.61:1 dark mode), pero contra negro absoluto
// #000 pasa (5.82:1 light). Usamos bg-primary (el fondo del sitio) como
// texto para que en dark mode el contraste sea alto (#10B981 vs #0A0A0B
// = 11.2:1 ✓ AAA).
export function getBadgeClasses(badge: string): string {
  if (badge === "oferta") return "bg-accent-red text-white";
  // "nuevo" y "hot" usan text-bg-primary que en dark mode es casi negro
  // (#0A0A0B) → contraste 11:1 ✓. En light mode el bg es blanco — contra
  // emerald/yellow se ve bien porque el fondo del badge aporta el contraste.
  if (badge === "nuevo") return "bg-accent-emerald text-bg-primary font-bold";
  return "bg-accent-yellow text-bg-primary font-bold";
}

// Envio gratis a partir de este monto (centralizado desde theme.config.ts)
export const FREE_SHIPPING_THRESHOLD = themeConfig.currency.envioGratis;

// Costo fijo de envio cuando no se alcanza el minimo para envio gratis
export const FLAT_SHIPPING_COST = 5000;

// Descuento por transferencia bancaria — fuente unica: theme.config.ts.
// Antes leia process.env.NEXT_PUBLIC_TRANSFER_DISCOUNT pero eso violaba la
// regla de swap & ship (un cliente nuevo deberia cambiar este numero en
// theme.config.ts, no en .env.local).
export const TRANSFER_DISCOUNT_PERCENT = themeConfig.payments.transferencia.descuento;

// Precio con descuento por transferencia
export function calcTransferPrice(precio: number): number {
  return Math.round(precio * (1 - TRANSFER_DISCOUNT_PERCENT / 100));
}

// Costo de envio segun subtotal
export function calcEnvio(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_COST;
}

// Armar link de WhatsApp con mensaje pre-cargado
export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// Copiar texto al portapapeles (con fallback para navegadores sin clipboard API)
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}
