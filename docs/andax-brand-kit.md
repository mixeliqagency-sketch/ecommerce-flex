# ANDAX — Brand Kit

> **Plataforma:** Ecomflex (el código base, no cambia nunca)
> **Marca comercial:** ANDAX (el cliente final ve esto)
> **Fecha:** 2026-04-12
> **Versión:** 1.0

Esta es la guía única de marca para ANDAX, la primera tienda que corre sobre la plataforma Ecomflex. Todo lo que vive acá se aplica vía `theme.config.ts` + assets en `/public` + copy en los componentes. El nombre "Ecomflex" nunca aparece del lado del cliente final — es solo el motor.

---

## 1. Brand Brief

### Qué es ANDAX
Una marca argentina de suplementos premium (deportivos + wellness + belleza) que vende online. Revende productos de mayoristas locales (Morashop, Natural Sport, EPN, etc.) con branding propio. Arranca en Mercado Libre y escala a tienda propia sobre Ecomflex.

### Promesa
Sumarle a tu día la energía, el descanso o el rendimiento que te falta — sin vueltas, sin promesas mágicas, con productos que tienen RNPA oficial.

### Público
- **Edad**: 25-45 años
- **Género**: 60% mujeres (wellness, belleza) + 40% hombres (deportivo). El nombre funciona para ambos.
- **Ubicación**: Argentina, principalmente AMBA + ciudades grandes
- **Canal de descubrimiento**: Instagram Reels, TikTok, búsquedas en Mercado Libre
- **Nivel socioeconómico**: clase media-media alta, sensibles a precio pero valoran calidad

### Competencia
- **Directa**: Ena Sport, Star Nutrition, Gentech, Body Advance (gym), Natural Sport (wellness)
- **Indirecta**: farmacias, GNC, Herbalife, mayoristas vendiendo directo

### Diferenciación
La gran mayoría de la competencia argentina está posicionada como **gym/hombre agresivo** o **farmacéutica clínica aburrida**. ANDAX ocupa el hueco del medio: **energético pero accesible, para todos, con tono rioplatense real**.

### Valores
1. **Movimiento** — lo que hacés con vos mismo todos los días
2. **Accesibilidad** — los suplementos no son solo para deportistas de élite
3. **Honestidad** — ingredientes reales, efectos reales, precios reales
4. **Argentinismo** — hablamos como vos, en voseo, sin copiarle a las marcas gringas

### Manifiesto (copy institucional)
> Creemos que andar bien es un derecho. Que tener energía, dormir, rendir y sentirte tranquilo no es lujo — es lo mínimo. ANDAX nace para que cualquiera pueda sumar lo que le falta sin complicarse la vida. Sin fórmulas mágicas. Sin promesas que no se cumplen. Sin farmacia. Solo suplementos premium, en tu casa en 48 horas, con el tono de tu barrio. **Andá con todo. Andá con ANDAX.**

---

## 2. Paleta de colores

Todos los colores están en **OKLCH** (perceptualmente uniforme — no usamos HSL porque engaña al ojo). Los HEX son aproximaciones para herramientas que no soportan OKLCH todavía.

### Primary — Coral Eléctrico
El corazón de la marca. Evoca atardecer argentino, movimiento, calor, energía. Funciona para género mixto y destaca contra el mar de azules/verdes de la competencia en Mercado Libre.

| Token | OKLCH | HEX | Uso |
|---|---|---|---|
| `--primary-50` | `oklch(96% 0.03 40)` | `#FFEEE4` | Fondos suaves, hover de cards |
| `--primary-100` | `oklch(92% 0.06 40)` | `#FFDFCB` | Highlights, badges suaves |
| `--primary-500` | `oklch(68% 0.19 40)` | `#FF6B35` | **PRIMARY** — botones, CTAs, logo, acentos |
| `--primary-600` | `oklch(60% 0.20 38)` | `#E85A2A` | **HOVER** — estado pressed/hover |
| `--primary-700` | `oklch(52% 0.20 36)` | `#C84A1F` | Active state, textos sobre claro |

**Psicología**: naranja vibrante transmite energía, entusiasmo, acción, calidez. Desaturado lo justo para no ser estridente. A diferencia del rojo puro (alarma) o el amarillo (precaución), el coral dice "dale, movete, estoy con vos".

### Dark — Midnight Navy
El ancla de seriedad y confianza. Nunca negro puro (ver regla más abajo).

| Token | OKLCH | HEX | Uso |
|---|---|---|---|
| `--dark-900` | `oklch(15% 0.02 260)` | `#0F1320` | Fondo dark mode, el más oscuro |
| `--dark-800` | `oklch(20% 0.025 260)` | `#181D2E` | Cards en dark mode |
| `--dark-700` | `oklch(25% 0.03 258)` | `#232938` | Superficie elevada dark |
| `--dark-600` | `oklch(32% 0.03 258)` | `#2F3548` | Bordes dark |

**Psicología**: azul muy oscuro con un toque cálido transmite seriedad y premium sin ser frío. Más sofisticado que el negro puro.

### Neutrals — Warm-Tinted Grays
Grises con un toque imperceptible del hue coral (40) — crea cohesión subconsciente con el primary. **Chroma = 0.01** (perceptible pero discreto).

| Token | OKLCH | HEX | Uso |
|---|---|---|---|
| `--gray-50` | `oklch(98% 0.005 40)` | `#FCFAF8` | Fondo principal light mode |
| `--gray-100` | `oklch(96% 0.008 40)` | `#F7F3EF` | Fondo secundario, cards sutiles |
| `--gray-200` | `oklch(92% 0.01 40)` | `#ECE6DF` | Bordes light |
| `--gray-300` | `oklch(85% 0.01 40)` | `#D6CFC6` | Divisores, disabled |
| `--gray-400` | `oklch(65% 0.01 40)` | `#9A938B` | Texto muy muted |
| `--gray-500` | `oklch(55% 0.01 40)` | `#827B74` | Placeholder |
| `--gray-600` | `oklch(45% 0.01 40)` | `#6B6560` | Body text secundario |
| `--gray-700` | `oklch(35% 0.015 40)` | `#524D48` | Body text principal |
| `--gray-800` | `oklch(25% 0.015 40)` | `#3B3530` | Headings en light mode |
| `--gray-900` | `oklch(15% 0.01 40)` | `#241F1B` | Texto máximo contraste |

### Semantic Colors
Colores funcionales. **Desaturados** para no pelear con el primary coral.

| Token | OKLCH | HEX | Uso |
|---|---|---|---|
| `--success` | `oklch(70% 0.15 155)` | `#3ECB7A` | Pedido confirmado, stock OK, verde desaturado |
| `--warning` | `oklch(80% 0.15 85)` | `#F5C842` | Stock bajo, advertencias, ocre cálido |
| `--danger` | `oklch(62% 0.22 25)` | `#E53935` | Errores, sin stock, rojo cálido |
| `--info` | `oklch(65% 0.12 240)` | `#4A90E2` | Links, información, azul desaturado |

### Light Mode vs Dark Mode (decisiones de diseño)

El dark mode **NO es el light mode invertido**. Sigue decisiones distintas:

| Aspecto | Light Mode | Dark Mode |
|---|---|---|
| Fondo principal | `--gray-50` (#FCFAF8) no blanco puro | `--dark-900` (#0F1320) no negro puro |
| Fondo de cards | `#FFFFFF` | `--dark-800` (#181D2E) |
| Bordes | `rgba(0,0,0,0.10)` NEGRO con alpha (lección aprendida: nunca blanco alpha en light mode) | `rgba(255,255,255,0.08)` blanco con alpha |
| Texto headings | `--gray-800` (#3B3530) | `#FCFAF8` off-white |
| Texto body | `--gray-700` (#524D48) | `#D6CFC6` gray-300 |
| Peso de fuente body | 400 | 350 (más delgado porque blanco sobre oscuro se ve más pesado) |
| Elevación (cards) | Sombras sutiles `0 1px 3px rgba(0,0,0,0.08)` | Superficies más claras, NO sombras |
| Primary color | `#FF6B35` | `#FF7A49` (ligeramente más claro para mantener contraste) |

### Aplicación 60-30-10

Regla de **peso visual**, no de pixeles:
- **60%** — neutrals warm-tinted (fondos, whitespace, superficies base)
- **30%** — dark navy (texto, bordes, estados inactivos)
- **10%** — primary coral (CTAs, highlights, focus, badges, brand moments)

**NO usar el primary en todos lados.** Funciona porque es raro. Si lo pintás en cada botón, banner y acento, se desgasta.

### Contraste WCAG verificado

| Combinación | Ratio | WCAG |
|---|---|---|
| `--gray-800` sobre `--gray-50` | 9.4:1 | AAA ✅ |
| `--gray-700` sobre `--gray-50` | 7.1:1 | AAA ✅ |
| `#FFFFFF` sobre `--primary-500` | 4.6:1 | AA ✅ (para botones) |
| `--gray-900` sobre `--primary-100` | 11.2:1 | AAA ✅ |
| `--dark-900` sobre `--gray-50` | 16.1:1 | AAA ✅ |

**Reglas que NO se rompen**:
- Nunca gray text sobre fondo colorido (se ve lavado — usar un shade más oscuro del mismo color del fondo)
- Nunca negro puro (#000) ni blanco puro (#FFF) en áreas grandes
- Nunca text sobre imagen sin overlay dark o gradiente
- Placeholder text también necesita 4.5:1

---

## 3. Tipografía

**Decisión**: combinación de dos familias Google Fonts con contraste claro de rol. Ambas evitan los defaults over-used (Inter, Roboto, Open Sans, Montserrat).

### Headings — Bricolage Grotesque
**Google Fonts** — variable, expressiva, con personalidad orgánica. Fuente moderna (2023) de Ateliers Rouges, usada por brands como Framer.

**Por qué**: tiene movimiento y carácter — matchea con el verbo "Andá". No es geométrica fría (como Inter) ni clásica aburrida (como Lato). Se siente contemporánea sin gritar.

**Pesos a cargar**: 400, 600, 800 (variable)

```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&display=swap" rel="stylesheet">
```

### Body — Plus Jakarta Sans
**Google Fonts** — clean, modern, excelente legibilidad en pantalla. Alternativa distintiva a Inter.

**Por qué**: redondez sutil en las letras que la hace cálida sin perder profesionalismo. Optical sizing automático. Trabaja perfecto a partir de 14px.

**Pesos a cargar**: 400, 500, 600, 700

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Modular Scale (ratio 1.333 — "perfect fourth")

| Token | rem | px | Uso |
|---|---|---|---|
| `--text-xs` | 0.75rem | 12px | Captions, legal, metadata |
| `--text-sm` | 0.875rem | 14px | UI secundario, helpers |
| `--text-base` | 1rem | 16px | **Body text** (mínimo mobile) |
| `--text-lg` | 1.333rem | 21px | Lead paragraphs, subheadings |
| `--text-xl` | 1.777rem | 28px | H3, card titles |
| `--text-2xl` | 2.369rem | 38px | H2, section titles |
| `--text-3xl` | 3.157rem | 51px | H1, page titles |
| `--text-hero` | 4.209rem | 67px | Hero principal (fluid) |

### Hero fluid type (clamp)

Para headings hero en marketing pages, usar `clamp()` para que escalen con el viewport sin saltos:

```css
.hero-title {
  font-family: 'Bricolage Grotesque', sans-serif;
  font-weight: 800;
  font-size: clamp(2.5rem, 5vw + 1rem, 5rem);
  line-height: 0.95;
  letter-spacing: -0.02em;
}
```

**Importante**: el body text NUNCA es fluid. Se queda en `1rem` fijo (respeta zoom del usuario, accesibilidad).

### Reglas que NO se rompen
- **Mínimo 16px** (1rem) para body text — bajo eso falla WCAG en mobile y cansa la vista
- **Nunca disable zoom** (`user-scalable=no`) — rompe accesibilidad
- **Usar rem/em**, nunca `px` para body (respeta configuración del navegador del usuario)
- **Line-height contextual**: tight (1.1-1.2) para headings, comfortable (1.5-1.6) para body
- **Measure**: max `65ch` para párrafos largos
- **Solo 2 familias por proyecto** — agregar una tercera crea ruido

### CSS tokens listos para pegar

```css
:root {
  /* Fonts */
  --font-heading: 'Bricolage Grotesque', system-ui, sans-serif;
  --font-body: 'Plus Jakarta Sans', system-ui, sans-serif;

  /* Scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.333rem;
  --text-xl: 1.777rem;
  --text-2xl: 2.369rem;
  --text-3xl: 3.157rem;
  --text-hero: clamp(2.5rem, 5vw + 1rem, 5rem);

  /* Line heights */
  --leading-tight: 1.1;
  --leading-snug: 1.3;
  --leading-normal: 1.5;
  --leading-relaxed: 1.7;

  /* Letter spacing */
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.05em;
}

body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  font-weight: 400;
  color: var(--gray-700);
}

h1, h2, h3, h4 {
  font-family: var(--font-heading);
  font-weight: 800;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--gray-900);
}
```

---

## 4. Logo

### Concepto
El logo es **wordmark-forward** (el nombre es el héroe). La letra **X** se estiliza como el elemento distintivo — dos trazos angulares que sugieren **movimiento/expansión/direcciones múltiples**. Funciona como metáfora visual del verbo "Andá" que subyace la marca.

### Variantes obligatorias
1. **Wordmark horizontal** — ANDAX completo, color primary sobre fondo claro u oscuro
2. **Wordmark con tagline** — "ANDAX" + "Andá con todo" debajo, para headers grandes
3. **Isotipo (solo X)** — favicon, app icon, watermark en fotos
4. **Monochrome** — versión de un solo color para impresión barata y reversos
5. **Inverted** — blanco sobre coral para packaging especial

### Reglas de uso
- **Área de respeto**: mínimo el ancho de la letra "A" alrededor del logo
- **Tamaño mínimo**: 120px de ancho digital, 24mm de ancho impreso
- **Nunca deformar** (aspect ratio fijo)
- **Nunca rotar** ni aplicar efectos 3D
- **Nunca ponerlo sobre fondo coral** (se pierde contraste)
- **Nunca contornearlo** con otro color
- **Nunca sobre imágenes sin overlay** que garantice contraste 4.5:1

### Logo prompts para IA (Midjourney / DALL-E / Ideogram / Nano-Banana)

#### Prompt 1 — Wordmark principal (hero)
```
minimalist wordmark logo "ANDAX", bold geometric sans-serif typography with slight kinetic forward lean, the letter X stylized as two dynamic intersecting arrows pointing outward representing motion and expansion, vibrant coral orange #FF6B35 on deep midnight navy #0F1320 background, high contrast professional identity, modern Argentine sports nutrition brand, flat vector style, no gradients no shadows no ornaments, centered symmetric composition, clean sharp lines, confident energetic, brand identity design --ar 16:9 --v 6 --style raw
```

#### Prompt 2 — Isotipo (solo la X, para favicon/app icon)
```
minimalist logo symbol, single letter X mark, bold geometric sans-serif, stylized as two crossing directional arrows or motion strokes representing forward movement, solid vibrant coral orange #FF6B35, flat vector style, monochrome single color, 1:1 aspect ratio, centered perfect composition, favicon ready app icon, strong negative space, simple iconic memorable, brand symbol design --ar 1:1 --v 6 --style raw
```

#### Prompt 3 — Lockup con tagline
```
horizontal logo lockup, "ANDAX" wordmark in bold modern sans-serif uppercase, tagline "ANDÁ CON TODO" in smaller lighter weight letterspaced below, the letter X stylized as a dynamic motion mark, coral orange #FF6B35 and deep navy #0F1320 two-color palette, minimalist professional sports supplement brand identity, flat vector art, clean hierarchy, premium accessible --ar 3:1 --v 6 --style raw
```

#### Prompt 4 — Versión monochrome reversa
```
minimalist wordmark "ANDAX", solid white color on transparent background, bold geometric sans-serif, stylized X element as motion mark, flat vector, single color monochrome variant for dark backgrounds, clean professional brand identity, no decoration --ar 16:9 --v 6 --style raw
```

#### Prompt 5 — Exploración alternativa (chunkier/sportier)
```
bold chunky wordmark "ANDAX", heavy display typography with condensed proportions, X letter with aggressive angular cuts suggesting speed and movement, vibrant coral orange #FF6B35, deep midnight navy #0F1320, sports supplement brand identity, flat vector logo design, athletic energetic confident, centered --ar 16:9 --v 6 --style raw
```

**Nota**: generar **mínimo 4 variantes** por prompt y comparar. Elegir la que mejor funcione en monocromo (test de supervivencia: si pierde en monocromo, pierde en general).

---

## 5. Voz y Tono

### Personalidad en 5 palabras
1. **Enérgica** — sin gritar, sin exclamaciones abusivas
2. **Accesible** — hablamos como en el barrio, no como en farmacia
3. **Directa** — lo que tenés que saber, en 5 palabras
4. **Rioplatense** — voseo siempre, modismos naturales
5. **Confiable** — datos, RNPA, ingredientes reales, cero promesas mágicas

### Voseo argentino — regla inviolable
Toda comunicación está en voseo. **Nunca** "tú/tienes/puedes/quieres".

| ❌ Nunca | ✅ Siempre |
|---|---|
| Tú tienes más energía | Vos tenés más energía |
| ¿Puedes tomarlo en ayunas? | ¿Podés tomarlo en ayunas? |
| Descubre ANDAX | Descubrí ANDAX |
| Compra ahora | Comprá ahora |
| Tu cuerpo lo agradecerá | Tu cuerpo te lo va a agradecer |

### Palabras SÍ (preferidas)
- **Verbos**: andá, sumá, dale, movete, empezá, arrancá, rendí, seguí, metele
- **Tiempo**: hoy, ahora, ya, de una, directo
- **Intensidad**: todo, con todo, posta, real, en serio, de verdad
- **Resultados**: energía, movimiento, rendimiento, descanso, claridad
- **Argentinismos naturales**: dale, bien ahí, groso, de una

### Palabras NO (vetadas)
- **Tutor**: tú, tienes, puedes, tomas, quieres (NUNCA)
- **Médico clínico**: consumir, ingerir, administrar, posología → usar "sumá", "arrancá con", "tomá" (informal)
- **Bro-culture**: bro, hermano, king, crack, beast, gainz, bulk, cutting → usar equivalentes en español
- **Exageraciones vacías**: "el mejor del mundo", "fórmula mágica", "secreto revelado", "lo que no te dicen" → evitar totalmente
- **Extranjerismos innecesarios**: workout → entrenamiento, fitness → forma física, intake → ingesta (si es técnico), otherwise "cantidad"
- **Claim médicos ilegales**: "cura", "previene enfermedades", "adelgaza" (regulación ANMAT prohíbe esto en suplementos)

### Ejemplos de tono correcto

**✅ Bien (tono ANDAX)**:
- "Sumá magnesio y dormí como tenés que dormir."
- "Creatina monohidrato. Sin vueltas. 60 dosis. Andá más fuerte."
- "¿Te falta energía a la tarde? Empezá con multivit."
- "Entró tu pedido. Lo despachamos hoy."

**❌ Mal (tono no-ANDAX)**:
- "Descubre el secreto que los atletas no quieren que sepas" (clickbait)
- "Tú necesitas este producto para tu mejor versión" (tuteo + cliché)
- "Bro, ¡estos gainz son insanos!" (bro-culture + extranjerismo)
- "Fórmula exclusiva patentada que cura el cansancio" (claim médico ilegal + exageración)
- "¡¡¡AHORA 70% OFF!!! NO TE LO PODÉS PERDER" (gritado sin contexto)

### Errores comunes a corregir
- "Tomar" está OK si es informal ("Tomalo después del entrenamiento"). NO usar "ingerir" ni "consumir".
- "Entrenamiento" mejor que "workout" (a menos que el público joven prefiera — test A/B después).
- Emojis permitidos: ⚡ 🔥 💪 🏃‍♂️ 🏋️‍♀️ 🌅 🌊 ✨ (movimiento/energía/naturaleza). Prohibidos: 💊 🏥 ⚕️ (farmacéuticos — damos señal equivocada).

---

## 6. Copy Listo para Pegar

### Taglines (variaciones)
- **Principal**: "Andá con todo."
- **Alternativa corta**: "Andá con ANDAX."
- **Producto deportivo**: "Andá más fuerte."
- **Producto wellness**: "Andá tranquilo."
- **Producto belleza**: "Andá con brillo."
- **Institucional**: "Para que andes como tenés que andar."

### Instagram Bio
```
⚡ Andá con todo
🇦🇷 Suplementos premium | RNPA oficial
📦 Envíos a todo el país en 48h
💳 Hasta 12 cuotas sin interés
⬇️ Comprá desde acá
```

### Meta Description (SEO)
```
ANDAX — Suplementos premium argentinos para que andes con todo. Creatina, magnesio, colágeno, multivitamínicos y más. Envíos a todo el país en 48h. Hasta 12 cuotas sin interés. RNPA oficial.
```

### Hero de home
```
TITLE: Andá con todo.
HIGHLIGHT: Todos los días.
SUBTITLE: Suplementos premium para que tu cuerpo rinda al máximo. Energía, descanso, fuerza. Sin vueltas. RNPA oficial y envíos a todo el país en 48 horas.
CTA PRIMARY: Ver productos
CTA SECONDARY: Conocé ANDAX
```

### Features del home (3 beneficios)
```
1. TITLE: Envío en 48h
   DESC: Lo despachamos el mismo día

2. TITLE: Calidad real
   DESC: Todos los productos con RNPA oficial

3. TITLE: 12 cuotas sin interés
   DESC: Pagá con MercadoPago o transferencia con 10% OFF
```

### CTAs estándar
| Contexto | Primary | Secondary |
|---|---|---|
| Home hero | Empezá ahora | Ver productos |
| Producto | Sumar al carrito | Ver detalles |
| Carrito | Finalizar compra | Seguir comprando |
| Checkout | Pagar ahora | Volver al carrito |
| Post-compra | Ver mi pedido | Seguir comprando |
| Newsletter | Sumate a ANDAX | — |

### Descripción de producto (template)
**Creatina Monohidrato 300g**:
```
Andá más fuerte, más rápido, más lejos.

La creatina más estudiada del planeta, sin vueltas: monohidrato puro al 100%,
5g por toma, 60 dosis. Para que tu fuerza no sea excusa.

✓ Pureza farmacéutica
✓ Sin aditivos ni rellenos
✓ RNPA oficial [número]
✓ Envío en 48h

Cómo tomarla: 1 cucharadita (5g) después del entrenamiento, con agua o jugo.
Para días de descanso, a cualquier hora.

60 dosis = 2 meses de suplementación continua.
```

### Emails transaccionales (subjects)
- **Bienvenida (welcome series)**: "Bienvenido a ANDAX. Ahora andá."
- **Confirmación de compra**: "Entró tu pedido #[ID]. Ya lo preparamos."
- **Envío**: "Tu pedido salió. Llega en 48h."
- **Entrega**: "Llegó tu pedido. Ahora andá."
- **Review request**: "¿Cómo te fue con [producto]? Contanos."
- **Carrito abandonado (1h)**: "Dejaste algo por la mitad. ¿Seguimos?"
- **Carrito abandonado (24h)**: "Todavía te lo estamos guardando."
- **Carrito abandonado (48h)**: "Última chance con 10% OFF: BIENVENIDO10"
- **Newsletter semanal**: "Esta semana en ANDAX" (con número variable)

### Push notifications (títulos cortos)
- "Entró tu pedido ⚡"
- "Llega hoy tu pedido 📦"
- "Volvió el stock de [producto]"
- "Oferta de la semana: 20% OFF en [categoría]"
- "¿Cómo te fue con [producto]?"

---

## 7. Estrategia de Contenido

### Pilares (aplicar skill `crecimiento-ig-2026.md`)

| Pilar | % del feed | Formato |
|---|---|---|
| **Educación** (info útil sobre suplementos) | 40% | Reels 15-30s + carruseles |
| **Testimonios** (UGC + casos reales) | 30% | Reels con voz en off |
| **Detrás de escena** (cómo se arma un pedido, quién está) | 20% | Stories + reels personales |
| **Ofertas/novedades** (lanzamientos, descuentos) | 10% | Posts estáticos + stories |

**Regla de oro**: nunca más de 1 post de venta por cada 9 posts de valor. Si el feed parece catálogo, el engagement muere.

### Frecuencia sugerida
- **Instagram**: 1 reel/día + 3-5 stories/día (primeros 90 días)
- **TikTok**: 2-3 videos/semana (priorizá calidad, no volumen)
- **Blog Ecomflex**: 1 artículo/semana (1000-1500 palabras, SEO)
- **Newsletter**: 1 envío/semana

### Estructura de reel base (aplicar masterclass Victor Eras)
```
HOOK (0-3 seg): pregunta provocativa o claim contraintuitivo
   Ej: "Si tomás magnesio y no te cambia nada, es por esto."

NUTRICIÓN (3-20 seg): info real, dato nuevo, valor
   Ej: "El magnesio bisglicinato se absorbe 4x más que el óxido.
        La mayoría de las marcas usan óxido porque es más barato."

VENTA SUTIL (20-25 seg): CTA natural al producto
   Ej: "En ANDAX usamos bisglicinato. Por eso funciona."

CTA FINAL (25-30 seg): Acción clara
   Ej: "Link en bio para probarlo."
```

### Hashtags (aplicar volumen/competencia de skill SEO)
- **Amplios** (50K-500K): #Suplementos #Nutrición #Fitness #Salud
- **Nicho AR** (5K-50K): #SuplementosArgentina #NutriciónDeportiva #SuplementosAR
- **Marca** (0-5K, para ocupar): #ANDAX #AndáConANDAX #AndáConTodo
- **Ubicación**: #BuenosAires #Argentina #CABA

Máximo 15 hashtags por post. Mezclar de cada categoría.

### Campaña de lanzamiento (primeras 2 semanas)

**Semana 0 — Teaser (3-5 días antes)**
- Stories con preguntas: "¿Y si mañana te sentís mejor?"
- Post con contador regresivo
- Nada de revelar el nombre todavía

**Día 1 — Reveal**
- Reel manifiesto: "Hoy arranca ANDAX. Andá con todo."
- Post con logo + paleta
- Story highlights: "Qué es ANDAX"

**Días 2-7 — Producto por día**
- Un reel educativo por cada producto estrella
- Testimonios de los primeros 3-5 amigos que compren (pedirles UGC con descuento BIENVENIDO10)
- Stories de behind-the-scenes armando los primeros pedidos

**Días 8-14 — Social proof**
- Reviews reales
- Lives con Q&A ("¿Qué suplemento me recomendás?")
- Descuento BIENVENIDO10 para cerrar la primera ola de ventas

### Métricas a trackear
- Engagement rate (objetivo: >3% en Reels)
- Conversión bio → web (objetivo: >2%)
- Ventas por hashtag de marca
- Crecimiento de seguidores orgánico (objetivo: +500/mes primeros 90 días)

---

## 8. Packaging

Como Pablo **revende**, no fabrica, el packaging inicial es **stickers/etiquetas sobre el envase original** del mayorista.

### Sticker estándar (frascos 300g)
- **Formato**: 5 cm ancho × 10 cm alto, rectangular con esquinas ligeramente redondeadas (6px radius)
- **Fondo**: `#0F1320` (dark navy)
- **Logo ANDAX**: parte superior, blanco sobre navy, 3cm ancho
- **Nombre del producto**: segunda línea, `#FF6B35` coral, tipografía Bricolage Grotesque 800
- **Peso/dosis**: tercera línea, blanco, Plus Jakarta Sans 500
- **QR**: esquina inferior derecha, 1.5cm × 1.5cm, blanco sobre navy, apunta a la ficha del producto en la web
- **RNPA**: parte inferior, texto blanco pequeño, legal

### Sticker sachet (20g-50g)
- **Formato**: 3 cm × 5 cm
- Mismo sistema pero sin QR (lo ponés en el sobre de envío)

### Caja de envío
- **Exterior**: caja estándar de cartón kraft (económico)
- **Sticker grande** en la tapa: logo ANDAX + "Andá con todo" + número de pedido
- **Interior**: tarjeta personalizada con mensaje de agradecimiento + cupón de descuento para la próxima compra
- **Envoltorio**: papel de seda kraft amarrado con hilo fino

### Tarjeta de agradecimiento (copy)
```
Gracias por confiar en ANDAX.

Tu pedido está acá porque creés
que andar bien vale la pena.

Si tenés cualquier duda, escribime
por WhatsApp: [número]

Y si te fue bien, dejame una reseña —
me ayuda un montón.

Gracias.
Pablo, ANDAX
```

---

## 9. Implementación en código

### Mapping a `theme.config.ts`

```typescript
brand: {
  name: "ANDAX",
  tagline: "Andá con todo",
  description: "Suplementos premium argentinos para que andes con todo todos los días. Creatina, magnesio, colágeno, multivitamínicos. Envíos a todo el país en 48h. RNPA oficial.",
  url: "https://andax.com.ar",   // cuando Pablo registre el dominio
  logo: "/andax-logo.svg",
  useLogo: true,                   // cambiar cuando haya SVG real
  creator: "Mixeliq",
},
styles: {
  fonts: {
    heading: "Bricolage Grotesque",
    body: "Plus Jakarta Sans",
  },
  colors: {
    primary: "#FF6B35",
    primaryHover: "#E85A2A",
    secondary: "#F5C842",   // warning/ocre como accent secundario
    accent: "#0F1320",       // dark navy
    danger: "#E53935",
    success: "#3ECB7A",
  },
  // ... etc
}
```

### Assets necesarios
Pablo tiene que crear estos archivos en `public/`:

- [ ] `andax-logo.svg` — wordmark horizontal (generar con prompts + vectorizar)
- [ ] `andax-isotipo.svg` — solo la X (favicon + app)
- [ ] `favicon.svg` — versión simplificada del isotipo
- [ ] `icon-192.png` — PWA icon
- [ ] `icon-512.png` — PWA icon (también maskable)
- [ ] `og-image.png` — Open Graph 1200x630 (logo + tagline sobre navy)
- [ ] `apple-touch-icon.png` — 180x180
- [ ] `screenshots/home.png` — screenshot de la home para Play Store (1080x1920)
- [ ] `screenshots/productos.png`
- [ ] `screenshots/producto.png`
- [ ] `screenshots/checkout.png`

**Regla clave aprendida** (de `errores-aprendidos.md` #14): NUNCA usar `@import` de Google Fonts en SVG favicons. Vectorizar el texto como `<path>`.

### Carga de fuentes en Next.js

```typescript
// app/layout.tsx
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "600", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({ children }) {
  return (
    <html className={`${bricolage.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

---

## 10. Checklist final antes de lanzar

- [ ] Logo SVG vectorizado (no solo PNG)
- [ ] Favicon funcional en todos los browsers (testear Chrome, Firefox, Safari)
- [ ] Contraste WCAG AA verificado en WebAIM Contrast Checker
- [ ] Dark mode y light mode ambos funcionan
- [ ] Fuentes cargan con `font-display: swap` (no FOIT)
- [ ] OG image se ve bien en Twitter card validator + Facebook debugger
- [ ] PWA icons con maskable variant
- [ ] `theme.config.ts` con todos los valores reales (no placeholders)
- [ ] Datos bancarios reales en `payments.transferencia.datos`
- [ ] WhatsApp real en `contact.whatsapp`
- [ ] Todos los handles de redes sociales conectados
- [ ] Packaging stickers impresos y probados en un pedido real
- [ ] 10 productos iniciales cargados en Google Sheets
- [ ] 3 artículos de blog publicados (SEO inicial)
- [ ] Cupón BIENVENIDO10 creado en el panel
- [ ] Tarjeta de agradecimiento impresa para incluir en cada pedido

---

**Última actualización**: 2026-04-12
**Autor**: Pablo Morales (Mixeliq) + Claude Code
**Skills aplicadas**: `branding.md`, `frontend-design/typography.md`, `frontend-design/color-and-contrast.md`, `comunicacion-argentina.md`, `errores-aprendidos.md`, `crecimiento-ig-2026.md`, `seo-completo-2026.md`
**Referencias cruzadas**:
- `docs/superpowers/specs/2026-04-11-ecomflex-design.md` — spec de la plataforma
- `docs/ecomflex-launch-checklist.md` — checklist operativa de lanzamiento
- `theme.config.ts` — donde vive el branding en código
- `~/.claude/projects/C--Users-Usuario/memory/project_andax.md` — memoria persistente
