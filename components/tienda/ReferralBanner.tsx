"use client";

// Banner superior que se muestra cuando el usuario llega con ?ref=CODIGO.
// Captura el codigo de la URL, lo guarda en localStorage y muestra aviso.

import { useEffect, useState } from "react";
import {
  captureReferralFromUrl,
  getStoredReferralCode,
} from "@/lib/referral-tracking";
import { useModuleConfig } from "@/hooks/useModuleConfig";

export function ReferralBanner() {
  const [code, setCode] = useState<string | null>(null);
  // Respetar el toggle "referidos" del panel admin.
  // CRITICO: no metas `isEnabled` en el dep array del useEffect — es una
  // funcion nueva cada render que causa infinite loop. Resolvemos el valor
  // a boolean fuera del efecto y usamos ese como dep estable.
  const { isEnabled, loaded } = useModuleConfig();
  const referidosActive = isEnabled("referidos");

  useEffect(() => {
    if (!loaded) return;
    if (!referidosActive) return;
    // Captura desde URL si existe y registra click (fire-and-forget)
    captureReferralFromUrl();
    setCode(getStoredReferralCode());
  }, [loaded, referidosActive]);

  if (!referidosActive) return null;
  if (!code) return null;

  return (
    <div className="bg-[var(--color-primary)]/10 border-b border-[var(--color-primary)]/20 px-4 py-2 text-center text-sm">
      <span className="text-[var(--text-primary)]">
        Llegaste con el link de un amigo. Gracias por visitarnos{" "}
      </span>
      <span className="font-mono text-xs text-[var(--color-primary)]">
        ({code})
      </span>
    </div>
  );
}
