// components/layout/PaymentBadges.tsx
// Badges de medios de pago — portado PIXEL-PERFECT del Footer de AOURA v1
// (ver aura/components/layout/Footer.tsx lineas 139-191).
//
// Layout AOURA: los badges y el texto informativo viven en UNA MISMA FILA con
// flex-wrap. Cada badge tiene el MISMO alto (h-8) pero ancho variable segun el
// contenido (Visa mas angosta, Mastercard un poco mas ancha por el texto,
// MercadoPago la mas ancha por "MercadoPago" inline). El texto "Hasta 12
// cuotas..." va inline despues del badge de MercadoPago, no en una linea
// aparte abajo. La fila 2 repite el patron con USDT.
//
// REGLA ECOMFLEX: el toggle de cada metodo (crypto.enabled, mercadopago.enabled)
// viene de themeConfig. Los SVG son del diseño AOURA y no se tocan por tienda.

import { themeConfig } from "@/theme.config";

const { payments } = themeConfig;

export default function PaymentBadges() {
  return (
    <>
      {/* Fila 1: Tarjetas + MercadoPago + texto cuotas inline */}
      {payments.mercadopago.enabled && (
        <div className="flex items-center gap-3 flex-wrap">
          {/* Visa */}
          <span className="flex items-center bg-white rounded px-2.5 py-1.5 h-8">
            <svg width="48" height="16" viewBox="0 0 48 16" fill="none" aria-label="Visa">
              <path d="M19.2 1.2L16.8 14.8H13.6L16 1.2H19.2Z" fill="#1A1F71"/>
              <path d="M31.2 1.5C30.4 1.2 29.2 0.8 27.6 0.8C24 0.8 21.4 2.8 21.4 5.5C21.4 7.5 23.2 8.6 24.6 9.3C26 10 26.5 10.4 26.5 11C26.5 11.9 25.4 12.3 24.4 12.3C23 12.3 22.2 12.1 21 11.5L20.5 11.3L20 14.3C21 14.7 22.6 15.1 24.4 15.1C28.2 15.1 30.7 13.1 30.7 10.2C30.7 8.7 29.8 7.5 27.6 6.5C26.4 5.9 25.6 5.5 25.6 4.8C25.6 4.2 26.3 3.6 27.8 3.6C29 3.6 29.9 3.8 30.6 4.1L31 4.3L31.2 1.5Z" fill="#1A1F71"/>
              <path d="M35.8 1.2C35 1.2 34.4 1.4 34 2.2L28.8 14.8H32.6L33.4 12.5H38L38.4 14.8H41.8L38.8 1.2H35.8ZM34.4 10C34.4 10 35.8 6.4 36 5.8L36.8 9.9H34.4V10Z" fill="#1A1F71"/>
              <path d="M12.4 1.2L8.8 10.8L8.4 8.8C7.6 6.2 5.2 3.4 2.4 2L5.6 14.8H9.4L16.2 1.2H12.4Z" fill="#1A1F71"/>
              <path d="M6.8 1.2H1.2L1.2 1.5C5.6 2.6 8.6 5.4 9.6 8.8L8.6 2.3C8.4 1.5 7.8 1.2 6.8 1.2Z" fill="#F7A600"/>
            </svg>
          </span>
          {/* Mastercard */}
          <span className="flex items-center bg-[#1A1F36] rounded px-2.5 py-1.5 h-8 gap-1.5">
            <svg width="26" height="16" viewBox="0 0 26 16" fill="none" aria-label="Mastercard">
              <circle cx="9" cy="8" r="7.5" fill="#EB001B"/>
              <circle cx="17" cy="8" r="7.5" fill="#F79E1B"/>
              <path d="M13 2.4C14.5 3.6 15.5 5.2 15.5 8C15.5 10.8 14.5 12.4 13 13.6C11.5 12.4 10.5 10.8 10.5 8C10.5 5.2 11.5 3.6 13 2.4Z" fill="#FF5F00"/>
            </svg>
            <span className="text-[10px] font-bold text-white tracking-tight">mastercard</span>
          </span>
          {/* American Express */}
          <span className="flex items-center bg-[#006FCF] rounded px-2.5 py-1.5 h-8">
            <span className="text-[11px] font-black text-white tracking-tight">AMEX</span>
          </span>
          {/* MercadoPago */}
          <span className="flex items-center bg-[#009EE3] rounded px-2.5 py-1.5 h-8 gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-label="MercadoPago">
              <path d="M20 16V8C20 6.9 19.1 6 18 6H6C4.9 6 4 6.9 4 8V16C4 17.1 4.9 18 6 18H18C19.1 18 20 17.1 20 16ZM18 16H6V12H18V16ZM18 9H6V8H18V9Z" fill="white"/>
            </svg>
            <span className="text-[10px] font-bold text-white">MercadoPago</span>
          </span>
          <span className="text-[10px] text-text-muted ml-1">
            Hasta 12 cuotas sin interes via MercadoPago
          </span>
        </div>
      )}

      {/* Fila 2: Crypto + texto inline */}
      {payments.crypto.enabled && (
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center bg-white rounded px-2.5 py-1.5 h-8 gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-label="USDT Tether">
              <circle cx="12" cy="12" r="11" fill="#26A17B"/>
              <path d="M13.5 10.8V8.5H17V6H7V8.5H10.5V10.8C7.6 11 5.5 11.7 5.5 12.5C5.5 13.3 7.6 14 10.5 14.2V19H13.5V14.2C16.4 14 18.5 13.3 18.5 12.5C18.5 11.7 16.4 11 13.5 10.8ZM12 13.5C9.2 13.5 7 13 7 12.4C7 11.9 8.6 11.5 10.5 11.3V13C11 13 11.5 13.1 12 13.1C12.5 13.1 13 13 13.5 13V11.3C15.4 11.5 17 11.9 17 12.4C17 13 14.8 13.5 12 13.5Z" fill="white"/>
            </svg>
            <span className="text-[10px] font-bold text-[#26A17B]">USDT</span>
          </span>
          <span className="text-[10px] text-text-muted">
            Transferencia directa {payments.crypto.red}
          </span>
        </div>
      )}
    </>
  );
}
