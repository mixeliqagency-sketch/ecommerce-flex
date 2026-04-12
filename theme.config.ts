// ============================================================
// CONFIGURACION DEL TEMA — Edita este archivo para personalizar tu tienda
// ============================================================
// Este es el UNICO archivo que necesitas cambiar para tener tu propia tienda.
// Cambia los valores abajo y toda la app se adapta automaticamente.

export const themeConfig = {
  // === MARCA ===
  brand: {
    name: "MiTienda",                          // Nombre de tu marca
    tagline: "Tu tienda online de confianza",   // Slogan corto
    description: "Compra los mejores productos online con envio a todo el pais. Ofertas, calidad y atencion personalizada.",
    url: "https://mititienda.vercel.app",       // URL de produccion
    logo: "/logo.svg",                          // Ruta al logo en /public/
    useLogo: false,                             // true = mostrar imagen, false = mostrar texto con tipografia
    creator: "Mixeliq",
  },

  // === ESTILOS VISUALES ===
  // Cambia estos valores para transformar completamente el look & feel.
  styles: {
    // Tipografias (Google Fonts) — se cargan automaticamente
    fonts: {
      heading: "Space Grotesk",    // Titulos (ej: "Playfair Display", "Poppins", "Montserrat")
      body: "Inter",               // Texto general (ej: "Open Sans", "Roboto", "Lato")
    },

    // Bordes redondeados
    borderRadius: {
      card: "16px",                // Cards de producto, secciones
      button: "12px",              // Botones
      pill: "100px",               // Pills de categoria, badges
    },

    // Borde decorativo del header/nav (color champagne dorado)
    // Cambialo a "transparent" para quitarlo, o a cualquier color
    decorativeBorder: "#C9A96E",

    // Colores principales
    colors: {
      // Color principal — botones, links activos, badges, CTA
      primary: "#10B981",
      // Version hover del primario (un poco mas claro o mas oscuro)
      primaryHover: "#059669",

      // Color secundario — ofertas, descuentos, alertas
      secondary: "#F59E0B",

      // Color de acento — informacion, links secundarios
      accent: "#3B82F6",

      // Color de peligro/error — stock bajo, errores, cerrar sesion
      danger: "#EF4444",

      // Color de exito — confirmaciones, badges verificados
      success: "#34D399",
    },

    // Tema oscuro (default)
    dark: {
      bgPrimary: "#0A0A0B",          // Fondo principal
      bgSecondary: "#141416",        // Fondo secundario (footer, nav, sidebars)
      bgCard: "#1C1C1F",            // Fondo de cards
      bgGlass: "rgba(255,255,255,0.04)",  // Fondo glass/blur
      borderGlass: "rgba(255,255,255,0.08)", // Bordes sutiles
      textPrimary: "#FFFFFF",        // Texto principal
      textSecondary: "#9CA3AF",      // Texto secundario
      textMuted: "#6B7280",          // Texto muy sutil
    },

    // Tema claro
    light: {
      bgPrimary: "#FFFFFF",
      bgSecondary: "#F5F5F5",
      bgCard: "#FFFFFF",
      bgGlass: "rgba(0,0,0,0.03)",
      borderGlass: "rgba(0,0,0,0.10)",
      textPrimary: "#111827",
      textSecondary: "#4B5563",
      textMuted: "#6B7280",
    },
  },

  // === CATEGORIAS DE PRODUCTOS ===
  categories: [
    { slug: "todos",       nombre: "Todos",       icono: "grid" },
    { slug: "destacados",  nombre: "Destacados",  icono: "star" },
    { slug: "ofertas",     nombre: "Ofertas",     icono: "tag" },
    { slug: "nuevos",      nombre: "Nuevos",      icono: "sparkles" },
    { slug: "accesorios",  nombre: "Accesorios",  icono: "box" },
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
        titular: "Tu Nombre o Razon Social",
        cbu: "0000000000000000000000",
        alias: "MI.TIENDA.ALIAS",
        banco: "Banco Ejemplo",
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
    whatsapp: "5491100000000",
    email: "contacto@mitienda.com",
    instagram: "",
    horario: "Lunes a Viernes 9 a 18hs",
  },

  // === ASISTENTE VIRTUAL ===
  assistant: {
    name: "Luna",
    avatar: "/assistant-avatar.jpg",
    greeting: "Hola! En que te puedo ayudar?",
    personality: "Amable, profesional y directa. Respuestas cortas y utiles.",
    faq: [
      { label: "Como hago un pedido?",          message: "Como hago para comprar? Explicame el proceso paso a paso." },
      { label: "Cuales son los medios de pago?", message: "Que medios de pago aceptan? Tienen cuotas?" },
      { label: "Como son los envios?",           message: "Como funcionan los envios? Tienen envio gratis?" },
      { label: "Necesito ayuda con mi pedido",   message: "Tengo un problema con mi pedido, me pueden ayudar?" },
    ],
  },

  // === REDES SOCIALES ===
  social: {
    instagram: "",
    facebook: "",
    tiktok: "",
    twitter: "",
  },

  // === SEO ===
  seo: {
    keywords: [
      "tienda online",
      "comprar online",
      "envio a todo el pais",
      "ofertas",
    ],
    ogImage: "/opengraph-image",
    themeColor: "#10B981",
  },

  // === HOME PAGE ===
  home: {
    hero: {
      title: "Los mejores productos",
      titleHighlight: "al mejor precio",
      subtitle: "Envios a todo el pais, multiples medios de pago y atencion personalizada.",
      ctaPrimary: { text: "Ver productos", href: "/productos" },
      ctaSecondary: { text: "Contactanos", href: "/contacto" },
    },
    features: [
      { title: "Envio rapido",     description: "Despacho en 24hs",              icon: "truck" },
      { title: "Pago seguro",      description: "MercadoPago + transferencia",   icon: "shield" },
      { title: "Atencion 24/7",    description: "Te respondemos siempre",        icon: "headphones" },
    ],
    showReviews: true,
    showInviteFriends: true,
  },
} as const;

export type ThemeConfig = typeof themeConfig;
