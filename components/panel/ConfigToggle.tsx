"use client";

// ConfigToggle — switch individual para un modulo del panel de config.
//
// En PRODUCCION: llama PUT /api/config que escribe a Google Sheets tab "Config"
// (requiere NextAuth admin session).
//
// En DEMO_MODE: persiste el toggle en localStorage con una clave namespaceada
// por modulo+propiedad. Asi los toggles demo se mantienen entre reloads pero
// no afectan a otros usuarios ni requieren NextAuth/Sheets.

import { useState, useEffect } from "react";
import { isDemoModeClient } from "@/lib/demo-data";
// Helpers + constante extraidos a lib/ para evitar el patron
// "exportar non-components desde client file" que causa bugs de hidratacion.
import { demoConfigKey, DEMO_CONFIG_EVENT } from "@/lib/demo-config-store";

interface ConfigToggleProps {
  label: string;
  modulo: string;
  propiedad: string;
  initialValue: boolean;
  disabled?: boolean;
  description?: string;
}

export function ConfigToggle({ label, modulo, propiedad, initialValue, disabled, description }: ConfigToggleProps) {
  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // En DEMO al montar, leemos el valor de localStorage (si existe) para que
  // el toggle refleje lo que fue seteado antes (no el initialValue del server).
  useEffect(() => {
    if (!isDemoModeClient()) return;
    const stored = localStorage.getItem(demoConfigKey(modulo, propiedad));
    if (stored === "true") setValue(true);
    else if (stored === "false") setValue(false);
  }, [modulo, propiedad]);

  async function handleToggle() {
    if (disabled || loading) return;
    setLoading(true);
    setError(null);
    const newValue = !value;

    try {
      // DEMO_MODE: escribir a localStorage y dispatchear evento para que
      // useModuleConfig se entere en otros componentes.
      if (isDemoModeClient()) {
        localStorage.setItem(demoConfigKey(modulo, propiedad), String(newValue));
        window.dispatchEvent(new Event(DEMO_CONFIG_EVENT));
        setValue(newValue);
        setLoading(false);
        return;
      }

      // PROD: PUT a la API (requiere NextAuth admin).
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
    <div className="flex items-start justify-between py-3 gap-4">
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[var(--text-primary)] text-sm font-medium">{label}</span>
        {description && (
          <span className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">{description}</span>
        )}
        {error && <span className="text-xs text-[var(--color-danger)] mt-1">{error}</span>}
      </div>
      <button
        onClick={handleToggle}
        disabled={disabled || loading}
        aria-pressed={value}
        aria-label={`${value ? "Desactivar" : "Activar"} ${label}`}
        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 mt-1 ${
          value ? "bg-accent-emerald" : "bg-gray-600"
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
