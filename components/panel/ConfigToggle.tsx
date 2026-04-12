"use client";

import { useState } from "react";

interface ConfigToggleProps {
  label: string;
  modulo: string;
  propiedad: string;
  initialValue: boolean;
  disabled?: boolean;
}

export function ConfigToggle({ label, modulo, propiedad, initialValue, disabled }: ConfigToggleProps) {
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    if (disabled || loading) return;
    setLoading(true);
    setError(null);
    const newValue = !value;

    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modulo, propiedad, valor: newValue }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setValue(newValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex flex-col">
        <span className="text-[var(--text-primary)]">{label}</span>
        {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
      </div>
      <button
        onClick={handleToggle}
        disabled={disabled || loading}
        aria-pressed={value}
        aria-label={`Toggle ${label}`}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          value ? "bg-[var(--color-primary)]" : "bg-gray-400"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            value ? "translate-x-6" : ""
          }`}
        />
      </button>
    </div>
  );
}
