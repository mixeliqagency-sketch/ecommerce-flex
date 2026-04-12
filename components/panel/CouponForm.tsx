"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CouponForm() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [descuento, setDescuento] = useState(10);
  const [vencimiento, setVencimiento] = useState("");
  const [usosMax, setUsosMax] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/cupones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo: codigo.toUpperCase(),
          descuento_porcentaje: descuento,
          fecha_vencimiento: vencimiento,
          usos_maximos: usosMax,
          activo: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setFeedback({ type: "error", msg: err.error ?? "Error al crear cupón" });
        return;
      }

      setFeedback({ type: "success", msg: "Cupón creado correctamente" });
      setCodigo("");
      setVencimiento("");
      router.refresh();
    } catch {
      setFeedback({ type: "error", msg: "Error de conexión" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
      <h2 className="text-xl font-heading font-semibold mb-4 text-[var(--text-primary)]">Crear cupón</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1 text-[var(--text-secondary)]">Código</label>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            required
            pattern="[A-Z0-9_-]+"
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] rounded-[var(--radius-button)] border border-[var(--border-glass)] text-[var(--text-primary)]"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-[var(--text-secondary)]">Descuento %</label>
          <input
            type="number"
            value={descuento}
            onChange={(e) => setDescuento(Number(e.target.value))}
            min={1}
            max={100}
            required
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] rounded-[var(--radius-button)] border border-[var(--border-glass)] text-[var(--text-primary)]"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-[var(--text-secondary)]">Vencimiento</label>
          <input
            type="date"
            value={vencimiento}
            onChange={(e) => setVencimiento(e.target.value)}
            required
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] rounded-[var(--radius-button)] border border-[var(--border-glass)] text-[var(--text-primary)]"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-[var(--text-secondary)]">Usos máximos (0 = ilimitado)</label>
          <input
            type="number"
            value={usosMax}
            onChange={(e) => setUsosMax(Number(e.target.value))}
            min={0}
            className="w-full px-3 py-2 bg-[var(--bg-secondary)] rounded-[var(--radius-button)] border border-[var(--border-glass)] text-[var(--text-primary)]"
          />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-button)] font-semibold hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear cupón"}
        </button>
        {feedback && (
          <span className={feedback.type === "success" ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}>
            {feedback.msg}
          </span>
        )}
      </div>
    </form>
  );
}
