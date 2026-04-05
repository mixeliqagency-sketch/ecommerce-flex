// Genera CSS variables desde theme.config.ts
// Se inyecta en el <head> via layout.tsx para que Tailwind las lea
import { themeConfig } from "@/theme.config";

const { styles } = themeConfig;

export function getThemeCSS(): string {
  return `
    :root {
      --bg-primary: ${styles.dark.bgPrimary};
      --bg-secondary: ${styles.dark.bgSecondary};
      --bg-card: ${styles.dark.bgCard};
      --bg-glass: ${styles.dark.bgGlass};
      --border-glass: ${styles.dark.borderGlass};
      --text-primary: ${styles.dark.textPrimary};
      --text-secondary: ${styles.dark.textSecondary};
      --text-muted: ${styles.dark.textMuted};
      --color-primary: ${styles.colors.primary};
      --color-primary-hover: ${styles.colors.primaryHover};
      --color-secondary: ${styles.colors.secondary};
      --color-accent: ${styles.colors.accent};
      --color-danger: ${styles.colors.danger};
      --color-success: ${styles.colors.success};
      --border-decorative: ${styles.decorativeBorder};
      --radius-card: ${styles.borderRadius.card};
      --radius-button: ${styles.borderRadius.button};
      --radius-pill: ${styles.borderRadius.pill};
    }
    [data-theme="light"] {
      --bg-primary: ${styles.light.bgPrimary};
      --bg-secondary: ${styles.light.bgSecondary};
      --bg-card: ${styles.light.bgCard};
      --bg-glass: ${styles.light.bgGlass};
      --border-glass: ${styles.light.borderGlass};
      --text-primary: ${styles.light.textPrimary};
      --text-secondary: ${styles.light.textSecondary};
      --text-muted: ${styles.light.textMuted};
    }
  `;
}
