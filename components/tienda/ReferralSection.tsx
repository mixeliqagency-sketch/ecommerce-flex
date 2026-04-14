"use client";

// Sección de referidos en la página de cuenta del usuario.
// Muestra el código del usuario, link copiable y stats básicas.

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { themeConfig } from "@/theme.config";

const { referral: refCopy } = themeConfig.copy;

interface Referral {
  codigo: string;
  total_clicks?: number;
  total_conversiones?: number;
}

export function ReferralSection() {
  const { data: session } = useSession();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.email) return;
    const userId = encodeURIComponent(session.user.email);
    fetch(`/api/referidos/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error cargando referidos");
        return res.json();
      })
      .then((data) => {
        setReferral(data.referral);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("[ReferralSection]", err);
        setError("No pudimos cargar tu link de referido");
        setLoading(false);
      });
  }, [session?.user?.email]);

  const link =
    typeof window !== "undefined" && referral
      ? `${window.location.origin}/?ref=${referral.codigo}`
      : "";

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("[ReferralSection] copy fail", err);
    }
  };

  if (loading) {
    return (
      <div className="bg-bg-card rounded-card border border-border-glass p-5">
        <p className="text-sm text-text-secondary">Cargando referidos...</p>
      </div>
    );
  }

  if (error || !referral) {
    return null;
  }

  return (
    <div className="bg-bg-card rounded-card border border-border-glass p-5 space-y-4">
      <div>
        <h2 className="font-heading font-semibold text-lg mb-1">
          {refCopy.title}
        </h2>
        <p className="text-sm text-text-secondary">
          {refCopy.subtitle}
        </p>
      </div>

      <div>
        <p className="text-xs text-text-secondary mb-1">{refCopy.codeLabel}</p>
        <p className="font-mono font-bold text-accent-emerald">
          {referral.codigo}
        </p>
      </div>

      <div>
        <p className="text-xs text-text-secondary mb-1">{refCopy.linkLabel}</p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={link}
            className="flex-1 min-w-0 bg-bg-primary border border-border-glass rounded-button px-3 py-2 text-xs text-text-secondary"
            aria-label={refCopy.linkLabel}
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 min-h-[44px] bg-accent-emerald text-white rounded-button text-xs font-semibold flex-shrink-0 hover:brightness-110 active:scale-[0.98] transition-all"
          >
            {copied ? refCopy.copiedButton : refCopy.copyButton}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-glass">
        <div>
          <p className="text-xs text-text-secondary">{refCopy.clicksLabel}</p>
          <p className="font-heading font-bold text-xl">
            {referral.total_clicks ?? 0}
          </p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">{refCopy.conversionsLabel}</p>
          <p className="font-heading font-bold text-xl">
            {referral.total_conversiones ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}
