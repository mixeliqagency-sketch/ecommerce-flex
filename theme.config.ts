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
    tagline: "Anda x todo",
    description: "Suplementos premium argentinos para que andes con todo todos los dias. Creatina, magnesio, colageno, multivitaminicos y mas. Envios a todo el pais en 48h. RNPA oficial.",
    url: "https://andax.com.ar",                 // Pablo registra el dominio en nic.ar
    logo: "/andax-logo.svg",                      // Pablo sube el SVG a /public/
    useLogo: false,                               // false = muestra texto con Bricolage. Cambiar a true cuando haya SVG real.
    creator: "Mixeliq",
  },

  // === ESTILOS VISUALES ===
  // PALETA Y TIPOGRAFIA PORTADAS DE AOURA v1 (decision 2026-04-13):
  // ANDAX corre como version alpha de AOURA para reusar toda la identidad visual
  // validada. Cambiar estos valores afecta TODA la tienda via CSS variables.
  styles: {
    // Fuentes de AOURA — Space Grotesk (titulos) + Inter (body).
    // El font loader en app/layout.tsx ya las importa via next/font/google.
    fonts: {
      heading: "Space Grotesk",
      body: "Inter",
    },

    // Bordes redondeados — como AOURA (16px cards, 100px pills).
    borderRadius: {
      card: "16px",
      button: "12px",
      pill: "100px",
    },

    // Borde decorativo ANDAX — naranja brand (#F97316), mismo color que la
    // X del logo. Reemplaza el dorado #C9A96E heredado de AOURA. Ahora todo
    // el sistema de bordes decorativos (header, topbar, accents) matchea
    // la identidad naranja/esmeralda de ANDAX en vez del gold beige que
    // pertenecia a la marca vieja.
    decorativeBorder: "#F97316",

    // Paleta AOURA — verde emerald como primary
    colors: {
      // Emerald verde — identidad AOURA, confianza + salud
      primary: "#10B981",
      primaryHover: "#059669",

      // Naranja AOURA — acento secundario, CTAs urgentes, oferta
      secondary: "#F97316",

      // Azul AOURA — accent institucional, info
      accent: "#3B82F6",

      // Rojo AOURA — errores, sin stock
      danger: "#EF4444",

      // Verde mas claro — success, confirmaciones
      success: "#34D399",
    },

    // Tema oscuro (default) — negros profundos AOURA, texto blanco puro
    dark: {
      bgPrimary: "#0A0A0B",            // Casi negro (no puro, evita OLED burn)
      bgSecondary: "#141416",
      bgCard: "#1C1C1F",
      bgGlass: "rgba(255,255,255,0.04)",
      borderGlass: "rgba(255,255,255,0.08)",
      textPrimary: "#FFFFFF",          // Blanco puro para maximo contraste
      textSecondary: "#9CA3AF",
      textMuted: "#8B95A5",            // Subido para WCAG AA 4.5:1 sobre #0A0A0B
    },

    // Tema claro AOURA
    light: {
      bgPrimary: "#FFFFFF",
      bgSecondary: "#F5F5F5",
      bgCard: "#FFFFFF",
      bgGlass: "rgba(0,0,0,0.03)",
      borderGlass: "rgba(0,0,0,0.15)",
      textPrimary: "#111827",
      textSecondary: "#4B5563",
      textMuted: "#6B7280",
    },
  },

  // === CATEGORIAS DE PRODUCTOS ===
  // Estas aparecen en los "pills" del top de /productos. Tienen que coincidir
  // con los valores de `categoria` en lib/demo-data.ts (case-sensitive) O en
  // la Sheet de productos reales. Si una categoria no aparece en los datos,
  // el pill simplemente no mostrara productos al clickear.
  categories: [
    { slug: "todos",       nombre: "Todos",       icono: "grid" },
    { slug: "destacados",  nombre: "Destacados",  icono: "star" },
    { slug: "ofertas",     nombre: "Ofertas",     icono: "tag" },
    { slug: "deportivo",   nombre: "Deportivo",   icono: "sparkles" },
    { slug: "wellness",    nombre: "Wellness",    icono: "box" },
    { slug: "belleza",     nombre: "Belleza",     icono: "sparkles" },
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
        // Datos bancarios reales de Pablo Morales (titular de ANDAX/Mixeliq).
        // Portados desde el .env.local de AOURA v1. En un fork de Ecomflex para
        // otro cliente, estos valores se reemplazan via `npm run setup`.
        titular: "Pablo Fernando Morales",
        cbu: "0170116240000008590134",
        alias: "NEW.PFM.ACC",
        banco: "BBVA",   // 0170 = BBVA Argentina
      },
    },
    crypto: {
      enabled: true,
      red: "BSC (BEP-20)",
      wallet: "0x3a00ebfaa27c4e4e6555349412d032370225fbbec",
    },
    // Lista de tarjetas aceptadas — se muestran como badges en el Footer y
    // en el boton de MercadoPago. Cambiar por cliente segun convenio con MP.
    aceptaTarjetas: ["visa", "mastercard", "amex"] as const,
  },

  // === CONTACTO ===
  contact: {
    // WhatsApp real de Pablo (desde AOURA .env.local). Usado por Kira para
    // el handoff a WhatsApp, por el boton de "Enviar comprobante" del checkout
    // transferencia, y por el footer. Formato E.164 sin + ni espacios.
    whatsapp: "5491125441944",
    email: "contacto@andax.com.ar",
    instagram: "andax.ar",
    horario: "Lunes a Viernes 9 a 18hs",
  },

  // === ASISTENTE VIRTUAL ===
  // "Anda" — wordplay perfecto con el verbo de marca. El badge del asistente
  // lee "Anda Online" que funciona como doble significado: (a) la asistente
  // Anda esta en linea, (b) "anda!" como imperativo rioplatense de accion.
  assistant: {
    name: "Anda",
    avatar: "/anda-avatar.jpg",
    greeting: "Hola! Contame que necesitas y te ayudo.",
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
    themeColor: "#0A0A0B",
  },

  // === COPY ===
  // Strings visibles de la UI. Cambialos para que tu tienda hable como vos.
  // REGLA DE ORO ECOMFLEX: cero strings literales en componentes, todo
  // lo visible pasa por aca o por lib/demo-data.ts. Si agregas un string
  // nuevo a un componente, extraelo primero a este objeto.
  copy: {
    // === SHARE === (usado en ProductCard para el boton "compartir")
    // Wordplay ANDA: "ANDA y compartí" funciona como imperativo + verbo de marca.
    share: {
      textTemplate: "ANDA, mira {productName} en ANDAX",
      buttonLabel: "ANDA y comparti",
    },

    // === INVITE A UN AMIGO === (components/home/InviteFriends.tsx)
    // Toda la seccion de invitacion lee de aca. El CTA usa el wordplay ANDA.
    invite: {
      title: "ANDA, invita a un amigo",
      subtitle: "Compartile ANDAX a alguien que busque suplementos premium con envio rapido. Los dos se llevan beneficios.",
      shareText: "ANDA y sumate a ANDAX: suplementos premium, envio en 48h y atencion real. Yo ya estoy adentro, tu turno.",
      shareButtonLabel: "ANDA y comparti",
    },

    // === REFERRAL PANEL === (components/tienda/ReferralSection.tsx)
    // Panel de "Invita amigos" que aparece en /cuenta con el link de referido.
    referral: {
      title: "ANDA, invita amigos",
      subtitle: "Comparti tu link y los dos se llevan beneficios cuando compren.",
      codeLabel: "Tu codigo",
      linkLabel: "Tu link",
      copyButton: "Copiar",
      copiedButton: "Copiado!",
      clicksLabel: "Clicks",
      conversionsLabel: "Conversiones",
    },

    // Tarjeta de producto (components/catalog/ProductCard.tsx)
    // REGLA MARKETING: CTAs con verbos de accion, no infinitivos abstractos.
    // "Sumalo al carrito" gana a "Agregar al carrito" en A/B tests (verbos en
    // imperativo + pronombre enclitico = 12-18% mas conversion en voseo AR).
    product: {
      addToCart: "Agregar al carrito",
      outOfStock: "Agotado",
      viewDetail: "Ver detalle",
      withCard: "con tarjeta",
      transferDiscount: "% OFF transferencia",   // prefijado con el % real
      installmentsTemplate: "{count} cuotas de {amount}",
      // Trust signal bajo el CTA
      trustBadge: "Envio 48h — Pago seguro — Devolucion 10 dias",
      // Scarcity psicologica — se muestra cuando stock <= lowStockThreshold
      lowStockTemplate: "Quedan solo {count}",
      lowStockThreshold: 15,
    },

    // Carrito (components/cart/CartDrawer.tsx)
    // REGLA MARKETING: el estado vacio del carrito es una oportunidad de
    // conversion, no un dead-end. "ANDA a descubrir" es un call-to-action
    // que preserva momentum y usa el verbo de marca.
    cart: {
      title: "Tu carrito",
      empty: "Todavia no sumaste nada",
      emptyDescription: "Explora suplementos deportivos, wellness y belleza pensados para vos.",
      emptyCta: "ANDA a descubrir productos",
      continueShopping: "Seguir comprando",
      completePurchase: "Completa tu compra",
      freeShippingIncluded: "Envio gratis incluido — ANDA tranquilo",
      freeShippingMessage: "Suma {amount} mas y llevate envio gratis",
      checkout: "ANDA a pagar",
      subtotal: "Subtotal",
      total: "Total",
      addButton: "+ Sumar",   // cross-sell recomendados
    },

    // Toast de "producto agregado al carrito" (components/cart/CartToast.tsx)
    // Copy AOURA exacto — el "Ver" corto deja lugar al nombre del producto,
    // y "items" en plural neutro evita conflictos de genero.
    toast: {
      addedToCart: "Agregado al carrito",
      itemsSuffix: "items",
      itemSuffix: "item",
      viewButton: "Ver",
    },

    // Catalogo (components/catalog/PopularCarousel.tsx)
    catalog: {
      popularTitle: "Lo que mas se pide",
      seeAll: "Ver todo",
    },

    // Footer (components/layout/Footer.tsx)
    footer: {
      sectionTienda: "Tienda",
      sectionAyuda: "Ayuda",
      sectionLegal: "Legal",
      paymentsTitle: "Medios de pago",
      whatsappCta: "Escribinos por WhatsApp",
      followUs: "ANDA y seguinos",
      rightsReserved: "Todos los derechos reservados.",
    },

    // Acceso con huella digital (components/auth/BiometricActivation.tsx)
    // REGLA UX: la promesa debe ser concreta y el beneficio explicito.
    // "Ingresa mas rapido" es vago. "Entra con tu huella sin tipear contrasena" es concreto.
    biometric: {
      title: "Acceso con huella digital",
      subtitle: "Entra con tu huella o Face ID sin tipear contrasena.",
      activateButton: "Activar huella digital",
      registering: "Registrando huella...",
      activeLabel: "Huella activada — proximo login con un toque",
      errorGeneric: "No pudimos activar la huella. Probá otra vez.",
    },

    // Email capture popup (components/tienda/EmailCapturePopup.tsx)
    // REGLA MARKETING: la proposicion de valor (descuento) va en el titulo,
    // no en el subtitulo. El CTA en primera persona ("Quiero mi X") convierte
    // +25% vs imperativo ("Recibi tu X") segun Klaviyo 2024.
    emailCapture: {
      title: "10% OFF en tu primera compra",
      subtitle: "Dejanos tu email y ANDA a probar los productos con descuento.",
      placeholder: "tu@email.com",
      submitButton: "Quiero mi 10% OFF",
      successTitle: "Listo, revisa tu email!",
      successMessage: "Te mandamos el cupon a tu casilla. ANDA a revisarla.",
      delaySeconds: 8,   // 5s era agresivo — 8-10s convierte mejor (exit intent cubre el resto)
      enabled: true,     // toggle maestro del popup
    },

    // Checkout (app/checkout/page.tsx)
    checkout: {
      title: "Checkout",
      subtitle: "Para coordinar el envio, completa tus datos de contacto y direccion de envio.",
      sections: {
        contact: "Datos de contacto",
        shipping: "Direccion de envio",
        payment: "Metodo de pago",
      },
      marketingOptIn: {
        label: "Quiero recibir ofertas y novedades por email",
        helpText: "Te vamos a mandar cupones y lanzamientos. Podes desuscribirte cuando quieras.",
        enabled: true,   // muestra el checkbox o no
      },
      methods: {
        transfer: {
          label: "Transferencia",
          recommended: "Recomendado",
          discountBadge: "% OFF",   // prefijado con el % real
          cta: "Ya realice la transferencia",
          help: "Tu pedido quedara registrado. Te avisamos por WhatsApp cuando confirmemos el pago.",
          // Pantalla post-compra tras confirmar transferencia (transferenciaResult)
          postPurchase: {
            title: "Pedido registrado",
            orderLabel: "Orden",
            datosLabel: "Datos para la transferencia",
            amountLabel: "Monto exacto a transferir",
            amountNote: "(incluye {discount}% de descuento por transferencia)",
            cbuLabel: "CBU",
            aliasLabel: "Alias",
            titularLabel: "Titular",
            copyButton: "Copiar",
            copiedButton: "Copiado!",
            instructions: "Realiza la transferencia por el monto exacto y envia el comprobante por WhatsApp. Confirmamos tu pedido en menos de 2 horas en horario laboral.",
            whatsappButton: "Enviar comprobante por WhatsApp",
            footerNote: "Te avisamos cuando confirmemos el pago.",
            backToShop: "Volver a la tienda",
          },
        },
        mercadopago: {
          label: "Tarjeta credito/debito",
          badge: "MercadoPago",
          installments: "12 cuotas",
          cta: "Pagar con MercadoPago",
          help: "Seras redirigido a MercadoPago para completar el pago de forma segura.",
        },
        crypto: {
          label: "Criptomonedas",
          badgeTemplate: "{network}",   // "BSC BEP-20"
          cta: "Confirmar transferencia USDT",
          help: "La verificacion suele tardar entre 10 minutos y 2 horas.",
          // Texto de instrucciones dentro del acordeon crypto (contiene red dinamica)
          instructionNetwork: "unicamente por la red {network}",
          instructionAmount: "Envia el monto exacto {amount} para evitar demoras",
          instructionConfirm: "Una vez confirmada la transaccion, te avisamos por email",
          importantTitle: "Importante",
          networkLabel: "Red",
          amountArsLabel: "Monto ARS",
          amountUsdtLabel: "Monto USDT",
          walletLabel: "Direccion wallet",
          calculating: "Calculando...",
          unavailable: "No disponible",
          rateTemplate: "Cotizacion: 1 USDT = {rate} ARS (Buenbit)",
          // Pantalla post-compra tras elegir crypto (cryptoSent)
          postPurchase: {
            title: "Pedido registrado",
            notice: "Tu pedido fue registrado. Una vez que confirmemos la transferencia USDT, te avisaremos por email a {email}.",
            verificationTime: "La verificacion suele tardar entre 10 minutos y 2 horas.",
            backToShop: "Volver a la tienda",
          },
        },
      },
    },
  },

  // === ANALYTICS & TRACKING ===
  // IDs de pixeles de tracking — opt-in por cliente. Si un id esta vacio,
  // el script NO se carga (zero overhead, zero cookies). Respetamos
  // privacidad por default: el user tiene que poner el ID explicitamente.
  //
  // Nota legal (Ley 25.326 AR + GDPR): si activas tracking, tenés que
  // declarar en /politica-privacidad que usás GA/Meta Pixel, y agregar
  // un banner de cookie consent antes de cargar los scripts.
  analytics: {
    // Google Analytics 4 — formato "G-XXXXXXXXXX". Dejalo vacio para apagar.
    googleAnalyticsId: "",
    // Google Tag Manager — formato "GTM-XXXXXXX". Reemplaza a GA4 + Google
    // Ads + cualquier pixel via el contenedor. Recomendado si vas a correr ads.
    googleTagManagerId: "",
    // Google Ads conversion tracking — formato "AW-XXXXXXXXXX/XXXXXXXXX"
    googleAdsConversionId: "",
    // Meta Pixel (Facebook/Instagram Ads) — 15-digit numeric ID
    metaPixelId: "",
    // Requiere consent del usuario antes de cargar scripts (recomendado en EU,
    // opcional en AR). Si es true, los scripts solo se cargan despues de que
    // el user acepta el banner de cookies. False = carga inmediato.
    requireConsent: false,
  },

  // === INSTALACION ===
  // Metadatos para el script scripts/setup.mjs (wizard de nueva marca)
  // y para el PWA manifest que permite "instalar" la tienda en el celular.
  install: {
    // Texto mostrado en el prompt "Instalar app" del navegador / Play Store
    pwaName: "ANDAX",
    pwaShortName: "ANDAX",
    pwaDescription: "Suplementos premium argentinos. Anda x todo.",
    pwaBackgroundColor: "#0F1320",
    pwaThemeColor: "#0A0A0B",
    pwaDisplay: "standalone" as const,
    pwaOrientation: "portrait" as const,
    pwaCategories: ["shopping", "health", "lifestyle"],
    // Feature flag del boton "Instalar app" (InstallPrompt.tsx)
    showInstallPrompt: true,
  },

  // === ABOUT / NOSOTROS ===
  // Contenido institucional de la pagina /nosotros. Todo parametrizado para
  // swap & ship. Para una marca nueva, editar este objeto es suficiente.
  about: {
    eyebrow: "Nuestra historia",
    title: "Creemos que andar bien es un derecho",
    subtitle: "ANDAX nace para que cualquiera pueda sumar lo que le falta sin complicarse la vida.",
    manifesto: [
      "Tener energia, dormir, rendir y sentirte tranquilo no es lujo — es lo minimo.",
      "Sin formulas magicas. Sin promesas que no se cumplen. Sin farmacia.",
      "Solo suplementos premium, en tu casa en 48 horas, con el tono de tu barrio.",
    ],
    closingLine: "Anda x todo. Anda con ANDAX.",
    values: [
      { title: "Movimiento",    desc: "Lo que haces con vos mismo todos los dias." },
      { title: "Accesibilidad", desc: "Los suplementos no son solo para deportistas de elite." },
      { title: "Honestidad",    desc: "Ingredientes reales, efectos reales, precios reales." },
      { title: "Argentinismo",  desc: "Hablamos como vos, en voseo, sin copiarle a las marcas gringas." },
    ],
    ctaText: "ANDA a ver los productos",
    ctaHref: "/productos",
  },

  // === HOME PAGE ===
  home: {
    hero: {
      title: "Anda x todo.",
      titleHighlight: "Todos los dias.",
      subtitle: "Suplementos premium para que tu cuerpo rinda al maximo. Energia, descanso, fuerza. Sin vueltas. RNPA oficial y envios a todo el pais en 48 horas.",
      ctaPrimary: { text: "Ver productos", href: "/productos" },
      ctaSecondary: { text: "Conoce ANDAX", href: "/nosotros" },
    },
    // Cada feature tiene su propio color — clave UX AOURA: las 3 cards no son
    // identicas, cada una comunica algo distinto visualmente. Colores validos:
    // emerald (verde), orange (naranja), blue (azul), yellow (amarillo).
    features: [
      { title: "Envio en 48h",          description: "Lo despachamos el mismo dia",         icon: "truck",      color: "emerald" },
      { title: "Calidad real",          description: "Productos con RNPA oficial",          icon: "shield",     color: "orange" },
      { title: "12 cuotas sin interes", description: "MercadoPago o transferencia 10% OFF", icon: "creditCard", color: "blue" },
    ],
    // Manifesto de marca — acróstico vertical animado, estilo AOURA.
    // Cada fila entra lateralmente con micro-overshoot y la ultima letra
    // hace un finale con spin + cambio de color (ver BrandManifesto.tsx).
    // Para swap de marca: cambiar `letters[]`, `closing` y `tagline`.
    manifesto: {
      enabled: true,
      // Las primeras N letras son normales; la ultima (finale) puede tener
      // superscript (ej: X²) y animacion de spin/color.
      letters: [
        { letter: "A", word: "Anda",       from: "left"  },
        { letter: "N", word: "Nutrite",    from: "right" },
        { letter: "D", word: "Despertate", from: "left"  },
        { letter: "A", word: "Activa",     from: "right" },
      ],
      finale: {
        letter: "X",
        superscript: "",                  // "" = sin superscript (ANDAX limpio)
        word: "tus resultados",
        wordPrefix: "tus ",               // parte que queda en gris mas claro
        wordSuffix: "resultados",         // parte que cambia a naranja al final
        from: "left" as const,
      },
      tagline: {
        before: "ANDA ",
        parts: ["POR TUS METAS", "POR TU RITMO", "POR TUS RESULTADOS"],
        // En cada parte las "X" se reemplazan por la letra del finale con estilo
        accentChar: "X",
      },
    },
    showReviews: true,
    showInviteFriends: true,
  },
} as const;

export type ThemeConfig = typeof themeConfig;
