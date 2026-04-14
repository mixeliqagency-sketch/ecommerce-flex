// Logo horizontal "ANDAX²" — versión wordmark del manifesto vertical que vive
// en components/home/BrandManifesto.tsx. Usado en el Header.
//
// Estructura: 4 letras emerald (A N D A) + 1 letra naranja con superscript ²
// (X²). Glow sutil en cada letra. Tamaño responsive por clase Tailwind.
//
// No se porta a themeConfig porque las 5 letras y los 2 colores son identidad
// fija de la marca ANDAX. Cuando clonen Ecomflex para otra marca, cambian
// este componente entero por su propio wordmark.

import { themeConfig } from "@/theme.config";

interface BrandWordmarkProps {
  // Controlan el tamaño — default queda bien para header (14px alto)
  className?: string;
}

export default function BrandWordmark({ className = "" }: BrandWordmarkProps) {
  const brandName = themeConfig.brand.name; // "ANDAX"
  // Separamos las letras: todas menos la ultima en emerald, la ultima en naranja.
  const mainLetters = brandName.slice(0, -1); // "ANDA"
  const lastLetter = brandName.slice(-1);     // "X"

  return (
    <span
      className={`inline-flex items-baseline font-heading font-black tracking-wider leading-none select-none ${className}`}
      aria-label={brandName}
    >
      <span
        className="text-accent-emerald"
        style={{
          textShadow: "0 0 12px rgba(16,185,129,0.35), 0 0 24px rgba(16,185,129,0.15)",
        }}
      >
        {mainLetters}
      </span>
      <span className="relative inline-block">
        <span
          className="text-accent-orange"
          style={{
            textShadow: "0 0 14px rgba(249,115,22,0.5), 0 0 28px rgba(249,115,22,0.2)",
          }}
        >
          {lastLetter}
        </span>
        {/* Superscript ² pegado a la X. Ocupa el 55% de la altura del texto
            y está posicionado absolutely para no empujar el baseline del header. */}
        <sup
          className="absolute font-black text-accent-orange"
          style={{
            top: "-0.2em",
            right: "-0.55em",
            fontSize: "0.58em",
            lineHeight: 1,
            textShadow: "0 0 10px rgba(249,115,22,0.6), 0 0 20px rgba(249,115,22,0.25)",
          }}
          aria-hidden="true"
        >
          2
        </sup>
      </span>
    </span>
  );
}
