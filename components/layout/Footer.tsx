import Link from "next/link";
import { themeConfig } from "@/theme.config";

const { brand, contact, social, payments, categories } = themeConfig;

const TIENDA_LINKS = [
  { href: "/productos", label: "Todos los productos" },
  ...categories.filter(c => c.slug !== "todos").slice(0, 4).map(c => ({
    href: `/productos?categoria=${c.slug}`,
    label: c.nombre,
  })),
];

const AYUDA_LINKS = [
  { href: "#", label: "Preguntas frecuentes" },
  { href: "#", label: "Envios y devoluciones" },
  { href: "#", label: "Contacto" },
];

const LEGAL_LINKS = [
  { href: "#", label: "Terminos y condiciones" },
  { href: "#", label: "Politica de privacidad" },
];

export default function Footer() {
  return (
    <footer className="bg-bg-secondary border-t border-border-glass mt-12 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-4 gap-8">
          {/* Marca */}
          <div>
            <p className="text-lg font-heading font-bold text-accent-emerald mb-3">
              {brand.name}
            </p>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              {brand.tagline}
            </p>
            {(social.instagram || social.tiktok || social.twitter || social.facebook) && (
              <>
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2">Seguinos</p>
                <div className="flex items-center gap-3">
                  {social.instagram && (
                    <a href={`https://instagram.com/${social.instagram}`} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-8 h-8 rounded-full border border-border-glass flex items-center justify-center text-text-secondary hover:text-accent-emerald hover:border-accent-emerald/40 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </a>
                  )}
                  {social.facebook && (
                    <a href={`https://facebook.com/${social.facebook}`} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-8 h-8 rounded-full border border-border-glass flex items-center justify-center text-text-secondary hover:text-accent-emerald hover:border-accent-emerald/40 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
                    </a>
                  )}
                  {social.tiktok && (
                    <a href={`https://tiktok.com/@${social.tiktok}`} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-8 h-8 rounded-full border border-border-glass flex items-center justify-center text-text-secondary hover:text-accent-emerald hover:border-accent-emerald/40 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.2a8.16 8.16 0 005.58 2.2v-3.45a4.85 4.85 0 01-2.83-.91 4.84 4.84 0 01-1.17-4.35z" /></svg>
                    </a>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Tienda */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-text-primary mb-3">Tienda</h4>
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
            <h4 className="font-heading font-semibold text-sm text-text-primary mb-3">Ayuda</h4>
            <ul className="space-y-2">
              {AYUDA_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-text-secondary hover:text-text-primary transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-semibold text-sm text-text-primary mb-3">Legal</h4>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-text-secondary hover:text-text-primary transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Medios de pago */}
        <div className="border-t border-border-glass mt-8 pt-6">
          <p className="text-xs text-text-muted mb-3">Medios de pago</p>
          <div className="flex items-center gap-3 flex-wrap">
            {payments.mercadopago.enabled && (
              <span className="flex items-center bg-[#009EE3] rounded px-2.5 py-1.5 h-8 gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 16V8C20 6.9 19.1 6 18 6H6C4.9 6 4 6.9 4 8V16C4 17.1 4.9 18 6 18H18C19.1 18 20 17.1 20 16ZM18 16H6V12H18V16ZM18 9H6V8H18V9Z" fill="white"/></svg>
                <span className="text-[10px] font-bold text-white">MercadoPago</span>
              </span>
            )}
            {payments.transferencia.enabled && (
              <span className="flex items-center bg-bg-card border border-border-glass rounded px-2.5 py-1.5 h-8">
                <span className="text-[10px] font-bold text-text-primary">Transferencia</span>
              </span>
            )}
            {payments.crypto.enabled && (
              <span className="flex items-center bg-white rounded px-2.5 py-1.5 h-8 gap-1">
                <span className="text-[10px] font-bold text-[#26A17B]">USDT</span>
              </span>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border-glass mt-6 pt-4">
          <p className="text-xs text-text-muted text-center">
            &copy; {new Date().getFullYear()} {brand.name}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
