"use client";

// Compositor de publicaciones para redes sociales.
// Permite publicar inmediatamente o programar a futuro via /api/social/*.

import { useState } from "react";
import type { SocialPlatform } from "@/types";

const MAX_CHARS = 2200;

export function SocialMediaComposer() {
  const [platform, setPlatform] = useState<SocialPlatform>("instagram");
  const [contenido, setContenido] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [modo, setModo] = useState<"ahora" | "programar">("ahora");
  const [scheduledFor, setScheduledFor] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<
    { tipo: "ok" | "error"; mensaje: string } | null
  >(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setFeedback(null);

    if (!contenido.trim()) {
      setFeedback({ tipo: "error", mensaje: "Escribi el contenido." });
      return;
    }
    if (contenido.length > MAX_CHARS) {
      setFeedback({ tipo: "error", mensaje: `Maximo ${MAX_CHARS} caracteres.` });
      return;
    }
    if (modo === "programar" && !scheduledFor) {
      setFeedback({ tipo: "error", mensaje: "Elegi fecha y hora." });
      return;
    }

    setEnviando(true);
    try {
      const endpoint =
        modo === "ahora" ? "/api/social/publish" : "/api/social/schedule";

      const body: Record<string, unknown> = {
        platform,
        contenido,
      };
      if (imagenUrl.trim()) body.imagen_url = imagenUrl.trim();
      if (modo === "programar") {
        // Convertir datetime-local a ISO
        body.scheduled_for = new Date(scheduledFor).toISOString();
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Error al enviar");
      }

      setFeedback({
        tipo: "ok",
        mensaje:
          modo === "ahora"
            ? "Publicacion encolada. Se publicara en los proximos minutos."
            : "Publicacion programada correctamente.",
      });
      setContenido("");
      setImagenUrl("");
      setScheduledFor("");
    } catch (err) {
      setFeedback({
        tipo: "error",
        mensaje: err instanceof Error ? err.message : "Error desconocido",
      });
    } finally {
      setEnviando(false);
    }
  }

  const restantes = MAX_CHARS - contenido.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm mb-1 text-[var(--text-secondary)]">
          Plataforma
        </label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
          className="w-full px-3 py-2 rounded-[var(--radius-button)] bg-[var(--bg-secondary)] border border-[var(--border-glass)] text-[var(--text-primary)]"
        >
          <option value="instagram">Instagram</option>
          <option value="twitter">Twitter / X</option>
          <option value="tiktok">TikTok</option>
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1 text-[var(--text-secondary)]">
          Contenido
        </label>
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          rows={6}
          maxLength={MAX_CHARS}
          placeholder="Que queres compartir?"
          className="w-full px-3 py-2 rounded-[var(--radius-button)] bg-[var(--bg-secondary)] border border-[var(--border-glass)] text-[var(--text-primary)] resize-y"
        />
        <div
          className={`text-xs mt-1 ${
            restantes < 0
              ? "text-[var(--color-danger)]"
              : "text-[var(--text-muted)]"
          }`}
        >
          {restantes} caracteres restantes
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1 text-[var(--text-secondary)]">
          URL de imagen (opcional)
        </label>
        <input
          type="url"
          value={imagenUrl}
          onChange={(e) => setImagenUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 rounded-[var(--radius-button)] bg-[var(--bg-secondary)] border border-[var(--border-glass)] text-[var(--text-primary)]"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
          <input
            type="radio"
            name="modo"
            value="ahora"
            checked={modo === "ahora"}
            onChange={() => setModo("ahora")}
          />
          Publicar ahora
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
          <input
            type="radio"
            name="modo"
            value="programar"
            checked={modo === "programar"}
            onChange={() => setModo("programar")}
          />
          Programar
        </label>
        {modo === "programar" && (
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="w-full px-3 py-2 rounded-[var(--radius-button)] bg-[var(--bg-secondary)] border border-[var(--border-glass)] text-[var(--text-primary)]"
          />
        )}
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="w-full px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-button)] font-semibold disabled:opacity-50"
      >
        {enviando ? "Enviando..." : modo === "ahora" ? "Publicar" : "Programar"}
      </button>

      {feedback && (
        <div
          className={`text-sm px-3 py-2 rounded-[var(--radius-button)] ${
            feedback.tipo === "ok"
              ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
              : "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
          }`}
        >
          {feedback.mensaje}
        </div>
      )}
    </form>
  );
}
