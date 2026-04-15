"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { themeConfig } from "@/theme.config";
import PaymentBadges from "./PaymentBadges";

const { brand, contact, social } = themeConfig;
const { footer: footerCopy } = themeConfig.copy;

// Links de la seccion "Tienda" del footer. Hardcodeados con wordplay ANDA
// en lugar de derivarlos de themeConfig.categories. Razon: el footer es un
// punto de entrada al catalogo — queremos CTAs accionables, no una lista
// larga de categorias tecnicas (deportivo, wellness, etc) que ya viven en
// el filtro lateral de /productos.
const TIENDA_LINKS = [
  { href: "/productos", label: "ANDA a la tienda" },
  { href: "/nosotros",  label: "ANDA a conocernos" },
  { href: "/blog",      label: "ANDA al blog" },
];

// Ayuda: links reales. Contacto abre WhatsApp directo (wa.me), Envios y
// devoluciones lleva a /terminos donde esta la info real de envios (Ley 24.240).
const AYUDA_LINKS = [
  { href: "/terminos", label: "Envios y devoluciones", external: false },
  { href: `https://wa.me/${contact.whatsapp}`, label: "Contacto", external: true },
];

const LEGAL_LINKS = [
  { href: "/terminos", label: "Términos y condiciones" },
  { href: "/politica-privacidad", label: "Política de privacidad" },
  { href: "/arrepentimiento", label: "Botón de arrepentimiento" },
];

// Trust signals — badges de confianza que aumentan conversion (best practice
// e-commerce). Reduce ansiedad del comprador antes de pagar.
const TRUST_SIGNALS = [
  {
    title: "Envio 48h",
    subtitle: "A todo el pais",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="1" y="3" width="15" height="13" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
  },
  {
    title: "Pago seguro",
    subtitle: "MercadoPago + SSL",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
  },
  {
    // Nota: NO hay "devolucion 10 dias" — los suplementos una vez abiertos no
    // se pueden devolver por higiene. El trust signal honesto es: productos
    // sellados + RNPA oficial, no promesas falsas.
    title: "Productos sellados",
    subtitle: "De fabrica, sin abrir",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    title: "RNPA oficial",
    subtitle: "Productos verificados",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
];

export default function Footer() {
  // Toggle "Powered by Ecomflex" — se puede apagar desde /panel/config
  const [showPoweredBy, setShowPoweredBy] = useState(true);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg) => {
        if (cancelled) return;
        if (cfg?.poweredBy && cfg.poweredBy.enabled === false) {
          setShowPoweredBy(false);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <footer className="bg-bg-secondary border-t border-border-glass pb-20 md:pb-0">
      {/* Trust signals strip — maximo impacto visual para aumentar conversion */}
      <div className="border-b border-border-glass">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TRUST_SIGNALS.map((signal) => (
              <div key={signal.title} className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-accent-emerald/10 text-accent-emerald flex items-center justify-center flex-shrink-0">
                  {signal.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text-primary leading-tight">{signal.title}</p>
                  <p className="text-[10px] text-text-muted leading-tight mt-0.5">{signal.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Marca — full width en mobile para que destaque */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-lg font-heading font-bold text-accent-emerald mb-2">
              {brand.name}
            </p>
            <p className="text-text-secondary text-sm leading-relaxed mb-3">
              {brand.tagline}
            </p>
            {/* WhatsApp CTA removido — el handoff a WhatsApp vive en el asistente
                flotante Andi (components/layout/ShopAssistant.tsx), no duplicamos. */}
            {(social.instagram || social.tiktok || social.twitter || social.facebook) && (
              <>
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2">{footerCopy.followUs}</p>
                <div className="flex items-center gap-3">
                  {social.instagram && (
                    <a href={`https://instagram.com/${social.instagram}`} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-full border border-border-glass flex items-center justify-center text-text-secondary hover:text-accent-emerald hover:border-accent-emerald/40 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </a>
                  )}
                  {social.facebook && (
                    <a href={`https://facebook.com/${social.facebook}`} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-full border border-border-glass flex items-center justify-center text-text-secondary hover:text-accent-emerald hover:border-accent-emerald/40 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
                    </a>
                  )}
                  {social.tiktok && (
                    <a href={`https://tiktok.com/@${social.tiktok}`} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-9 h-9 rounded-full border border-border-glass flex items-center justify-center text-text-secondary hover:text-accent-emerald hover:border-accent-emerald/40 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.2a8.16 8.16 0 005.58 2.2v-3.45a4.85 4.85 0 01-2.83-.91 4.84 4.84 0 01-1.17-4.35z" /></svg>
                    </a>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Tienda */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-text-primary mb-3">{footerCopy.sectionTienda}</h4>
            <ul className="space-y-2">
              {TIENDA_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-text-secondary hover:text-text-primary transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-text-primary mb-3">{footerCopy.sectionAyuda}</h4>
            <ul className="space-y-2">
              {AYUDA_LINKS.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-text-primary transition-colors">{link.label}</a>
                  ) : (
                    <Link href={link.href} className="text-sm text-text-secondary hover:text-text-primary transition-colors">{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal — full width en mobile debajo del resto */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-heading font-semibold text-sm text-text-primary mb-3">{footerCopy.sectionLegal}</h4>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-text-secondary hover:text-text-primary transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Medios de pago — badges ricos portados a componente compartido */}
        <div className="border-t border-border-glass mt-8 pt-6">
          <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-3">{footerCopy.paymentsTitle}</p>
          <PaymentBadges />
        </div>

        {/* Copyright */}
        <div className="border-t border-border-glass mt-6 pt-4">
          <p className="text-xs text-text-muted text-center">
            &copy; {new Date().getFullYear()} {brand.name}. {footerCopy.rightsReserved}
          </p>
          {showPoweredBy && (
            <p className="text-[10px] text-text-muted text-center mt-1 opacity-70">
              Powered by{" "}
              <a
                href="https://github.com/mixeliqagency-sketch"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent-emerald transition-colors"
              >
                Ecomflex
              </a>
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
