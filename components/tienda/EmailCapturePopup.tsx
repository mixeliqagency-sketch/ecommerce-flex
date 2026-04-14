"use client";

import { useEffect, useState } from "react";
import { themeConfig } from "@/theme.config";
import { useModuleConfig } from "@/hooks/useModuleConfig";

const { emailCapture: popupCopy } = themeConfig.copy;

const STORAGE_KEY = "email_captured";
const DELAY_MS = popupCopy.delaySeconds * 1000;

export function EmailCapturePopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Runtime config del panel admin — el popup es parte de Email Marketing.
  // Si el admin apaga "emailMarketing.enabled" o no tiene "welcomeSeries",
  // el popup no se muestra. Ver /panel/config para togglear.
  const { isEnabled, loaded } = useModuleConfig();
  const emailMarketingActive = isEnabled("emailMarketing") && isEnabled("emailMarketing", "welcomeSeries");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!popupCopy.enabled) return;
    // Esperar a que el config este cargado antes de decidir
    if (!loaded) return;
    // Respetar el toggle runtime del panel
    if (!emailMarketingActive) return;
    if (localStorage.getItem(STORAGE_KEY) === "true") return;

    // Mostrar despues del delay configurado en themeConfig
    const timer = setTimeout(() => setShow(true), DELAY_MS);

    // O al intentar salir (exit intent - solo desktop)
    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 0) setShow(true);
    }
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [loaded, emailMarketingActive]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "popup" }),
      });
    } catch (err) {
      console.error("subscribe error", err);
    }
    localStorage.setItem(STORAGE_KEY, "true");
    setSubmitted(true);
    setTimeout(() => setShow(false), 2500);
  }

  function handleClose() {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Suscribite para recibir cupon"
    >
      <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-8 max-w-md w-full relative border border-[var(--border-glass)]">
        <button
          onClick={handleClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl"
        >
          ✕
        </button>

        {submitted ? (
          <div className="text-center">
            <h2 className="text-2xl font-heading font-bold mb-2 text-[var(--text-primary)]">{popupCopy.successTitle}</h2>
            <p className="text-[var(--text-secondary)]">{popupCopy.successMessage}</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-heading font-bold mb-2 text-[var(--text-primary)]">
              {popupCopy.title}
            </h2>
            <p className="text-[var(--text-secondary)] mb-4">
              {popupCopy.subtitle}
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={popupCopy.placeholder}
                className="w-full px-4 py-3 bg-[var(--bg-secondary)] rounded-[var(--radius-button)] border border-[var(--border-glass)] text-[var(--text-primary)]"
              />
              <button
                type="submit"
                className="w-full px-4 py-3 bg-[var(--color-primary)] text-white rounded-[var(--radius-button)] font-semibold hover:brightness-110"
              >
                {popupCopy.submitButton}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
