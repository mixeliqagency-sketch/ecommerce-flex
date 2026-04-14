"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ReviewCard from "./ReviewCard";
import StarRating from "./StarRating";
import { themeConfig } from "@/theme.config";
import type { Review } from "@/types";

// Testimonios fallback para cuando no hay resenas reales
const FALLBACK_TESTIMONIALS = [
  {
    name: "Martin G.",
    rating: 5,
    text: "El producto que compre es de primera calidad. Llego rapido y el packaging es impecable. Muy contento con la compra.",
    product: "Producto destacado",
    date: "Hace 2 semanas",
  },
  {
    name: "Luciana R.",
    rating: 5,
    text: "Me encanta la tienda! Facil de navegar, buenos precios y el envio fue super rapido. Ya les recomende a varias amigas.",
    product: "Compra general",
    date: "Hace 1 semana",
  },
  {
    name: "Federico P.",
    rating: 4,
    text: "Los productos son buenos y los precios competitivos. La atencion al cliente es excelente, me respondieron todas las dudas al instante.",
    product: "Atencion al cliente",
    date: "Hace 3 dias",
  },
  {
    name: "Camila V.",
    rating: 5,
    text: "Hice mi primer pedido y quede encantada. Todo llego bien embalado y en perfecto estado. Seguro vuelvo a comprar.",
    product: "Primer pedido",
    date: "Hace 5 dias",
  },
  {
    name: "Santiago M.",
    rating: 5,
    text: "La variedad de productos es genial y siempre tienen ofertas. Me ahorre bastante comparado con otras tiendas.",
    product: "Ofertas",
    date: "Hace 1 semana",
  },
  {
    name: "Valentina A.",
    rating: 4,
    text: "Compre varios productos en combo y salio muy bien de precio. Envio rapido y buena atencion. La seccion de novedades esta buenisima.",
    product: "Combo de productos",
    date: "Hace 4 dias",
  },
];

export default function ReviewCarousel() {
  const [apiReviews, setApiReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/resenas?destacadas=true");
        const data = await res.json();
        setApiReviews(data || []);
      } catch {
        // Si falla, usar fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Actualizar estado de flechas de scroll
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [loading, updateScrollState]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    // Al usar flechas, pausar auto-scroll y reanudar despues
    pauseAutoScroll();
    resumeAutoScroll();
    const amount = 320;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  // Auto-scroll continuo — se pausa al hover/touch, se reanuda al salir
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || loading) return;

    let raf: number;
    const step = () => {
      if (!pausedRef.current && el) {
        el.scrollLeft += 0.5;
        // Cuando llega a la mitad (contenido duplicado), resetear al inicio
        const half = el.scrollWidth / 2;
        if (half > 0 && el.scrollLeft >= half) {
          el.scrollLeft = 0;
        }
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [loading]);

  const pauseAutoScroll = useCallback(() => {
    pausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }, []);

  const resumeAutoScroll = useCallback(() => {
    // Reanudar despues de 4 segundos de inactividad
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, 4000);
  }, []);

  // Cuando el usuario scrollea manualmente (rueda o swipe), pausar y reanudar
  const onManualScroll = useCallback(() => {
    if (!pausedRef.current) pauseAutoScroll();
    resumeAutoScroll();
  }, [pauseAutoScroll, resumeAutoScroll]);

  // Drag-to-scroll: arrastrar con mouse/dedo para mover el carrusel
  const dragRef = useRef({ active: false, startX: 0, scrollStart: 0 });

  const onDragStart = useCallback((e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    dragRef.current = { active: true, startX: e.clientX, scrollStart: el.scrollLeft };
    pauseAutoScroll();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [pauseAutoScroll]);

  const onDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const el = scrollRef.current;
    if (!el) return;
    const dx = e.clientX - dragRef.current.startX;
    el.scrollLeft = dragRef.current.scrollStart - dx;
  }, []);

  const onDragEnd = useCallback(() => {
    dragRef.current.active = false;
    resumeAutoScroll();
  }, [resumeAutoScroll]);

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-6 bg-bg-card rounded w-1/3 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-bg-card rounded-card animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  // Si hay resenas reales de la API, usarlas
  const hasApiReviews = apiReviews.length > 0;
  const avgRating = hasApiReviews
    ? apiReviews.reduce((sum, r) => sum + r.calificacion, 0) / apiReviews.length
    : FALLBACK_TESTIMONIALS.reduce((sum, t) => sum + t.rating, 0) / FALLBACK_TESTIMONIALS.length;

  return (
    <section className="max-w-7xl mx-auto px-4 pt-6 md:pt-12 pb-6 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-accent-emerald text-xs font-semibold uppercase tracking-wider mb-1">
            Comunidad {themeConfig.brand.name}
          </p>
          <h2 className="font-heading text-2xl font-bold">
            Lo que dicen nuestros usuarios
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <StarRating rating={avgRating} size={16} />
            <span className="text-sm text-text-secondary">
              {avgRating.toFixed(1)} promedio
            </span>
          </div>
        </div>

        {/* Flechas de scroll */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="w-9 h-9 rounded-full border border-border-glass flex items-center justify-center transition-all hover:border-accent-emerald/50 hover:text-accent-emerald disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15,18 9,12 15,6" />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="w-9 h-9 rounded-full border border-border-glass flex items-center justify-center transition-all hover:border-accent-emerald/50 hover:text-accent-emerald disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,6 15,12 9,18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Carrusel de resenas — auto-scroll continuo, pausa al hover */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide cursor-grab active:cursor-grabbing select-none"
        onMouseEnter={pauseAutoScroll}
        onMouseLeave={() => { onDragEnd(); resumeAutoScroll(); }}
        onWheel={onManualScroll}
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
      >
        {hasApiReviews ? (
          // Resenas reales de la API — duplicadas para loop infinito
          [...apiReviews.slice(0, 8), ...apiReviews.slice(0, 8)].map((review, idx) => (
            <div key={`api-${idx}`} className="min-w-[300px] max-w-[340px] flex-shrink-0">
              <ReviewCard review={review} compact />
            </div>
          ))
        ) : (
          // Testimonios fallback — duplicados para loop infinito
          [...FALLBACK_TESTIMONIALS, ...FALLBACK_TESTIMONIALS].map((testimonial, idx) => (
            <div
              key={`fb-${idx}`}
              className="min-w-[300px] max-w-[340px] flex-shrink-0 bg-bg-card rounded-card border border-border-glass p-5 flex flex-col"
            >
              {/* Estrellas */}
              <div className="flex items-center gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill={star <= testimonial.rating ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    className={star <= testimonial.rating ? "text-accent-yellow" : "text-text-muted"}
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>

              {/* Texto */}
              <p className="text-sm text-text-secondary leading-relaxed mb-4 flex-1">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              {/* Info del usuario */}
              <div className="flex items-center justify-between pt-3 border-t border-border-glass">
                <div className="flex items-center gap-2.5">
                  {/* Avatar con iniciales */}
                  <div className="w-8 h-8 rounded-full bg-accent-emerald/15 flex items-center justify-center">
                    <span className="text-xs font-bold text-accent-emerald">
                      {testimonial.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{testimonial.name}</p>
                    <p className="text-[10px] text-text-muted">{testimonial.product}</p>
                  </div>
                </div>
                <p className="text-[10px] text-text-muted">{testimonial.date}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
