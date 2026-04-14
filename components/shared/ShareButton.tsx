"use client";

import { useState, useCallback } from "react";
import { themeConfig } from "@/theme.config";

const { share: shareCopy } = themeConfig.copy;

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  // Variantes visuales
  variant?: "icon" | "pill" | "full";
  className?: string;
  // Label custom — si se omite, usa themeConfig.copy.share.buttonLabel
  // (por default "ANDA y comparti" en ANDAX).
  label?: string;
}

// Boton de compartir universal — usa Web Share API en mobile, clipboard en desktop
export default function ShareButton({
  title,
  text,
  url,
  variant = "icon",
  className = "",
  label,
}: ShareButtonProps) {
  const buttonLabel = label ?? shareCopy.buttonLabel;
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    const shareData = { title, text, url: shareUrl };

    // Web Share API disponible (principalmente mobile)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Usuario cancelo o error — fallback a clipboard
      }
    }

    // Fallback: copiar al clipboard
    try {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ultimo fallback para navegadores viejos
      const textarea = document.createElement("textarea");
      textarea.value = `${text}\n${shareUrl}`;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [title, text, url]);

  // Icono de compartir SVG
  const ShareIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );

  if (variant === "icon") {
    return (
      <button
        onClick={handleShare}
        className={`w-9 h-9 rounded-full border border-border-glass flex items-center justify-center text-text-secondary hover:text-accent-emerald hover:border-accent-emerald/30 transition-colors ${className}`}
        aria-label={buttonLabel}
        title={copied ? "Copiado!" : buttonLabel}
      >
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-emerald">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <ShareIcon />
        )}
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <button
        onClick={handleShare}
        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border-glass text-text-secondary hover:text-accent-emerald hover:border-accent-emerald/30 transition-colors ${className}`}
      >
        {copied ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-emerald">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copiado!
          </>
        ) : (
          <>
            <ShareIcon size={12} />
            {buttonLabel}
          </>
        )}
      </button>
    );
  }

  // variant === "full" — usado en InviteFriends y ReferralSection.
  // Contraste fuerte: fondo primary (coral) + texto blanco. Es un CTA principal,
  // no un boton secundario, porque el referral es marketing organico gratis.
  return (
    <button
      onClick={handleShare}
      className={`w-full flex items-center justify-center gap-2 text-sm font-semibold py-3 min-h-[48px] rounded-pill bg-accent-emerald text-white hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all ${className}`}
    >
      {copied ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Link copiado!
        </>
      ) : (
        <>
          <ShareIcon />
          {buttonLabel}
        </>
      )}
    </button>
  );
}
