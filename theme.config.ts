// ============================================================
// CONFIGURACION DEL TEMA — Edita este archivo para personalizar tu tienda
// ============================================================
// Este es el UNICO archivo que necesitas cambiar para tener tu propia tienda.
// Cambia los valores abajo y toda la app se adapta automaticamente.

export const themeConfig = {
  // === MARCA ===
  brand: {
    name: "MiTienda",                          // Nombre de tu marca (aparece en header, footer, SEO)
    tagline: "Tu tienda online de confianza",   // Slogan corto (aparece en la home y SEO)
    description: "Compra los mejores productos online con envio a todo el pais. Ofertas, calidad y atencion personalizada.", // Descripcion larga para SEO
    url: "https://mititienda.vercel.app",       // URL de tu sitio en produccion
    logo: "/logo.svg",                          // Ruta al logo (ponerlo en /public/)
    logoFont: "var(--font-heading)",            // Tipografia del logo si usas texto en vez de imagen
    creator: "MiTienda",                        // Quien creo el sitio (para SEO)
  },

  // === COLORES ===
  // Estos se usan en botones, links, acentos, badges, etc.
  colors: {
    primary: "#10B981",       // Color principal (botones, links activos, badges)
    primaryLight: "#10B98120", // Version clara del primario (fondos de badges, hovers)
    secondary: "#F59E0B",     // Color secundario (ofertas, descuentos, alertas)
    accent: "#3B82F6",        // Color de acento (informacion, links secundarios)
    danger: "#EF4444",        // Color de error/peligro (stock bajo, errores)
  },

  // === CATEGORIAS DE PRODUCTOS ===
  // Define las categorias que aparecen en el filtro de la tienda.
  // El slug debe coincidir con la columna "categoria" de tu Google Sheet.
  categories: [
    { slug: "todos",       nombre: "Todos",       icono: "grid" },
    { slug: "destacados",  nombre: "Destacados",  icono: "star" },
    { slug: "ofertas",     nombre: "Ofertas",     icono: "tag" },
    { slug: "nuevos",      nombre: "Nuevos",      icono: "sparkles" },
    { slug: "accesorios",  nombre: "Accesorios",  icono: "box" },
  ],

  // === MONEDA Y PRECIOS ===
  currency: {
    code: "ARS",            // Codigo de moneda (ARS, USD, MXN, COP, etc.)
    symbol: "$",            // Simbolo que se muestra antes del precio
    locale: "es-AR",        // Locale para formatear numeros (es-AR, es-MX, en-US, etc.)
    envioGratis: 50000,     // Monto minimo para envio gratis (0 = siempre gratis)
  },

  // === PAGOS ===
  payments: {
    mercadopago: {
      enabled: true,
      // Las credenciales van en .env.local, NO aca
    },
    transferencia: {
      enabled: true,
      descuento: 10,        // Porcentaje de descuento por transferencia (0 = sin descuento)
      datos: {
        titular: "Tu Nombre o Razon Social",
        cbu: "0000000000000000000000",
        alias: "MI.TIENDA.ALIAS",
        banco: "Banco Ejemplo",
      },
    },
    crypto: {
      enabled: false,       // true para habilitar pagos con USDT
      red: "BEP-20",
      wallet: "",
    },
  },

  // === CONTACTO ===
  contact: {
    whatsapp: "5491100000000",   // Numero con codigo de pais, sin + ni espacios
    email: "contacto@mitienda.com",
    instagram: "",               // Solo el usuario, sin @
    horario: "Lunes a Viernes 9 a 18hs",
  },

  // === ASISTENTE VIRTUAL ===
  assistant: {
    name: "Luna",                            // Nombre de la asistente
    avatar: "/assistant-avatar.jpg",         // Foto de la asistente (ponerla en /public/)
    greeting: "Hola! En que te puedo ayudar?",
    personality: "Amable, profesional y directa. Respuestas cortas y utiles.",
    faq: [
      { label: "Como hago un pedido?",          message: "Como hago para comprar? Explicame el proceso paso a paso." },
      { label: "Cuales son los medios de pago?", message: "Que medios de pago aceptan? Tienen cuotas?" },
      { label: "Como son los envios?",           message: "Como funcionan los envios? Tienen envio gratis?" },
      { label: "Necesito ayuda con mi pedido",   message: "Tengo un problema con mi pedido, me pueden ayudar?" },
    ],
  },

  // === REDES SOCIALES (para footer y SEO) ===
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
    ogImage: "/opengraph-image",   // Imagen para compartir en redes (1200x630)
    themeColor: "#10B981",         // Color de la barra del navegador en mobile
  },

  // === HOME PAGE ===
  home: {
    hero: {
      title: "Los mejores productos",
      titleHighlight: "al mejor precio",       // Parte del titulo que se resalta con el color primario
      subtitle: "Envios a todo el pais, multiples medios de pago y atencion personalizada.",
      ctaPrimary: { text: "Ver productos", href: "/productos" },
      ctaSecondary: { text: "Contactanos", href: "/contacto" },
    },
    features: [
      { title: "Envio rapido",     description: "Despacho en 24hs",     icon: "truck" },
      { title: "Pago seguro",      description: "MercadoPago + transferencia", icon: "shield" },
      { title: "Atencion 24/7",    description: "Te respondemos siempre",      icon: "headphones" },
    ],
    showReviews: true,       // Mostrar carrusel de resenas en la home
    showInviteFriends: true, // Mostrar seccion de invitar amigos
  },
} as const;

// Tipo exportado para autocompletado en toda la app
export type ThemeConfig = typeof themeConfig;
