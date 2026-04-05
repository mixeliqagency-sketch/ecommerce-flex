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
        // Colores de acento — leidos de CSS variables para cambio dinamico
        accent: {
          emerald: "var(--color-primary)",
          orange: "var(--color-secondary)",
          blue: "var(--color-accent)",
          red: "var(--color-danger)",
          yellow: "var(--color-secondary)",
          success: "var(--color-success)",
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
