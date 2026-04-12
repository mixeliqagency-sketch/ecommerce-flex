"use client";

// Banner superior que se muestra cuando el usuario llega con ?ref=CODIGO.
// Captura el codigo de la URL, lo guarda en localStorage y muestra aviso.

import { useEffect, useState } from "react";
import {
  captureReferralFromUrl,
  getStoredReferralCode,
} from "@/lib/referral-tracking";

export function ReferralBanner() {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    // Captura desde URL si existe y registra click (fire-and-forget)
    captureReferralFromUrl();
    setCode(getStoredReferralCode());
  }, []);

  if (!code) return null;

  return (
    <div className="bg-[var(--color-primary)]/10 border-b border-[var(--color-primary)]/20 px-4 py-2 text-center text-sm">
      <span className="text-[var(--text-primary)]">
        Llegaste con un link de amigo — 10% OFF en tu primera compra con el
        codigo{" "}
      </span>
      <span className="font-mono font-bold text-[var(--color-primary)]">
        {code}
      </span>
    </div>
  );
}
