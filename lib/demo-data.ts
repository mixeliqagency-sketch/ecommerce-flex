// lib/demo-data.ts
// Datos demo para correr ANDAX localmente SIN Google Sheets configuradas.
//
// Se activa con DEMO_MODE=true en .env.local. Cuando el flag esta ON,
// los modulos de lib/sheets/*.ts devuelven estos datos hardcodeados en vez
// de llamar a Google Sheets. Esto permite ver la tienda funcionando para
// revisar branding/UX sin tener credenciales reales.
//
// Los 12 productos estan basados en publicaciones reales de MercadoLibre
// Argentina (marzo 2026), portados desde AOURA v1. Las fotos vienen directo
// del CDN de ML.
//
// NO subir DEMO_MODE=true a produccion. En produccion la variable no existe
// y todo el codigo vuelve a consultar Sheets normal.

import type { Product, Review, BlogPost } from "@/types";

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

// Version client-side: usa NEXT_PUBLIC_DEMO_MODE porque los client components
// no ven process.env.DEMO_MODE. Ambas variables se setean juntas en .env.local.
export function isDemoModeClient(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

const ml = (id: string) => `https://http2.mlstatic.com/${id}`;

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "prod-001",
    slug: "creatina-star-nutrition-300g",
    nombre: "Creatina Monohidratada Star Nutrition 300g",
    descripcion: "Creatina monohidratada micronizada de Star Nutrition. El suplemento mas estudiado del mundo para fuerza, potencia y rendimiento. 60 dosis de 5g. Sin sabor.",
    precio: 33504,
    precio_anterior: 55620,
    categoria: "deportivo",
    marca: "Star Nutrition",
    imagen_url: ml("D_Q_NP_2X_822619-MLA99367408620_112025-E.webp"),
    imagenes: [ml("D_Q_NP_2X_822619-MLA99367408620_112025-E.webp")],
    badge: "hot",
    descuento_porcentaje: 40,
    stock: 50,
    tipo: "suplemento",
    variantes: ["300g", "500g", "1kg"],
    dosis_recomendada: "5g por dia",
    mejor_momento: "Pre o post entreno",
    beneficios: "Creatina monohidrato micronizada. Uso tradicional en deportistas para entrenamientos de alta intensidad.",
  },
  {
    id: "prod-002",
    slug: "whey-protein-ena-chocolate-930g",
    nombre: "Whey Protein ENA True Made 930g — Chocolate",
    descripcion: "Proteina de suero de leche concentrada sabor double rich chocolate. 30g de proteina por scoop. Baja en grasas. Ideal post-entrenamiento para recuperacion muscular.",
    precio: 79500,
    categoria: "deportivo",
    marca: "ENA Sport",
    imagen_url: ml("D_Q_NP_2X_838502-MLA99531455548_122025-E.webp"),
    imagenes: [ml("D_Q_NP_2X_838502-MLA99531455548_122025-E.webp")],
    badge: "oferta",
    stock: 35,
    tipo: "suplemento",
    variantes: ["Chocolate", "Vainilla", "Frutilla"],
    dosis_recomendada: "30g (1 scoop) por toma",
    mejor_momento: "Post entrenamiento (dentro de 60 min)",
    beneficios: "Aporte de 30g de proteina de suero por porcion. Complemento dietario para deportistas.",
  },
  {
    id: "prod-003",
    slug: "ashwagandha-ksm66-3000mg",
    nombre: "Ashwagandha KSM-66 3000mg x90 caps",
    descripcion: "Extracto premium de raiz de Ashwagandha KSM-66 de Natural Strong. Uso tradicional en la medicina ayurvedica. 90 capsulas vegetales.",
    precio: 50000,
    categoria: "wellness",
    marca: "Natural Strong",
    imagen_url: ml("D_Q_NP_2X_645265-MLA99477557416_112025-E.webp"),
    imagenes: [ml("D_Q_NP_2X_645265-MLA99477557416_112025-E.webp")],
    badge: "nuevo",
    stock: 40,
    tipo: "suplemento",
    variantes: ["90 caps"],
    dosis_recomendada: "1 capsula por dia",
    mejor_momento: "Noche, antes de dormir",
    beneficios: "Extracto KSM-66 de raiz de Ashwagandha. Uso tradicional en la medicina ayurvedica como adaptogeno.",
  },
  {
    id: "prod-004",
    slug: "colageno-hidrolizado-ena-345g",
    nombre: "Colageno Hidrolizado ENA Pure Collagen 345g",
    descripcion: "Colageno hidrolizado premium de ENA Sport sabor blueberry. Alta absorcion. Para articulaciones, piel, cabello y unas. 30 dosis.",
    precio: 39900,
    precio_anterior: 43900,
    categoria: "belleza",
    marca: "ENA Sport",
    imagen_url: ml("D_Q_NP_2X_979319-MLA99483121590_112025-E.webp"),
    imagenes: [ml("D_Q_NP_2X_979319-MLA99483121590_112025-E.webp")],
    descuento_porcentaje: 9,
    stock: 60,
    tipo: "suplemento",
    variantes: ["Blueberry", "Neutro"],
    dosis_recomendada: "10g por dia",
    mejor_momento: "Manana, con el desayuno",
    beneficios: "Colageno hidrolizado tipo I y III. Fuente de aminoacidos para el colageno dietario diario.",
  },
  {
    id: "prod-005",
    slug: "taurina-now-foods-1000mg",
    nombre: "Taurina Now Foods Double Strength 1000mg x100",
    descripcion: "Taurina de doble potencia Now Foods. Aminoacido presente naturalmente en la carne y el pescado. 100 capsulas veganas de 1000mg.",
    precio: 48900,
    categoria: "wellness",
    marca: "Now Foods",
    imagen_url: ml("D_Q_NP_2X_955624-MLA99910338477_112025-E.webp"),
    imagenes: [ml("D_Q_NP_2X_955624-MLA99910338477_112025-E.webp")],
    stock: 80,
    tipo: "suplemento",
    variantes: ["100 caps"],
    dosis_recomendada: "1 capsula (1000mg) por dia",
    mejor_momento: "Pre entreno (30 min antes)",
    beneficios: "Aminoacido taurina en dosis de 1000mg. Usado tradicionalmente como complemento pre-entreno.",
  },
  {
    id: "prod-006",
    slug: "creatina-nf-nutrition-300g-pote",
    nombre: "Creatina Monohidrato NF Nutrition 300g Pote",
    descripcion: "Creatina monohidrato pura en pote de 300g. NF Nutrition. Sin sabor, micronizada. Ideal para fuerza y rendimiento deportivo.",
    precio: 25408,
    precio_anterior: 32600,
    categoria: "deportivo",
    marca: "NF Nutrition",
    imagen_url: ml("D_Q_NP_2X_683429-MLA107250851153_022026-E.webp"),
    imagenes: [ml("D_Q_NP_2X_683429-MLA107250851153_022026-E.webp")],
    badge: "oferta",
    descuento_porcentaje: 22,
    stock: 45,
    tipo: "suplemento",
    variantes: ["300g", "900g"],
    dosis_recomendada: "5g por dia",
    mejor_momento: "Pre o post entreno",
    beneficios: "Creatina monohidrato 100% pura, sin aditivos. Complemento deportivo clasico para entrenamiento de fuerza.",
  },
  {
    id: "prod-007",
    slug: "omega-3-protein-lab-2000mg",
    nombre: "Omega 3 The Protein Lab 2000mg x60 caps",
    descripcion: "Aceite de pescado Omega 3 de alta concentracion, libre de metales pesados. Aporte de EPA 360mg + DHA 240mg por dosis diaria (2 capsulas).",
    precio: 31399,
    categoria: "wellness",
    marca: "The Protein Lab",
    imagen_url: ml("D_Q_NP_2X_889998-MLA99454002180_112025-E.webp"),
    imagenes: [ml("D_Q_NP_2X_889998-MLA99454002180_112025-E.webp")],
    stock: 45,
    tipo: "suplemento",
    variantes: ["60 caps"],
    dosis_recomendada: "2 capsulas por dia (2000mg total)",
    mejor_momento: "Con almuerzo o cena (con comida grasa)",
    beneficios: "Aceite de pescado con EPA y DHA. Acidos grasos esenciales (no los produce el cuerpo) de uso alimentario.",
  },
  {
    id: "prod-008",
    slug: "magnesio-bisglicinato-120caps",
    nombre: "Bisglicinato de Magnesio 120 Capsulas",
    descripcion: "Bisglicinato de magnesio — la forma quelada de mejor absorcion del mercado. Formulacion limpia, sin aditivos. Suministro para 2 meses (120 capsulas).",
    precio: 47057,
    precio_anterior: 56399,
    categoria: "wellness",
    marca: "The Protein Lab",
    imagen_url: ml("D_Q_NP_2X_884633-MLA103335908300_012026-E.webp"),
    imagenes: [ml("D_Q_NP_2X_884633-MLA103335908300_012026-E.webp")],
    badge: "nuevo",
    descuento_porcentaje: 17,
    stock: 55,
    tipo: "suplemento",
    variantes: ["120 caps"],
    dosis_recomendada: "2 capsulas antes de dormir",
    mejor_momento: "Noche, 30 min antes de dormir",
    beneficios: "Bisglicinato de magnesio — la forma quelada de mejor absorcion. Complemento mineral diario.",
  },
  {
    id: "prod-009",
    slug: "pre-entreno-unipro-300g",
    nombre: "Pre Entreno Unipro 300g Frutos Rojos",
    descripcion: "Pre-entreno con cafeina y taurina sabor frutos rojos. Energia explosiva, mejor pump y resistencia. 30 dosis por envase.",
    precio: 36058,
    categoria: "deportivo",
    marca: "Unipro",
    imagen_url: ml("D_Q_NP_2X_672896-MLA99934425839_112025-E.webp"),
    imagenes: [ml("D_Q_NP_2X_672896-MLA99934425839_112025-E.webp")],
    stock: 30,
    tipo: "suplemento",
    variantes: ["Frutos Rojos"],
    dosis_recomendada: "10g (1 scoop) por sesion",
    mejor_momento: "30 min antes de entrenar",
    beneficios: "Formula con cafeina, taurina, beta-alanina y citrulina. Complemento pre-entreno para deportistas.",
  },
  {
    id: "prod-010",
    slug: "vitamina-d3-k2-omega3-gotas",
    nombre: "Vitamina D3 5000UI + K2 + Omega 3 en Gotas",
    descripcion: "Combo de vitamina D3 (5000 UI), K2 y Omega 3 con aceite MCT para mejor absorcion. Presentacion en gotas para dosificacion flexible.",
    precio: 46000,
    categoria: "wellness",
    marca: "Importado",
    imagen_url: ml("D_Q_NP_2X_852468-MLA104643258139_012026-E.webp"),
    imagenes: [ml("D_Q_NP_2X_852468-MLA104643258139_012026-E.webp")],
    stock: 70,
    tipo: "suplemento",
    dosis_recomendada: "5 gotas por dia",
    mejor_momento: "Manana, con desayuno",
    beneficios: "Combo de vitamina D3 2000UI, vitamina K2 y omega 3 en gotas con aceite MCT para mejor absorcion.",
  },
  {
    id: "prod-011",
    slug: "creatina-creapure-ena-200g",
    nombre: "Creatina Creapure ENA Sport 200g + Scoop",
    descripcion: "Creatina Creapure de ENA Sport, la materia prima mas pura del mercado (fabricada en Alemania). Incluye scoop medidor. 40 dosis.",
    precio: 42300,
    precio_anterior: 65000,
    categoria: "deportivo",
    marca: "ENA Sport",
    imagen_url: ml("D_Q_NP_2X_925800-MLA101088186616_122025-E.webp"),
    imagenes: [ml("D_Q_NP_2X_925800-MLA101088186616_122025-E.webp")],
    badge: "hot",
    descuento_porcentaje: 35,
    stock: 30,
    tipo: "suplemento",
    variantes: ["200g"],
    dosis_recomendada: "5g por dia",
    mejor_momento: "Pre o post entreno",
    beneficios: "Creatina Creapure — materia prima premium fabricada en Alemania. Certificacion de pureza de la marca.",
  },
  {
    id: "prod-012",
    slug: "colageno-vitalis-navitas-360g",
    nombre: "Colageno Hidrolizado Vitalis Navitas 360g",
    descripcion: "Colageno hidrolizado sabor limon. 30 porciones por pote. Para articulaciones, piel, cabello y unas. Se disuelve facil en agua o jugos.",
    precio: 43900,
    categoria: "belleza",
    marca: "Vitalis Navitas",
    imagen_url: ml("D_Q_NP_2X_825521-MLA99479784276_112025-E.webp"),
    imagenes: [ml("D_Q_NP_2X_825521-MLA99479784276_112025-E.webp")],
    stock: 50,
    tipo: "suplemento",
    variantes: ["Limon", "Neutro"],
    dosis_recomendada: "12g por dia (1 porcion)",
    mejor_momento: "Manana, con el desayuno",
    beneficios: "Colageno hidrolizado con peso molecular bajo para mejor absorcion. Complemento dietario diario.",
  },
];

export const DEMO_REVIEWS: Review[] = [
  {
    id: "rev-001",
    product_slug: "creatina-star-nutrition-300g",
    nombre: "Martin G.",
    email: "martin@example.com",
    calificacion: 5,
    titulo: "Lo que me faltaba en el gym",
    contenido: "La tomo hace 2 meses y se nota la diferencia. Mas repeticiones, mejor recuperacion. Llego en 48h como decia. Recomendadisimo.",
    fecha: "2026-04-05",
    aprobado: "si",
    verificado: true,
    destacada: true,
  },
  {
    id: "rev-002",
    product_slug: "magnesio-bisglicinato-120caps",
    nombre: "Florencia B.",
    email: "flor@example.com",
    calificacion: 5,
    titulo: "Por fin duermo bien",
    contenido: "Probe mil marcas y esta es la unica que funciona de verdad. Duermo de corrido y me levanto descansada. Mi nuevo imprescindible.",
    fecha: "2026-04-07",
    aprobado: "si",
    verificado: true,
    destacada: true,
  },
  {
    id: "rev-003",
    product_slug: "colageno-hidrolizado-ena-345g",
    nombre: "Laura M.",
    email: "laura@example.com",
    calificacion: 5,
    titulo: "Mi piel cambio",
    contenido: "A los 35 empece a notar cosas que no me gustaban. Llevo 3 meses y mi piel esta mucho mejor. Sin sabor, lo pongo en el cafe y listo.",
    fecha: "2026-04-02",
    aprobado: "si",
    verificado: true,
    destacada: true,
  },
  {
    id: "rev-004",
    product_slug: "whey-protein-ena-chocolate-930g",
    nombre: "Nicolas R.",
    email: "nico@example.com",
    calificacion: 4,
    titulo: "Muy buena proteina",
    contenido: "Se disuelve perfecto, sabor no es empalagoso. Me dura mas de un mes. La relacion precio-calidad esta muy bien.",
    fecha: "2026-04-09",
    aprobado: "si",
    verificado: true,
    destacada: false,
  },
  {
    id: "rev-005",
    product_slug: "vitamina-d3-k2-omega3-gotas",
    nombre: "Sofia T.",
    email: "sofi@example.com",
    calificacion: 5,
    titulo: "Energia todo el dia",
    contenido: "Empece a tomarlo hace 3 semanas y la diferencia de energia es notable. Mas ganas, mejor animo. Lo vuelvo a pedir.",
    fecha: "2026-04-10",
    aprobado: "si",
    verificado: true,
    destacada: true,
  },
  {
    id: "rev-006",
    product_slug: "pre-entreno-unipro-300g",
    nombre: "Diego A.",
    email: "diego@example.com",
    calificacion: 5,
    titulo: "Explota cada sesion",
    contenido: "Sabor frutos rojos espectacular, el pump es brutal y no tiene crash. Para mi el mejor preworkout que probe hasta ahora.",
    fecha: "2026-04-08",
    aprobado: "si",
    verificado: true,
    destacada: false,
  },
];

export const DEMO_BLOG_POSTS: BlogPost[] = [
  {
    slug: "guia-creatina-monohidrato",
    titulo: "Guia completa de la creatina monohidrato",
    descripcion: "La creatina es el suplemento deportivo mas estudiado del mundo. Te explicamos que hace, cuanto tomar, cuando y cuales son los mitos que hay que dejar atras.",
    contenido: `# Guia completa de la creatina monohidrato

La creatina es probablemente el suplemento deportivo mas estudiado del mundo. Mas de 500 estudios cientificos respaldan su uso, su seguridad y sus beneficios.

## Para que sirve

- **Mas fuerza**: podes hacer 1-2 repeticiones mas por serie.
- **Mejor recuperacion entre series**: menos descanso, mas volumen.
- **Mas volumen muscular**: el musculo retiene mas agua, estimula la sintesis de proteina.
- **Mejor rendimiento cognitivo**: estudios recientes muestran beneficios en memoria y concentracion.

## Cuanto tomar

5 gramos por dia. Punto. No hay que hacer "fase de carga", no hay que ciclarla, no hay que dejarla cada tanto. 5g diarios, todos los dias.

## Mitos

- **"Te infla"**: retiene agua DENTRO del musculo, no en la piel. Te ves mas lleno, no inflado.
- **"Es mala para el rinon"**: estudiada por decadas en personas sanas, cero evidencia de dano.
- **"Es para culturistas"**: cualquier persona que hace ejercicio se beneficia.`,
    categoria: "Deportivo",
    autor: "Equipo ANDAX",
    fecha: "2026-04-01",
    imagen_url: ml("D_Q_NP_2X_822619-MLA99367408620_112025-E.webp"),
    keywords: ["creatina", "creatina monohidrato", "suplementos deportivos", "fuerza"],
    publicado: true,
    tiempo_lectura: 3,
  },
  {
    slug: "magnesio-cual-elegir",
    titulo: "Magnesio: cual elegir y por que la mayoria compra el equivocado",
    descripcion: "Hay 7 tipos de magnesio en el mercado. La mayoria compra oxido porque es barato. Te explicamos por que el bisglicinato es 4x mejor.",
    contenido: `# Magnesio: cual elegir

## El problema del magnesio oxido

Es el mas barato y el que mas se vende. Pero solo se absorbe el **4%**. El resto pasa por el sistema digestivo sin hacer nada util.

## Por que elegir bisglicinato

El bisglicinato tiene **18% de absorcion**, casi 5x mas que el oxido. Ademas:

- No irrita el estomago
- No tiene efecto laxante
- La glicina tiene efecto calmante propio
- Es la forma mas recomendada para mejorar el sueno

## Dosis

300-400mg de magnesio elemental por dia. Si es para dormir, todo junto 30 min antes de acostarte.`,
    categoria: "Wellness",
    autor: "Equipo ANDAX",
    fecha: "2026-04-05",
    imagen_url: ml("D_Q_NP_2X_884633-MLA103335908300_012026-E.webp"),
    keywords: ["magnesio", "bisglicinato", "sueno", "wellness"],
    publicado: true,
    tiempo_lectura: 3,
  },
  {
    slug: "colageno-funciona-o-marketing",
    titulo: "El colageno: funciona de verdad o es marketing?",
    descripcion: "El colageno vende millones de dolares al ano. Pero los estudios? Te contamos que dice la ciencia sobre el colageno hidrolizado.",
    contenido: `# El colageno: funciona de verdad?

## Que dice la ciencia

Los estudios son claros para 3 beneficios:
1. **Piel mas hidratada y elastica** (multiples estudios doble ciego)
2. **Menos dolor articular** en personas con osteoartritis
3. **Unas mas fuertes** (menos quebradizas)

## Hidrolizado vs no hidrolizado

Hidrolizado significa que las cadenas de colageno ya fueron "cortadas" en peptidos. **Siempre elegi hidrolizado** — el no-hidrolizado practicamente no se absorbe.

## Cuando vas a ver resultados

- **Unas**: 2-4 semanas
- **Piel**: 8-12 semanas
- **Articulaciones**: 12 semanas en adelante

Consistencia es todo.`,
    categoria: "Belleza",
    autor: "Equipo ANDAX",
    fecha: "2026-04-08",
    imagen_url: ml("D_Q_NP_2X_979319-MLA99483121590_112025-E.webp"),
    keywords: ["colageno", "colageno hidrolizado", "belleza", "antiedad"],
    publicado: true,
    tiempo_lectura: 3,
  },
];
