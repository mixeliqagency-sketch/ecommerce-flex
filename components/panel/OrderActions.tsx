"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/types";

const ALL_STATES: OrderStatus[] = [
  "creado",
  "pendiente_pago",
  "pagado",
  "preparando",
  "enviado",
  "entregado",
  "cancelado",
  "reembolsado",
];

export function OrderActions({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(newStatus: OrderStatus) {
    if (newStatus === currentStatus) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pedidos/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? "Error");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefund() {
    if (!confirm("¿Procesar reembolso? Esta acción puede ser irreversible.")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pedidos/${orderId}/refund`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Error");
        return;
      }
      if (data.requiresManualAction) {
        alert(data.message ?? "Requiere acción manual");
      }
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  const canRefund = ["pagado", "preparando", "enviado", "entregado"].includes(currentStatus);

  return (
    <div className="flex flex-col gap-1">
      <select
        value={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
        disabled={loading}
        className="text-xs px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-glass)] rounded text-[var(--text-primary)]"
      >
        {ALL_STATES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {canRefund && (
        <button
          onClick={handleRefund}
          disabled={loading}
          className="text-xs px-2 py-1 bg-[var(--color-danger)]/20 text-[var(--color-danger)] rounded hover:bg-[var(--color-danger)]/30"
        >
          Reembolsar
        </button>
      )}
      {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
    </div>
  );
}
