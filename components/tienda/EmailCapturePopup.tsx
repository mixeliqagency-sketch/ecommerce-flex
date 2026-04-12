"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "email_captured";
const DELAY_MS = 5000;

export function EmailCapturePopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY) === "true") return;

    // Mostrar despues de 5 segundos
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
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO Phase 2: llamar a /api/email/subscribe cuando exista
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
            <h2 className="text-2xl font-heading font-bold mb-2 text-[var(--text-primary)]">¡Listo!</h2>
            <p className="text-[var(--text-secondary)]">Te vamos a contactar pronto con tu cupon.</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-heading font-bold mb-2 text-[var(--text-primary)]">
              10% OFF en tu primera compra
            </h2>
            <p className="text-[var(--text-secondary)] mb-4">
              Dejanos tu email y te enviamos tu cupon.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="w-full px-4 py-3 bg-[var(--bg-secondary)] rounded-[var(--radius-button)] border border-[var(--border-glass)] text-[var(--text-primary)]"
              />
              <button
                type="submit"
                className="w-full px-4 py-3 bg-[var(--color-primary)] text-white rounded-[var(--radius-button)] font-semibold hover:brightness-110"
              >
                Quiero mi 10% OFF
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
