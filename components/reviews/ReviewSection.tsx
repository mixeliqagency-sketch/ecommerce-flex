"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import StarRating from "./StarRating";
import ReviewCard from "./ReviewCard";
import type { Review, ReviewSummary } from "@/types";

interface ReviewSectionProps {
  productSlug: string;
}

export default function ReviewSection({ productSlug }: ReviewSectionProps) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formRating, setFormRating] = useState(0);
  const [formTitulo, setFormTitulo] = useState("");
  const [formContenido, setFormContenido] = useState("");
  const [formNombre, setFormNombre] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/resenas?producto=${productSlug}`);
        const data = await res.json();
        setReviews(data.reviews || []);
        setSummary(data.summary || null);
      } catch {
        // Si falla, mostrar seccion vacia
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productSlug]);

  // Pre-llenar nombre y email solo si los campos estan vacios
  // (evita sobrescribir input del usuario cuando next-auth refresca la sesion)
  useEffect(() => {
    if (session?.user) {
      if (!formNombre) setFormNombre(session.user.name ?? "");
      if (!formEmail) setFormEmail(session.user.email ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formRating === 0) {
      setSubmitMsg("Selecciona una calificacion");
      return;
    }
    setSubmitting(true);
    setSubmitMsg("");

    try {
      const res = await fetch("/api/resenas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_slug: productSlug,
          nombre: formNombre,
          email: formEmail,
          calificacion: formRating,
          titulo: formTitulo,
          contenido: formContenido,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitMsg(data.mensaje);
        setShowForm(false);
        setFormRating(0);
        setFormTitulo("");
        setFormContenido("");
        // Recargar resenas si fue auto-aprobada
        if (data.aprobado === "si") {
          const refresh = await fetch(`/api/resenas?producto=${productSlug}`);
          const refreshData = await refresh.json();
          setReviews(refreshData.reviews || []);
          setSummary(refreshData.summary || null);
        }
      } else {
        setSubmitMsg(data.error || "Error al enviar resena");
      }
    } catch {
      setSubmitMsg("Error de conexion. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-8 animate-pulse space-y-4">
        <div className="h-6 bg-bg-card rounded w-1/3" />
        <div className="h-24 bg-bg-card rounded" />
      </div>
    );
  }

  return (
    <section className="mt-10 pt-8 border-t border-border-glass">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold">
          Opiniones
          {summary && summary.total > 0 && (
            <span className="text-text-muted font-normal text-base ml-2">({summary.total})</span>
          )}
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm bg-accent-emerald/10 hover:bg-accent-emerald text-accent-emerald hover:text-white px-4 py-2 rounded-lg font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Escribir opinion
        </button>
      </div>

      {/* Resumen de calificaciones */}
      {summary && summary.total > 0 && (
        <div className="bg-bg-card rounded-card border border-border-glass p-5 mb-6 flex flex-col md:flex-row gap-6">
          {/* Promedio grande */}
          <div className="flex flex-col items-center justify-center md:min-w-[140px]">
            <span className="font-heading text-4xl font-bold text-accent-yellow">
              {summary.promedio.toFixed(1)}
            </span>
            <StarRating rating={summary.promedio} size={18} />
            <span className="text-xs text-text-muted mt-1">
              {summary.total} {summary.total === 1 ? "opinion" : "opiniones"}
            </span>
          </div>

          {/* Barras de distribucion */}
          <div className="flex-1 space-y-1.5">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = summary.distribucion[star];
              const percent = summary.total > 0 ? (count / summary.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-text-muted w-3">{star}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#ffd93d" className="flex-shrink-0">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <div className="flex-1 h-2 bg-bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-yellow rounded-full transition-all"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-text-muted w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mensaje de confirmacion */}
      {submitMsg && !showForm && (
        <div className="bg-accent-emerald/10 border border-accent-emerald/30 rounded-lg p-3 text-accent-emerald text-sm mb-4">
          {submitMsg}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-bg-card rounded-card border border-border-glass p-5 mb-6 space-y-4">
          <p className="font-semibold text-sm">Tu opinion</p>

          {/* Estrellas interactivas */}
          <div>
            <p className="text-xs text-text-muted mb-1.5">Calificacion</p>
            <StarRating
              rating={formRating}
              size={28}
              interactive
              onChange={setFormRating}
            />
          </div>

          {/* Nombre y Email (si no esta logueado) */}
          {!session && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">Nombre</label>
                <input
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  required
                  className="w-full bg-bg-secondary border border-border-glass rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-emerald transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  className="w-full bg-bg-secondary border border-border-glass rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-emerald transition-colors"
                />
              </div>
            </div>
          )}

          {/* Titulo */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Titulo</label>
            <input
              value={formTitulo}
              onChange={(e) => setFormTitulo(e.target.value)}
              required
              placeholder="Ej: Excelente producto, se nota la diferencia"
              className="w-full bg-bg-secondary border border-border-glass rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-emerald transition-colors"
            />
          </div>

          {/* Contenido */}
          <div>
            <label className="block text-xs text-text-muted mb-1">Tu experiencia</label>
            <textarea
              value={formContenido}
              onChange={(e) => setFormContenido(e.target.value)}
              required
              rows={3}
              placeholder="Conta como te fue con el producto..."
              className="w-full bg-bg-secondary border border-border-glass rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-emerald transition-colors resize-none"
            />
          </div>

          {/* Error */}
          {submitMsg && (
            <p className="text-sm text-accent-red">{submitMsg}</p>
          )}

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-accent-emerald disabled:bg-accent-emerald/50 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all hover:brightness-125 hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitting ? "Enviando..." : "Enviar opinion"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-text-secondary hover:text-text-primary text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de resenas */}
      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="text-center py-8">
            <p className="text-text-secondary text-sm mb-2">
              Todavia no hay opiniones de este producto
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="text-accent-emerald text-sm hover:underline"
            >
              Se el primero en opinar
            </button>
          </div>
        )
      )}
    </section>
  );
}
