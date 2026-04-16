import Link from "next/link";
import { getProducts } from "@/lib/sheets/products";
import HomeProducts from "@/components/home/HomeProducts";
import ReviewCarousel from "@/components/reviews/ReviewCarousel";
import InviteFriends from "@/components/home/InviteFriends";
import BrandManifesto from "@/components/home/BrandManifesto";
import JsonLd from "@/components/seo/JsonLd";
import { themeConfig } from "@/theme.config";
import type { Product } from "@/types";

const { brand, home, currency } = themeConfig;

// Iconos para las features de la home — el color se asigna en el JSX segun
// feature.color (emerald/orange/blue/yellow/red) para que cada card tenga su
// propia identidad visual, como ANDAX.
const FEATURE_ICONS: Record<string, (className: string) => React.ReactNode> = {
  truck: (className) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  shield: (className) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  headphones: (className) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 18v-6a9 9 0 0118 0v6" />
      <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
    </svg>
  ),
  creditCard: (className) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  star: (className) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  box: (className) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  ),
};

// Mapa estatico de clases por color — necesario para que Tailwind JIT detecte
// las clases (no funciona con interpolacion `text-accent-${color}`). Cada
// feature recibe un color desde themeConfig.home.features[i].color.
// IMPORTANTE: todas las clases tienen que vivir como strings literales en este
// archivo para que Tailwind las incluya en el bundle final.
const FEATURE_COLOR_CLASSES: Record<string, {
  text: string;
  textHover: string;      // aplicado al title en group-hover
  bgIcon: string;
  border: string;
  shadow: string;
}> = {
  emerald: {
    text: "text-accent-emerald",
    textHover: "group-hover:text-accent-emerald",
    bgIcon: "bg-accent-emerald/10",
    border: "hover:border-accent-emerald/60",
    shadow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]",
  },
  orange: {
    text: "text-accent-orange",
    textHover: "group-hover:text-accent-orange",
    bgIcon: "bg-accent-orange/10",
    border: "hover:border-accent-orange/60",
    shadow: "hover:shadow-[0_0_30px_rgba(249,115,22,0.25)]",
  },
  blue: {
    text: "text-accent-blue",
    textHover: "group-hover:text-accent-blue",
    bgIcon: "bg-accent-blue/10",
    border: "hover:border-accent-blue/60",
    shadow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]",
  },
  yellow: {
    text: "text-accent-yellow",
    textHover: "group-hover:text-accent-yellow",
    bgIcon: "bg-accent-yellow/10",
    border: "hover:border-accent-yellow/60",
    shadow: "hover:shadow-[0_0_30px_rgba(251,191,36,0.25)]",
  },
  red: {
    text: "text-accent-red",
    textHover: "group-hover:text-accent-red",
    bgIcon: "bg-accent-red/10",
    border: "hover:border-accent-red/60",
    shadow: "hover:shadow-[0_0_30px_rgba(239,68,68,0.25)]",
  },
};

export default async function Home() {
  let products: Product[] = [];
  try {
    products = await getProducts();
  } catch {
    // Si falla Sheets, mostrar home sin productos
  }

  return (
    <>
      {/* Schema markup */}
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Productos", "url": `${brand.url}/productos` },
        ],
      }} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-20 lg:py-24">
          <div className="text-center md:text-left max-w-2xl mx-auto md:mx-0">
            <h1 className="font-heading text-2xl min-[375px]:text-3xl min-[400px]:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-4 md:mb-5">
              {home.hero.title}{" "}
              <span className="text-accent-emerald">{home.hero.titleHighlight}</span>
            </h1>
            <p className="text-text-secondary text-base md:text-xl leading-relaxed mb-6 md:mb-8 max-w-lg mx-auto md:mx-0">
              {home.hero.subtitle}
            </p>

            <div className="flex flex-col min-[400px]:flex-row gap-3 justify-center md:justify-start mb-10 md:mb-14">
              <Link
                href={home.hero.ctaPrimary.href}
                className="px-6 py-3.5 bg-accent-emerald text-white font-bold text-base rounded-xl hover:brightness-110 active:scale-[0.97] transition-all text-center"
              >
                {home.hero.ctaPrimary.text}
              </Link>
              {home.hero.ctaSecondary && (
                <Link
                  href={home.hero.ctaSecondary.href}
                  className="px-6 py-3.5 bg-bg-card border border-border-glass text-text-primary font-bold text-base rounded-xl hover:border-accent-emerald/40 active:scale-[0.97] transition-all text-center"
                >
                  {home.hero.ctaSecondary.text}
                </Link>
              )}
            </div>
          </div>

          {/* Features — cada card tiene su propio color ANDAX (emerald/orange/blue)
              con hover glow + border + icon/text color animado. El color sale de
              themeConfig.home.features[i].color para swap & ship. */}
          <div className="grid grid-cols-1 min-[375px]:grid-cols-3 gap-3 md:gap-6">
            {home.features.map((feature) => {
              const colors = FEATURE_COLOR_CLASSES[feature.color] ?? FEATURE_COLOR_CLASSES.emerald;
              const iconRenderer = FEATURE_ICONS[feature.icon] ?? FEATURE_ICONS.box;
              return (
                <div
                  key={feature.title}
                  className={`group bg-bg-card/80 border border-border-glass rounded-2xl p-3 min-[375px]:p-4 md:p-6 text-center transition-all duration-300 hover:-translate-y-0.5 ${colors.border} ${colors.shadow}`}
                >
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl ${colors.bgIcon} flex items-center justify-center mx-auto mb-2 min-[375px]:mb-3 transition-transform duration-300 group-hover:scale-110`}>
                    {iconRenderer(colors.text)}
                  </div>
                  <p className={`font-heading font-bold text-sm md:text-base transition-colors ${colors.textHover}`}>{feature.title}</p>
                  <p className="text-[11px] md:text-xs text-text-muted mt-1 hidden min-[375px]:block transition-colors">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Decoracion de fondo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-emerald/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-accent-emerald/5 rounded-full blur-3xl -z-10" />
      </section>

      {/* Manifesto acrostico A-N-D-A-X² */}
      <BrandManifesto />

      {/* Productos destacados */}
      <section className="max-w-7xl mx-auto px-3 min-[400px]:px-4 py-6 md:py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-xl min-[400px]:text-2xl font-bold">Productos Destacados</h2>
          <Link href="/productos" className="text-sm text-accent-emerald hover:underline">
            Ver todos
          </Link>
        </div>
        <HomeProducts products={products.slice(0, 8)} />
      </section>

      {/* Invita amigos */}
      {home.showInviteFriends && <InviteFriends />}

      {/* Resenas */}
      {home.showReviews && <ReviewCarousel />}
    </>
  );
}
