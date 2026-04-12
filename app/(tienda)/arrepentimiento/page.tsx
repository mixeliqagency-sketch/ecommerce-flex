"use client";
// Página: Botón de Arrepentimiento — Resolución SECCYD 424/2020
// Es un Client Component porque maneja el estado del formulario

import { useState } from "react";
import { themeConfig } from "@/theme.config";

// Opciones de motivo predefinidas para ayudar al usuario
const MOTIVOS = [
  "Me arrepentí de la compra",
  "Compré el producto equivocado",
  "Encontré el producto más barato en otro lado",
  "El producto tardó demasiado en llegar",
  "No necesito más el producto",
  "Otro motivo",
];

export default function Arrepentimiento() {
  const { brand, contact } = themeConfig;

  // Estado del formulario
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    numeroPedido: "",
    motivo: "",
    motivoLibre: "",
  });
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  // Actualizar campo del formulario
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  // Validar y enviar
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validación básica
    if (!form.nombre.trim()) {
      setError("Por favor ingresá tu nombre completo.");
      return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      setError("Por favor ingresá un email válido.");
      return;
    }
    if (!form.numeroPedido.trim()) {
      setError("Por favor ingresá tu número de pedido.");
      return;
    }
    if (!form.motivo) {
      setError("Por favor seleccioná un motivo.");
      return;
    }
    if (form.motivo === "Otro motivo" && !form.motivoLibre.trim()) {
      setError("Por favor describí el motivo de tu arrepentimiento.");
      return;
    }

    // Simular envío (en Fase 1 se conectará con el email real via API)
    setCargando(true);
    setTimeout(() => {
      setCargando(false);
      setEnviado(true);
    }, 1200);
  }

  // Pantalla de éxito después de enviar
  if (enviado) {
    return (
      <main className="bg-bg-primary min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-bg-card border border-border-glass rounded-2xl p-8 text-center">
          {/* Icono de éxito */}
          <div className="w-16 h-16 rounded-full bg-accent-emerald/20 flex items-center justify-center mx-auto mb-5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3" style={{ fontFamily: "var(--font-heading)" }}>
            Solicitud recibida
          </h2>
          <p className="text-text-secondary mb-2">
            Tu solicitud de arrepentimiento fue registrada exitosamente.
          </p>
          <p className="text-text-secondary mb-6">
            Te contactaremos a <strong className="text-text-primary">{form.email}</strong> dentro de las
            próximas <strong className="text-text-primary">72 horas hábiles</strong> para coordinar el
            proceso de devolución.
          </p>
          <div className="bg-bg-glass border border-border-glass rounded-xl p-4 text-sm text-text-muted">
            <p>Pedido: <strong className="text-text-primary">#{form.numeroPedido}</strong></p>
            <p>Nombre: <strong className="text-text-primary">{form.nombre}</strong></p>
          </div>
          <p className="text-xs text-text-muted mt-5">
            ¿Dudas? Escribinos a{" "}
            <a href={`mailto:${contact.email}`} className="text-accent-emerald hover:underline">
              {contact.email}
            </a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-bg-primary min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Encabezado */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2 text-text-primary"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Botón de Arrepentimiento
          </h1>
          <p className="text-text-secondary leading-relaxed">
            Conforme la{" "}
            <strong className="text-text-primary">Resolución SECCYD 424/2020</strong>, tenés derecho
            a revocar tu compra dentro de los{" "}
            <strong className="text-text-primary">10 días corridos</strong> desde que la realizaste
            o desde que recibiste el producto (lo que ocurra después).
          </p>
        </div>

        {/* Banner informativo */}
        <div className="bg-accent-emerald/10 border border-accent-emerald/30 rounded-xl p-4 mb-8 flex items-start gap-3">
          <svg className="shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-text-secondary">
            Una vez que completes este formulario, {brand.name} tiene{" "}
            <strong className="text-text-primary">10 días hábiles</strong> para procesar el reembolso
            o acreditar el importe en tu cuenta.
          </p>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="bg-bg-card border border-border-glass rounded-2xl p-6 space-y-5"
          noValidate
        >
          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5" htmlFor="nombre">
              Nombre completo <span className="text-red-400">*</span>
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: María García"
              className="w-full bg-bg-glass border border-border-glass rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent-emerald/50 focus:ring-1 focus:ring-accent-emerald/30 transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5" htmlFor="email">
              Email de contacto <span className="text-red-400">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Ej: maria@email.com"
              className="w-full bg-bg-glass border border-border-glass rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent-emerald/50 focus:ring-1 focus:ring-accent-emerald/30 transition-colors"
            />
          </div>

          {/* Número de pedido */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5" htmlFor="numeroPedido">
              Número de pedido <span className="text-red-400">*</span>
            </label>
            <input
              id="numeroPedido"
              name="numeroPedido"
              type="text"
              value={form.numeroPedido}
              onChange={handleChange}
              placeholder="Ej: 00123"
              className="w-full bg-bg-glass border border-border-glass rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent-emerald/50 focus:ring-1 focus:ring-accent-emerald/30 transition-colors"
            />
            <p className="text-xs text-text-muted mt-1">
              Lo encontrás en el email de confirmación de tu compra.
            </p>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5" htmlFor="motivo">
              Motivo del arrepentimiento <span className="text-red-400">*</span>
            </label>
            <select
              id="motivo"
              name="motivo"
              value={form.motivo}
              onChange={handleChange}
              className="w-full bg-bg-glass border border-border-glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-emerald/50 focus:ring-1 focus:ring-accent-emerald/30 transition-colors appearance-none cursor-pointer"
              style={{ color: form.motivo ? "var(--color-text-primary)" : "var(--color-text-muted)" }}
            >
              <option value="" disabled>Seleccioná un motivo...</option>
              {MOTIVOS.map((m) => (
                <option key={m} value={m} style={{ color: "var(--color-text-primary)", background: "var(--color-bg-card)" }}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Motivo libre (solo si eligió "Otro") */}
          {form.motivo === "Otro motivo" && (
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1.5" htmlFor="motivoLibre">
                Describí el motivo <span className="text-red-400">*</span>
              </label>
              <textarea
                id="motivoLibre"
                name="motivoLibre"
                value={form.motivoLibre}
                onChange={handleChange}
                placeholder="Contanos por qué querés revocar tu compra..."
                rows={4}
                className="w-full bg-bg-glass border border-border-glass rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent-emerald/50 focus:ring-1 focus:ring-accent-emerald/30 transition-colors resize-none"
              />
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Botón enviar */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-accent-emerald text-white font-semibold py-3.5 rounded-xl text-sm hover:bg-accent-emerald/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {cargando ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3" />
                  <path d="M21 12a9 9 0 00-9-9" />
                </svg>
                Enviando solicitud...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 109 9M3 12V6m0 6H9" />
                </svg>
                Solicitar arrepentimiento
              </>
            )}
          </button>

          <p className="text-xs text-text-muted text-center">
            Al enviar este formulario, {brand.name} procesará tu solicitud conforme la normativa vigente.
          </p>
        </form>

        {/* Nota legal */}
        <div className="mt-6 text-xs text-text-muted text-center">
          ¿Tenés dudas? Contactanos en{" "}
          <a href={`mailto:${contact.email}`} className="text-accent-emerald hover:underline">
            {contact.email}
          </a>
        </div>
      </div>
    </main>
  );
}
