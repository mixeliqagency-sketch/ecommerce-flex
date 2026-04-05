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
    <div className={`bg-bg-card rounded-card border border-border-glass ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-accent-emerald/20 flex items-center justify-center flex-shrink-0">
          <span className="text-accent-emerald text-sm font-bold">{inicial}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header: nombre + verificado + fecha */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{review.nombre}</span>
            {review.verificado && (
              <span className="flex items-center gap-0.5 text-[10px] text-accent-emerald font-medium bg-accent-emerald/10 px-1.5 py-0.5 rounded-full">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                Compra verificada
              </span>
            )}
            <span className="text-[10px] text-text-muted">{review.fecha}</span>
          </div>

          {/* Estrellas */}
          <div className="mt-1">
            <StarRating rating={review.calificacion} size={14} />
          </div>

          {/* Titulo */}
          {review.titulo && (
            <p className="font-semibold text-sm mt-2">{review.titulo}</p>
          )}

          {/* Contenido */}
          <p className={`text-sm text-text-secondary mt-1 leading-relaxed ${compact ? "line-clamp-3" : ""}`}>
            {review.contenido}
          </p>
        </div>
      </div>
    </div>
  );
}
