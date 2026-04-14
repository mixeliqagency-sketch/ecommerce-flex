"use client";

// BrandManifesto — acrostico vertical animado, estilo AOURA.
//
// Cada fila entra lateralmente con micro-overshoot cinematico (keyframes en
// globals.css). La ultima letra (finale) tiene animaciones extras: spin 360°
// + cambio de color emerald → naranja + superscript que aparece con bounce.
//
// Dispara cuando entra al viewport (IntersectionObserver). Respeta
// prefers-reduced-motion — si el usuario tiene animaciones desactivadas,
// muestra el estado final sin animar.
//
// REGLA ECOMFLEX: todo el contenido viene de themeConfig.home.manifesto.
// Para una marca distinta, solo editar letras/palabras/tagline en theme.config.ts.

import { useEffect, useRef, useState } from "react";
import { themeConfig } from "@/theme.config";

const { manifesto } = themeConfig.home;

// Delay base entre filas (ms). La fila i-esima entra a i*DELAY_STEP.
const DELAY_STEP = 250;
// Duracion del finale (despues de que todas las filas aterrizaron).
const FINALE_COLOR_DELAY = 4000;
const FINALE_SPIN_DELAY = 4150;
const FINALE_SUP_DELAY = 5100;
const DIVIDER_DELAY = 5800;
const TAGLINE_DELAY = 6100;

export default function BrandManifesto() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Fallback: si por alguna razon el observer no dispara en 1 segundo
    // (ej: el user carga la pagina con scroll ya pasado la seccion),
    // forzamos visible=true para que la animacion igual corra.
    const fallback = setTimeout(() => setVisible(true), 1000);

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Solo marcar visible UNA vez — no reanimar al salir/entrar repetido
        if (entry.isIntersecting) {
          clearTimeout(fallback);
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },  // bajado de 0.2 a 0.1 para triggear antes
    );
    observer.observe(el);
    return () => {
      clearTimeout(fallback);
      observer.disconnect();
    };
  }, []);

  if (!manifesto.enabled) return null;

  const allRows = [
    ...manifesto.letters.map((l, i) => ({
      letter: l.letter,
      word: l.word,
      from: l.from,
      delay: i * DELAY_STEP,
      isFinale: false as const,
    })),
    {
      letter: manifesto.finale.letter,
      word: manifesto.finale.word,
      from: manifesto.finale.from,
      delay: manifesto.letters.length * DELAY_STEP,
      isFinale: true as const,
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden pt-4 md:pt-8 pb-12 md:pb-20"
    >
      {/* Glow central emerald de fondo */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full -z-10"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)",
          opacity: visible ? 1 : 0,
          transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.5})`,
          ...(reducedMotion ? {} : { transition: "all 1500ms" }),
        }}
      />

      {/* Glow orange de fondo — aparece cuando la X se pinta */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full -z-10"
        style={{
          background: "radial-gradient(circle, rgba(249,115,22,0.18) 0%, transparent 70%)",
          opacity: visible && !reducedMotion ? 1 : 0,
          transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.5})`,
          transition: "opacity 800ms ease-out",
          transitionDelay: `${FINALE_COLOR_DELAY + 150}ms`,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
        {/* Acronimo — columna alineada */}
        <div className="flex flex-col gap-3 md:gap-5">
          {allRows.map((item, i) => (
            <div
              key={i}
              className="grid"
              style={{
                gridTemplateColumns: "auto 1fr",
                gap: "0.75rem",
                alignItems: "baseline",
                opacity: visible ? 1 : 0,
                animation: visible && !reducedMotion
                  ? `${item.from === "left" ? "manifesto-from-left" : "manifesto-from-right"} 3s cubic-bezier(0.16, 1, 0.3, 1) ${item.delay}ms both`
                  : "none",
              }}
            >
              {/* Letra con glow */}
              <span
                className="font-heading text-5xl min-[400px]:text-6xl md:text-8xl lg:text-9xl font-bold text-accent-emerald leading-none w-[1.2em] text-center relative inline-block"
                style={{
                  textShadow: visible
                    ? "0 0 30px rgba(16,185,129,0.4), 0 0 60px rgba(16,185,129,0.15)"
                    : "none",
                  transformOrigin: "center center",
                  ...(item.isFinale && visible && !reducedMotion
                    ? {
                        animation: `manifesto-x-color 0.4s ${FINALE_COLOR_DELAY}ms forwards, manifesto-x-spin 0.95s ${FINALE_SPIN_DELAY}ms forwards`,
                      }
                    : {}),
                }}
              >
                {item.letter}
                {/* Superscript ² para el finale (ej X²) */}
                {item.isFinale && manifesto.finale.superscript && (
                  <sup
                    className="absolute font-black leading-none"
                    style={{
                      top: "-0.1em",
                      right: "-0.45em",
                      fontSize: "0.55em",
                      color: "#F97316",
                      opacity: 0,
                      transform: "scale(0) translateY(15px)",
                      textShadow: "0 0 20px rgba(249,115,22,0.8), 0 0 50px rgba(249,115,22,0.4)",
                      ...(visible && !reducedMotion
                        ? {
                            animation: `manifesto-squared-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) ${FINALE_SUP_DELAY}ms forwards`,
                          }
                        : { opacity: 1, transform: "scale(1) translateY(0)" }),
                    }}
                    aria-hidden="true"
                  >
                    {manifesto.finale.superscript}
                  </sup>
                )}
              </span>

              {/* Dash + palabra */}
              <span className="flex items-center gap-3 md:gap-4">
                <span
                  className="h-px bg-accent-emerald/40 ease-out"
                  style={{
                    width: visible ? "40px" : "0px",
                    ...(reducedMotion ? {} : { transition: "all 1200ms ease-out", transitionDelay: `${item.delay + 300}ms` }),
                  }}
                />
                <span
                  className="font-heading text-lg min-[400px]:text-xl md:text-3xl lg:text-4xl font-medium text-text-secondary tracking-wider ease-out"
                  style={{
                    opacity: visible ? 1 : 0,
                    ...(reducedMotion ? {} : { transition: "all 1200ms ease-out", transitionDelay: `${item.delay + 200}ms` }),
                    ...(item.isFinale && visible && !reducedMotion
                      ? { color: "#F97316", transitionDelay: `${FINALE_COLOR_DELAY + 200}ms` }
                      : {}),
                  }}
                >
                  {item.isFinale && manifesto.finale.wordPrefix ? (
                    <>
                      <span style={{ color: "rgba(255,255,255,0.35)" }}>{manifesto.finale.wordPrefix}</span>
                      {manifesto.finale.wordSuffix}
                    </>
                  ) : (
                    item.word
                  )}
                </span>
              </span>
            </div>
          ))}
        </div>

        {/* Separador animado */}
        <div
          className="mt-8 md:mt-12 h-px bg-gradient-to-r from-transparent via-accent-emerald/40 to-transparent ease-out"
          style={{
            width: visible ? "280px" : "0px",
            opacity: visible ? 1 : 0,
            ...(reducedMotion ? {} : { transition: "all 1500ms ease-out", transitionDelay: `${DIVIDER_DELAY}ms` }),
          }}
        />

        {/* Tagline con X accent (ej: "ANDÁ X TUS METAS. X TU RITMO. X TUS RESULTADOS.") */}
        <p
          className="mt-5 md:mt-8 text-text-muted text-xs md:text-sm tracking-[0.25em] uppercase ease-out text-center font-medium"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            ...(reducedMotion ? {} : { transition: "all 1200ms ease-out", transitionDelay: `${TAGLINE_DELAY}ms` }),
          }}
        >
          {manifesto.tagline.before}
          {manifesto.tagline.parts.map((part, i) => (
            <span key={i}>
              <span className="text-accent-orange font-black">{manifesto.tagline.accentChar}</span>
              {" "}
              {part}
              {i < manifesto.tagline.parts.length - 1 ? ". " : "."}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
