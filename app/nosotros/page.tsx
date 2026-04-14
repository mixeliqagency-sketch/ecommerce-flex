import Link from "next/link";
import type { Metadata } from "next";
import { themeConfig } from "@/theme.config";

const { brand, about } = themeConfig;

// Metadata SEO — leida de themeConfig para swap & ship
export const metadata: Metadata = {
  title: `Nosotros — ${brand.name}`,
  description: about.subtitle,
  openGraph: {
    title: `Nosotros — ${brand.name}`,
    description: about.subtitle,
  },
};

export default function NosotrosPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 md:py-16">
      {/* Eyebrow + titulo */}
      <p className="text-accent-emerald text-xs font-semibold uppercase tracking-wider mb-3">
        {about.eyebrow}
      </p>
      <h1 className="font-heading text-3xl md:text-5xl font-bold text-text-primary mb-4 leading-tight">
        {about.title}
      </h1>
      <p className="text-base md:text-lg text-text-secondary mb-10 leading-relaxed">
        {about.subtitle}
      </p>

      {/* Manifiesto */}
      <div className="bg-bg-card border border-border-glass rounded-card p-6 md:p-8 mb-10 space-y-4">
        {about.manifesto.map((line, i) => (
          <p key={i} className="text-text-primary leading-relaxed">
            {line}
          </p>
        ))}
        <p className="font-heading font-bold text-accent-emerald text-lg md:text-xl pt-2">
          {about.closingLine}
        </p>
      </div>

      {/* Valores */}
      <h2 className="font-heading text-2xl font-bold mb-5 text-text-primary">
        Nuestros valores
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {about.values.map((v) => (
          <div key={v.title} className="bg-bg-card border border-border-glass rounded-card p-5">
            <p className="font-heading font-semibold text-accent-emerald mb-1">{v.title}</p>
            <p className="text-sm text-text-secondary leading-relaxed">{v.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA final con wordplay ANDA */}
      <Link
        href={about.ctaHref}
        className="inline-flex items-center gap-2 bg-accent-emerald text-white px-6 py-3 min-h-[48px] rounded-card font-semibold hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        {about.ctaText}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </Link>
    </main>
  );
}
