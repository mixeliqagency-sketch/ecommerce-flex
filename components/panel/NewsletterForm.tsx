"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [asunto, setAsunto] = useState("");
  const [contenido, setContenido] = useState("");
  const [segmento, setSegmento] = useState<"todos" | "compradores" | "sin_compra">("todos");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<
    { type: "success" | "error"; msg: string } | null
  >(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm("¿Enviar newsletter a los suscriptores seleccionados?")) return;
    setSending(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asunto, contenido, segmento }),
      });
      if (!res.ok) {
        const err = await res.json();
        setFeedback({ type: "error", msg: err.error ?? "Error" });
        return;
      }
      setFeedback({
        type: "success",
        msg: "Newsletter encolada. n8n la enviará en la próxima ejecución.",
      });
      setAsunto("");
      setContenido("");
    } catch {
      setFeedback({ type: "error", msg: "Error de conexión" });
    } finally {
      setSending(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 bg-[var(--bg-secondary)] rounded-[var(--radius-button)] border border-[var(--border-glass)] text-[var(--text-primary)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm mb-1 text-[var(--text-secondary)]">Asunto</label>
        <input
          type="text"
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm mb-1 text-[var(--text-secondary)]">Segmento</label>
        <select
          value={segmento}
          onChange={(e) => setSegmento(e.target.value as typeof segmento)}
          className={inputClass}
        >
          <option value="todos">Todos los suscriptores activos</option>
          <option value="compradores">Solo compradores</option>
          <option value="sin_compra">Suscriptores sin compra</option>
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1 text-[var(--text-secondary)]">
          Contenido (HTML o markdown)
        </label>
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          required
          rows={10}
          className={`${inputClass} font-mono text-sm`}
        />
      </div>
      {feedback && (
        <p
          className={
            feedback.type === "success"
              ? "text-[var(--color-success)] text-sm"
              : "text-[var(--color-danger)] text-sm"
          }
        >
          {feedback.msg}
        </p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-button)] font-semibold hover:brightness-110 disabled:opacity-50"
      >
        {sending ? "Encolando..." : "Enviar newsletter"}
      </button>
    </form>
  );
}
