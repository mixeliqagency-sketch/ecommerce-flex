import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fondos — leidos de CSS variables (generadas desde theme.config.ts)
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          card: "var(--bg-card)",
          glass: "var(--bg-glass)",
        },
        border: {
          glass: "var(--border-glass)",
        },
        // Texto
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        // Colores de acento — portados de AOURA v1 (hex directo, no CSS vars).
        // La razon: antes accent-emerald mapeaba a var(--color-primary) y si
        // una marca nueva cambiaba primary, "emerald" dejaba de ser verde y
        // los checkmarks/onlines se veian del color del brand. Ahora los
        // nombres semanticos son estables; los colores de marca viven en
        // var(--color-primary)/secondary/accent en theme-css.ts.
        accent: {
          emerald: "#10B981",   // verde AOURA — identidad + success + online
          orange: "#F97316",    // naranja AOURA — urgencia, ofertas, stock bajo
          blue: "#3B82F6",      // azul AOURA — info, links institucionales
          red: "#EF4444",       // rojo AOURA — error, sin stock, peligro
          yellow: "#FBBF24",    // amarillo AOURA — warnings, crypto, reviews
          success: "#34D399",   // verde claro AOURA — confirmaciones
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        card: "var(--radius-card)",
        button: "var(--radius-button)",
        pill: "var(--radius-pill)",
      },
    },
  },
  plugins: [],
};

export default config;
