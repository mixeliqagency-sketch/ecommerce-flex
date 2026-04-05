"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";

// Opciones para "Como nos conociste"
const FUENTES = [
  { value: "", label: "Selecciona una opcion..." },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google (buscando)" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "amigo", label: "Un amigo/conocido" },
  { value: "gym", label: "Mi gimnasio" },
  { value: "otro", label: "Otro" },
];

function ResultadoContent() {
  const params = useSearchParams();
  const status = params.get("status");
  const paymentId = params.get("payment_id");
  const externalRef = params.get("external_reference");
  const [fuente, setFuente] = useState("");
  const [fuenteEnviada, setFuenteEnviada] = useState(false);

  // Enviar fuente de adquisicion a Sheets
  const handleFuenteSubmit = () => {
    if (!fuente || !externalRef) return;
    fetch("/api/sync/adquisicion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: externalRef,
        email: "",
        fuente,
      }),
    }).catch(() => {});
    setFuenteEnviada(true);
  };

  const config: Record<string, { icon: JSX.Element; title: string; message: string; color: string }> = {
    approved: {
      icon: (
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-emerald">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      title: "Pago aprobado",
      message: "Tu pedido fue confirmado exitosamente. Te enviamos un email con los detalles.",
      color: "text-accent-emerald",
    },
    pending: {
      icon: (
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-yellow">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      title: "Pago pendiente",
      message: "Tu pago esta siendo procesado. Te notificaremos cuando se confirme.",
      color: "text-accent-yellow",
    },
    rejected: {
      icon: (
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-red">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
      title: "Pago rechazado",
      message: "No pudimos procesar tu pago. Intenta con otro medio de pago.",
      color: "text-accent-red",
    },
  };

  const current = config[status || ""] || config.rejected;

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="flex justify-center mb-6">{current.icon}</div>
      <h1 className={`font-heading text-2xl font-bold mb-3 ${current.color}`}>
        {current.title}
      </h1>
      <p className="text-text-secondary mb-6">{current.message}</p>

      {externalRef && (
        <p className="text-xs text-text-muted mb-4">
          Orden: {externalRef}
          {paymentId && ` · Pago: ${paymentId}`}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {externalRef && status === "approved" && (
          <Link
            href={`/tracking/${externalRef}`}
            className="bg-accent-emerald text-white px-6 py-3 rounded-card font-semibold transition-all hover:brightness-125 hover:scale-[1.02] active:scale-[0.98]"
          >
            Seguir mi envio
          </Link>
        )}
        <Link
          href="/productos"
          className="bg-accent-emerald text-white px-6 py-3 rounded-card font-semibold transition-all hover:brightness-125 hover:scale-[1.02] active:scale-[0.98]"
        >
          Seguir comprando
        </Link>
        {status === "rejected" && (
          <Link
            href="/checkout"
            className="border border-accent-emerald text-accent-emerald px-6 py-3 rounded-card font-semibold transition-all hover:bg-accent-emerald hover:text-white hover:scale-[1.04] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.98]"
          >
            Reintentar pago
          </Link>
        )}
      </div>

      {/* Pregunta post-compra: Como nos conociste (solo en pago aprobado) */}
      {status === "approved" && !fuenteEnviada && (
        <div className="mt-8 p-4 bg-bg-card/60 backdrop-blur-xl border border-border-glass rounded-2xl max-w-sm mx-auto">
          <p className="text-sm text-text-secondary mb-3">
            Una ultima pregunta rapida:
          </p>
          <p className="font-heading font-semibold text-sm text-text-primary mb-3">
            Como conociste AOURA?
          </p>
          <label htmlFor="fuente-select" className="sr-only">Como conociste AOURA</label>
          <select
            id="fuente-select"
            value={fuente}
            onChange={(e) => setFuente(e.target.value)}
            className="w-full px-3 py-2 bg-bg-glass border border-border-glass rounded-xl text-sm text-text-primary mb-3 outline-none focus:border-accent-emerald/40 transition-colors"
          >
            {FUENTES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleFuenteSubmit}
            disabled={!fuente}
            className="w-full py-2 rounded-xl bg-accent-emerald/15 border border-accent-emerald/25 text-accent-emerald text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-emerald/25 transition-colors"
          >
            Enviar
          </button>
        </div>
      )}

      {/* Confirmacion despues de enviar */}
      {status === "approved" && fuenteEnviada && (
        <p className="mt-6 text-sm text-accent-emerald">
          Gracias por contarnos!
        </p>
      )}
    </div>
  );
}

export default function ResultadoPage() {
  return (
    <Suspense fallback={
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-text-secondary">Cargando resultado...</p>
      </div>
    }>
      <ResultadoContent />
    </Suspense>
  );
}
