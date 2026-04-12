"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BlogPost } from "@/types";

interface BlogEditorProps {
  initialPost?: Partial<BlogPost>;
  mode: "create" | "edit";
}

export function BlogEditor({ initialPost, mode }: BlogEditorProps) {
  const router = useRouter();
  const [titulo, setTitulo] = useState(initialPost?.titulo ?? "");
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  const [descripcion, setDescripcion] = useState(initialPost?.descripcion ?? "");
  const [contenido, setContenido] = useState(initialPost?.contenido ?? "");
  const [categoria, setCategoria] = useState(initialPost?.categoria ?? "general");
  const [autor, setAutor] = useState(initialPost?.autor ?? "Equipo");
  const [imagenUrl, setImagenUrl] = useState(initialPost?.imagen_url ?? "");
  const [keywords, setKeywords] = useState((initialPost?.keywords ?? []).join(", "));
  const [publicado, setPublicado] = useState(initialPost?.publicado ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-slug desde título en modo create
  function handleTituloChange(v: string) {
    setTitulo(v);
    if (mode === "create" && !initialPost?.slug) {
      const auto = v
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80);
      setSlug(auto);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      slug,
      titulo,
      descripcion,
      contenido,
      categoria,
      autor,
      fecha: initialPost?.fecha || new Date().toISOString(),
      imagen_url: imagenUrl || undefined,
      keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
      publicado,
    };

    try {
      const url = mode === "create" ? "/api/blog" : `/api/blog/${initialPost?.slug}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Error al guardar");
        return;
      }
      router.push("/panel/seo");
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 bg-[var(--bg-secondary)] rounded-[var(--radius-button)] border border-[var(--border-glass)] text-[var(--text-primary)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
      <div>
        <label className="block text-sm mb-1 text-[var(--text-secondary)]">Título</label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => handleTituloChange(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm mb-1 text-[var(--text-secondary)]">
          Slug (URL) — solo minúsculas, números y guiones
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          pattern="[a-z0-9-]+"
          className={inputClass}
          disabled={mode === "edit"}
        />
      </div>

      <div>
        <label className="block text-sm mb-1 text-[var(--text-secondary)]">
          Descripción (meta description)
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
          rows={2}
          maxLength={160}
          className={inputClass}
        />
        <div className="text-xs text-[var(--text-muted)] mt-1">{descripcion.length}/160</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-1 text-[var(--text-secondary)]">Categoría</label>
          <input
            type="text"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-[var(--text-secondary)]">Autor</label>
          <input
            type="text"
            value={autor}
            onChange={(e) => setAutor(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-[var(--text-secondary)]">Publicado</label>
          <button
            type="button"
            onClick={() => setPublicado(!publicado)}
            className={`w-full px-3 py-2 rounded-[var(--radius-button)] ${
              publicado
                ? "bg-[var(--color-success)]/20 text-[var(--color-success)]"
                : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
            }`}
          >
            {publicado ? "✓ Publicado" : "Borrador"}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1 text-[var(--text-secondary)]">
          URL de imagen destacada
        </label>
        <input
          type="url"
          value={imagenUrl}
          onChange={(e) => setImagenUrl(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm mb-1 text-[var(--text-secondary)]">
          Keywords (separadas por coma)
        </label>
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm mb-1 text-[var(--text-secondary)]">
          Contenido (Markdown)
        </label>
        <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          required
          rows={20}
          className={`${inputClass} font-mono text-sm`}
        />
      </div>

      {error && <p className="text-[var(--color-danger)] text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-button)] font-semibold hover:brightness-110 disabled:opacity-50"
        >
          {saving ? "Guardando..." : mode === "create" ? "Crear artículo" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
