# Ecommerce Flex

Template adaptable de tienda online. Cambia `theme.config.ts` y tenes una tienda nueva en minutos. Next.js 14 + Google Sheets + MercadoPago + Asistente IA.

## Que incluye

- Catalogo de productos con filtros, busqueda y ordenamiento
- Carrito de compras
- Checkout con MercadoPago, transferencia bancaria (con descuento) y crypto USDT
- Tracking de pedidos con mapa
- Sistema de resenas
- Asistente virtual con IA (OpenAI GPT-4o-mini)
- Autenticacion con Google
- PWA instalable
- SEO completo (sitemap, JSON-LD, Open Graph)
- Modo oscuro / claro
- Responsive 320px - 1440px

## Como usar

### 1. Clonar el proyecto

```bash
git clone https://github.com/mixeliqagency-sketch/ecommerce-flex.git
cd ecommerce-flex
npm install
```

### 2. Configurar tu marca

Edita `theme.config.ts` — es el UNICO archivo que necesitas cambiar:

- Nombre de marca, tagline, logo
- Colores
- Categorias de productos
- Datos de contacto y WhatsApp
- Medios de pago (MercadoPago, transferencia, crypto)
- Nombre y avatar de la asistente virtual
- Features de la home
- Keywords SEO

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Completa las variables:
- **Google Sheets**: ID del spreadsheet + credenciales del Service Account
- **NextAuth**: Secret + Google OAuth credentials
- **MercadoPago**: Access token + public key
- **OpenAI**: API key para la asistente virtual

### 4. Crear la Google Sheet

Crea una Google Sheet con una hoja "Productos" con estas columnas:

| id | slug | nombre | descripcion | precio | precio_anterior | categoria | marca | imagen_url | stock | tipo | variantes |

Comparte la Sheet con el email del Service Account (con permisos de lectura).

### 5. Deploy

```bash
npm run build
npm run start
```

O directamente a Vercel:
```bash
npx vercel
```

## Stack

- **Next.js 14** — App Router, SSR, API Routes
- **Tailwind CSS** — Estilos responsive
- **Google Sheets** — Base de datos (via googleapis)
- **MercadoPago** — Pagos con tarjeta y cuotas
- **OpenAI** — Asistente virtual inteligente
- **NextAuth** — Autenticacion con Google

## Estructura

```
theme.config.ts     <- Configuracion de marca (EDITAR ESTE)
.env.example        <- Variables de entorno (COPIAR A .env.local)
app/                <- Paginas (home, productos, checkout, cuenta, tracking)
components/         <- Componentes UI (cart, catalog, home, layout, reviews)
context/            <- Estado global (carrito, asistente, resenas)
lib/                <- Utilidades (sheets, mercadopago, auth, analytics)
types/              <- Tipos TypeScript
public/             <- Assets estaticos (logos, iconos, manifest)
```

## Licencia

Uso privado. Creado por Mixeliq.
