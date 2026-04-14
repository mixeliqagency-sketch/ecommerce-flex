"use client";

import { useState, useEffect } from "react";
import { themeConfig } from "@/theme.config";

const { currency, payments } = themeConfig;

// Promos rotativas generadas desde la config
const PROMOS = [
  ...(currency.envioGratis > 0
    ? [{
        partes: [
          { texto: "Envio gratis en compras +", gold: false },
          { texto: `${currency.symbol}${currency.envioGratis.toLocaleString(currency.locale)}`, gold: true },
        ],
      }]
    : [{
        partes: [
          { texto: "Envio ", gold: false },
          { texto: "GRATIS", gold: true },
          { texto: " a todo el pais", gold: false },
        ],
      }]),
  ...(payments.mercadopago.enabled
    ? [{
        partes: [
          { texto: "Hasta ", gold: false },
          { texto: "12 cuotas", gold: true },
          { texto: " sin interes", gold: false },
        ],
      }]
    : []),
  ...(payments.transferencia.enabled && payments.transferencia.descuento > 0
    ? [{
        partes: [
          { texto: `${payments.transferencia.descuento}% OFF`, gold: true },
          { texto: " pagando con transferencia", gold: false },
        ],
      }]
    : []),
];

export default function TopBar() {
  const [index, setIndex] = useState(0);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    if (PROMOS.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % PROMOS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const check = () => setIsLight(document.documentElement.getAttribute("data-theme") === "light");
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  if (PROMOS.length === 0) return null;

  const promo = PROMOS[index];
  // Paleta AOURA exacta para el TopBar (portada de aura/components/layout/TopBar.tsx:53-56).
  // Dark mode: negro premium #0A0A0B con dorado tan #C9A96E — estilo etiqueta lujo.
  // Light mode: crema calida #FAF6F0 con dorado oscuro #8B6914 + borde #D4B896.
  // Estos colores son de marca institucional, NO del primary color de la tienda,
  // asi que se hardcodean acá (valen para AOURA y cualquier tienda que use su paleta).
  const bgColor = isLight ? "#FAF6F0" : "#0A0A0B";
  const textColor = isLight ? "#5C4A32" : "#FFFFFF";
  const goldColor = isLight ? "#8B6914" : "#C9A96E";
  const borderColor = isLight ? "#D4B896" : "#C9A96E";

  return (
    <div
      className="text-xs text-center py-1.5 px-4 font-medium transition-colors duration-300"
      style={{ backgroundColor: bgColor, borderBottom: `1px solid ${borderColor}`, color: textColor }}
    >
      <span className="transition-opacity duration-500">
        {promo.partes.map((parte, i) =>
          parte.gold ? (
            <span key={i} style={{ color: goldColor, fontWeight: 600 }}>{parte.texto}</span>
          ) : (
            <span key={i}>{parte.texto}</span>
          )
        )}
      </span>
    </div>
  );
}
