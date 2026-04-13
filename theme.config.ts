// ============================================================
// CONFIGURACION DEL TEMA — ANDAX (tienda #1 sobre plataforma Ecomflex)
// ============================================================
// Este archivo viste a Ecomflex como ANDAX. Cambia los valores para
// transformar la tienda sin tocar el codigo. Pablo puede crear otras
// marcas en el futuro simplemente clonando este archivo y cambiando
// los valores — el codigo de Ecomflex queda intacto.
//
// Brand kit completo: docs/andax-brand-kit.md

export const themeConfig = {
  // === MARCA ===
  brand: {
    name: "ANDAX",
    tagline: "Anda con todo",
    description: "Suplementos premium argentinos para que andes con todo todos los dias. Creatina, magnesio, colageno, multivitaminicos y mas. Envios a todo el pais en 48h. RNPA oficial.",
    url: "https://andax.com.ar",                 // Pablo registra el dominio en nic.ar
    logo: "/andax-logo.svg",                      // Pablo sube el SVG a /public/
    useLogo: false,                               // false = muestra texto con Bricolage. Cambiar a true cuando haya SVG real.
    creator: "Mixeliq",
  },

  // === ESTILOS VISUALES ===
  styles: {
    // Tipografias — elegidas para evitar defaults over-used (Inter, Roboto, Montserrat)
    // Bricolage Grotesque: variable, expresiva, con movimiento — matchea con "Anda"
    // Plus Jakarta Sans: clean, moderna, excelente legibilidad
    fonts: {
      heading: "Bricolage Grotesque",
      body: "Plus Jakarta Sans",
    },

    // Bordes redondeados — suficientes para sentir modernidad sin caer en "balloon design"
    borderRadius: {
      card: "16px",
      button: "12px",
      pill: "100px",
    },

    // Borde decorativo del header — coral con alpha para que no grite
    decorativeBorder: "#FF6B35",

    // Colores principales (HEX aproximado de valores OKLCH — ver brand kit)
    colors: {
      // Coral vibrante — energia, movimiento, calor argentino
      primary: "#FF6B35",
      primaryHover: "#E85A2A",

      // Ocre calido — acento secundario, warnings, stock bajo
      secondary: "#F5C842",

      // Midnight navy — confianza, seriedad, contraste con el primary
      accent: "#0F1320",

      // Rojo calido desaturado — errores, sin stock
      danger: "#E53935",

      // Verde desaturado — confirmaciones, stock OK, pago exitoso
      success: "#3ECB7A",
    },

    // Tema oscuro (default) — navy con texto off-white
    dark: {
      bgPrimary: "#0F1320",            // Navy profundo, NO negro puro
      bgSecondary: "#181D2E",
      bgCard: "#232938",
      bgGlass: "rgba(255,255,255,0.04)",
      borderGlass: "rgba(255,255,255,0.08)",
      textPrimary: "#FCFAF8",          // Off-white calido, NO blanco puro
      textSecondary: "#A8A39C",
      textMuted: "#706B64",
    },

    // Tema claro — warm-tinted grays (gris con hint de coral)
    light: {
      bgPrimary: "#FCFAF8",            // Off-white calido, NO blanco puro
      bgSecondary: "#F7F3EF",
      bgCard: "#FFFFFF",
      bgGlass: "rgba(0,0,0,0.03)",     // NEGRO con alpha (regla: nunca blanco alpha en light mode)
      borderGlass: "rgba(0,0,0,0.10)",
      textPrimary: "#241F1B",          // Casi negro pero con hint warm, NO negro puro
      textSecondary: "#6B6560",
      textMuted: "#9A938B",
    },
  },

  // === CATEGORIAS DE PRODUCTOS ===
  categories: [
    { slug: "todos",       nombre: "Todos",       icono: "grid" },
    { slug: "destacados",  nombre: "Destacados",  icono: "star" },
    { slug: "ofertas",     nombre: "Ofertas",     icono: "tag" },
    { slug: "deportivo",   nombre: "Deportivo",   icono: "sparkles" },
    { slug: "wellness",    nombre: "Wellness",    icono: "box" },
  ],

  // === MONEDA Y PRECIOS ===
  currency: {
    code: "ARS",
    symbol: "$",
    locale: "es-AR",
    envioGratis: 50000,
  },

  // === PAGOS ===
  payments: {
    mercadopago: {
      enabled: true,
    },
    transferencia: {
      enabled: true,
      descuento: 10,
      datos: {
        // PABLO: cambia estos valores por tus datos reales antes de lanzar
        titular: "A completar",
        cbu: "A completar",
        alias: "A completar",
        banco: "A completar",
      },
    },
    crypto: {
      enabled: false,
      red: "BEP-20",
      wallet: "",
    },
  },

  // === CONTACTO ===
  contact: {
    // PABLO: cambia estos por los reales
    whatsapp: "5491100000000",
    email: "contacto@andax.com.ar",
    instagram: "andax.ar",
    horario: "Lunes a Viernes 9 a 18hs",
  },

  // === ASISTENTE VIRTUAL ===
  // En el Brand Kit se decidio "Andi" como nombre del asistente — diminutivo de ANDAX,
  // personal, cercano, rioplatense.
  assistant: {
    name: "Andi",
    avatar: "/assistant-avatar.jpg",
    greeting: "Hola, soy Andi. Contame que necesitas y te ayudo.",
    personality: "Cercana, rioplatense, directa. Usa voseo siempre (anda, tenes, podes). Respuestas cortas y accionables. Nunca usa lenguaje medico/clinico ni promete curas. Recomienda productos basandose en lo que el cliente le cuenta, no empuja ventas. Si no sabe algo, lo dice y ofrece contacto por WhatsApp.",
    faq: [
      { label: "Como hago un pedido?",           message: "Como hago para comprar? Contame el paso a paso." },
      { label: "Que suplemento me conviene?",    message: "Necesito que me recomiendes un suplemento. Contame cuales hay." },
      { label: "Medios de pago y cuotas",        message: "Que medios de pago aceptan? Tienen cuotas sin interes?" },
      { label: "Envios y tiempos",               message: "Como funcionan los envios? Cuanto tardan?" },
      { label: "Tengo un problema con mi pedido", message: "Tengo un problema con mi pedido, me pueden ayudar?" },
    ],
  },

  // === REDES SOCIALES ===
  // PABLO: completar con los handles reales una vez registrados
  social: {
    instagram: "andax.ar",
    facebook: "andaxoficial",
    tiktok: "andax.ar",
    twitter: "andax_ar",
  },

  // === SEO ===
  seo: {
    keywords: [
      "suplementos argentina",
      "suplementos deportivos",
      "creatina monohidrato",
      "magnesio bisglicinato",
      "colageno hidrolizado",
      "multivitaminico argentina",
      "suplementos online",
      "envios a todo el pais",
      "andax",
    ],
    ogImage: "/opengraph-image",
    themeColor: "#FF6B35",
  },

  // === HOME PAGE ===
  home: {
    hero: {
      title: "Anda con todo.",
      titleHighlight: "Todos los dias.",
      subtitle: "Suplementos premium para que tu cuerpo rinda al maximo. Energia, descanso, fuerza. Sin vueltas. RNPA oficial y envios a todo el pais en 48 horas.",
      ctaPrimary: { text: "Ver productos", href: "/productos" },
      ctaSecondary: { text: "Conoce ANDAX", href: "/nosotros" },
    },
    features: [
      { title: "Envio en 48h",          description: "Lo despachamos el mismo dia",           icon: "truck" },
      { title: "Calidad real",          description: "Productos con RNPA oficial",            icon: "shield" },
      { title: "12 cuotas sin interes", description: "MercadoPago o transferencia 10% OFF",   icon: "headphones" },
    ],
    showReviews: true,
    showInviteFriends: true,
  },
} as const;

export type ThemeConfig = typeof themeConfig;
