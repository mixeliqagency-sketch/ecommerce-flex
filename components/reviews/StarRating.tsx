"use client";

import { useId } from "react";

// Componente de estrellas reutilizable (display y input)
interface StarRatingProps {
  rating: number;        // 0-5 (acepta decimales para display)
  size?: number;         // tamano en px
  interactive?: boolean; // true = se puede clickear
  onChange?: (rating: number) => void;
  showNumber?: boolean;  // mostrar numero al lado
  count?: number;        // cantidad de resenas
}

export default function StarRating({
  rating,
  size = 16,
  interactive = false,
  onChange,
  showNumber = false,
  count,
}: StarRatingProps) {
  // ID unico por instancia para evitar clipPath duplicados en el DOM
  const instanceId = useId();

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          // Calcular llenado: completa, parcial o vacia
          const fill = rating >= star ? 1 : rating >= star - 0.5 ? 0.5 : 0;

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange?.(star)}
              onMouseEnter={undefined}
              className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
              aria-label={`${star} estrellas`}
            >
              <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Definir clip para media estrella */}
                <defs>
                  <clipPath id={`half-${instanceId}-${star}`}>
                    <rect x="0" y="0" width="12" height="24" />
                  </clipPath>
                </defs>

                {/* Estrella de fondo (vacia) */}
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill={fill === 1 ? "#ffd93d" : "none"}
                  stroke={fill === 0 ? "#55556a" : "#ffd93d"}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />

                {/* Media estrella */}
                {fill === 0.5 && (
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="#ffd93d"
                    clipPath={`url(#half-${instanceId}-${star})`}
                  />
                )}
              </svg>
            </button>
          );
        })}
      </div>
      {showNumber && rating > 0 && (
        <span className="text-sm font-semibold text-text-primary ml-0.5">
          {rating.toFixed(1)}
        </span>
      )}
      {count !== undefined && (
        <span className="text-xs text-text-muted">
          ({count})
        </span>
      )}
    </div>
  );
}
