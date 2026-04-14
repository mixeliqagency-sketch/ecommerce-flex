import StarRating from "./StarRating";
import type { Review } from "@/types";

interface ReviewCardProps {
  review: Review;
  compact?: boolean; // version compacta para carrusel
}

export default function ReviewCard({ review, compact = false }: ReviewCardProps) {
  // Inicial del nombre para el avatar
  const inicial = review.nombre.charAt(0).toUpperCase();

  return (
    <div className={`bg-bg-card rounded-card border border-border-glass h-full flex flex-col ${compact ? "p-4" : "p-5"}`}>
      {/* Fila 1: avatar + nombre + verificado (izq) | fecha (der) */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-full bg-accent-emerald/20 flex items-center justify-center flex-shrink-0">
            <span className="text-accent-emerald text-sm font-bold">{inicial}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm truncate">{review.nombre}</span>
            {review.verificado && (
              <span className="flex items-center gap-0.5 text-[10px] text-accent-emerald font-medium mt-0.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                Compra verificada
              </span>
            )}
          </div>
        </div>
        <span className="text-[10px] text-text-muted flex-shrink-0 mt-1">{review.fecha}</span>
      </div>

      {/* Estrellas */}
      <StarRating rating={review.calificacion} size={14} />

      {/* Titulo */}
      {review.titulo && (
        <p className="font-semibold text-sm mt-2 line-clamp-1">{review.titulo}</p>
      )}

      {/* Contenido */}
      <p className={`text-sm text-text-secondary mt-1 leading-relaxed flex-1 ${compact ? "line-clamp-3" : ""}`}>
        {review.contenido}
      </p>
    </div>
  );
}
