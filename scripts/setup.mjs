#!/usr/bin/env node
// ============================================================
// ECOMFLEX — SETUP WIZARD
// ============================================================
// Un cliente clona el repo y corre `npm run setup`. Este script le hace
// 10 preguntas y le deja la tienda lista en modo demo listo-para-editar.
//
// Qué hace:
//   1. Pregunta nombre de marca, tagline, colores, moneda, contacto
//   2. Reescribe theme.config.ts con los valores ingresados (preserva el resto)
//   3. Crea/actualiza .env.local con DEMO_MODE=true + NEXTAUTH_URL
//   4. Limpia el carrito/localStorage del navegador (instrucción al usuario)
//   5. Imprime los próximos pasos
//
// Uso:
//   npm run setup                  # modo interactivo
//   npm run setup -- --yes         # acepta todos los defaults (CI)
//
// REGLA ECOMFLEX: este script NO toca componentes, solo config. Si necesitás
// cambios en JSX, es bug del componente — reportalo.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const THEME_CONFIG_PATH = join(ROOT, "theme.config.ts");
const ENV_LOCAL_PATH = join(ROOT, ".env.local");

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

const log = {
  title: (s) => console.log(`\n${ANSI.bold}${ANSI.cyan}${s}${ANSI.reset}`),
  success: (s) => console.log(`${ANSI.green}✓${ANSI.reset} ${s}`),
  warn: (s) => console.log(`${ANSI.yellow}⚠${ANSI.reset} ${s}`),
  error: (s) => console.log(`${ANSI.red}✗${ANSI.reset} ${s}`),
  dim: (s) => console.log(`${ANSI.dim}${s}${ANSI.reset}`),
};

// ============================================================
// PREGUNTAS
// ============================================================

const QUESTIONS = [
  { key: "brandName",        q: "Nombre de tu marca",                              default: "ANDAX" },
  { key: "brandTagline",     q: "Tagline (una frase corta)",                       default: "Anda con todo" },
  { key: "brandDescription", q: "Descripcion SEO (2 lineas, usada en metadata)",   default: "Suplementos premium argentinos. Envios a todo el pais en 48h." },
  { key: "brandUrl",         q: "URL del dominio (sin https://)",                  default: "andax.com.ar" },
  { key: "colorPrimary",     q: "Color primario (hex)",                            default: "#FF6B35" },
  { key: "colorPrimaryHover",q: "Color primario hover (hex)",                      default: "#E85A2A" },
  { key: "colorAccent",      q: "Color accent/background navy (hex)",              default: "#0F1320" },
  { key: "contactWhatsapp",  q: "WhatsApp (solo numeros, con codigo pais)",        default: "5491100000000" },
  { key: "contactEmail",     q: "Email de contacto",                               default: "contacto@andax.com.ar" },
  { key: "currencyCode",     q: "Moneda (ej ARS, USD, MXN)",                       default: "ARS" },
  { key: "freeShippingAt",   q: "Envio gratis desde (monto)",                      default: "50000" },
];

async function askQuestions(acceptDefaults) {
  if (acceptDefaults) {
    const answers = {};
    for (const { key, default: def } of QUESTIONS) answers[key] = def;
    return answers;
  }

  const rl = createInterface({ input, output });
  const answers = {};
  for (const { key, q, default: def } of QUESTIONS) {
    const prompt = `  ${q} ${ANSI.dim}[${def}]${ANSI.reset}: `;
    const ans = (await rl.question(prompt)).trim();
    answers[key] = ans || def;
  }
  rl.close();
  return answers;
}

// ============================================================
// MUTATORS
// ============================================================

// Reemplaza el VALOR de una propiedad dentro de theme.config.ts preservando el resto.
// Usa regex balanceado simple — funciona porque el shape de theme.config es estable.
function replaceThemeValue(source, path, newValue) {
  // path es algo como "brand.name" o "styles.colors.primary"
  // newValue ya viene quoted si es string (ej `"ANDAX"`)
  const [, ...keys] = ["_", ...path.split(".")];
  const lastKey = keys[keys.length - 1];

  // Regex que matchea `    lastKey: "valor viejo",` con el string nuevo
  const regex = new RegExp(
    `(\\b${lastKey}:\\s*)("[^"]*"|\\d+(?:\\.\\d+)?|true|false)`,
    "m",
  );
  if (!regex.test(source)) {
    log.warn(`No encontre ${path} en theme.config.ts — saltando (puede que ya lo hayas cambiado a mano)`);
    return source;
  }
  return source.replace(regex, `$1${newValue}`);
}

function quote(s) {
  return `"${s.replace(/"/g, '\\"')}"`;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const acceptDefaults = process.argv.includes("--yes") || process.argv.includes("-y");

  console.log(`${ANSI.bold}${ANSI.cyan}
╔════════════════════════════════════════════╗
║       ECOMFLEX — SETUP DE NUEVA MARCA      ║
╚════════════════════════════════════════════╝
${ANSI.reset}`);
  log.dim("Este wizard te va a dejar tu tienda configurada en 1 minuto.");
  log.dim("Enter = usar el valor por defecto. Podes editar theme.config.ts despues.\n");

  if (!existsSync(THEME_CONFIG_PATH)) {
    log.error(`No encuentro theme.config.ts en ${THEME_CONFIG_PATH}`);
    process.exit(1);
  }

  log.title("1/3  Datos de tu marca");
  const a = await askQuestions(acceptDefaults);

  // ===== theme.config.ts =====
  log.title("2/3  Escribiendo theme.config.ts");
  let theme = readFileSync(THEME_CONFIG_PATH, "utf8");

  theme = replaceThemeValue(theme, "brand.name", quote(a.brandName));
  theme = replaceThemeValue(theme, "brand.tagline", quote(a.brandTagline));
  theme = replaceThemeValue(theme, "brand.description", quote(a.brandDescription));
  theme = replaceThemeValue(theme, "brand.url", quote(`https://${a.brandUrl}`));
  theme = replaceThemeValue(theme, "styles.colors.primary", quote(a.colorPrimary));
  theme = replaceThemeValue(theme, "styles.colors.primaryHover", quote(a.colorPrimaryHover));
  theme = replaceThemeValue(theme, "styles.colors.accent", quote(a.colorAccent));
  theme = replaceThemeValue(theme, "styles.decorativeBorder", quote(a.colorPrimary));
  theme = replaceThemeValue(theme, "themeColor", quote(a.colorPrimary));
  theme = replaceThemeValue(theme, "contact.whatsapp", quote(a.contactWhatsapp));
  theme = replaceThemeValue(theme, "contact.email", quote(a.contactEmail));
  theme = replaceThemeValue(theme, "currency.code", quote(a.currencyCode));
  theme = replaceThemeValue(theme, "currency.envioGratis", a.freeShippingAt);
  theme = replaceThemeValue(theme, "pwaName", quote(a.brandName));
  theme = replaceThemeValue(theme, "pwaShortName", quote(a.brandName));
  theme = replaceThemeValue(theme, "pwaDescription", quote(a.brandDescription));
  theme = replaceThemeValue(theme, "pwaThemeColor", quote(a.colorPrimary));
  theme = replaceThemeValue(theme, "pwaBackgroundColor", quote(a.colorAccent));

  writeFileSync(THEME_CONFIG_PATH, theme);
  log.success("theme.config.ts actualizado");

  // ===== .env.local =====
  log.title("3/3  Escribiendo .env.local");
  const envContent = `# ==========================================
# ${a.brandName} sobre Ecomflex — .env.local
# ==========================================
# Generado por scripts/setup.mjs. Editar a mano si necesitas.

# MODO DEMO: activa datos hardcodeados de lib/demo-data.ts para correr
# localhost sin Google Sheets. Eliminalo cuando conectes tu propia Sheet.
DEMO_MODE=true
NEXT_PUBLIC_DEMO_MODE=true

# NextAuth (solo necesario cuando salgas de demo)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change-me-in-production

# ==========================================
# Cuando salgas de demo, completar estos:
# ==========================================
# GOOGLE_SHEETS_PUBLIC_ID=
# GOOGLE_SHEETS_PRIVATE_ID=
# GOOGLE_SHEETS_CLIENT_EMAIL=
# GOOGLE_SHEETS_PRIVATE_KEY=
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# MERCADOPAGO_ACCESS_TOKEN=
# MERCADOPAGO_PUBLIC_KEY=
# MERCADOPAGO_WEBHOOK_SECRET=
# OPENAI_API_KEY=
`;

  writeFileSync(ENV_LOCAL_PATH, envContent);
  log.success(".env.local creado en modo DEMO");

  // ===== Next steps =====
  console.log(`\n${ANSI.bold}${ANSI.green}Listo! Tu tienda se llama "${a.brandName}".${ANSI.reset}\n`);
  log.title("Proximos pasos");
  console.log("  1. npm install");
  console.log("  2. npm run dev");
  console.log(`  3. Abri http://localhost:3000 — vas a ver ${a.brandName} funcionando con datos demo`);
  console.log(`  4. Edita ${ANSI.cyan}lib/demo-data.ts${ANSI.reset} para cambiar los productos demo`);
  console.log(`  5. Edita ${ANSI.cyan}theme.config.ts${ANSI.reset} para ajustar colores/copy/categorias`);
  console.log(`  6. Cuando estes listo para vender: connect Google Sheets (ver README)\n`);
  log.dim("Ver docs/superpowers/specs/2026-04-11-ecomflex-design.md para la arquitectura completa.\n");
}

main().catch((err) => {
  log.error(`Setup fallo: ${err.message}`);
  process.exit(1);
});
