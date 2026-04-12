// === PWA ===
// Interfaz para el evento beforeinstallprompt (no esta en los tipos nativos de TS)
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// === PRODUCTOS ===
export interface Product {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precio_anterior?: number;
  categoria: string;
  marca: string;
  imagen_url: string;
  imagenes?: string[];
  badge?: "nuevo" | "oferta" | "hot";
  descuento_porcentaje?: number;
  stock: number;
  tipo: string;
  link_afiliado?: string;
  variantes?: string[];
  dosis_recomendada?: string;
  mejor_momento?: string;
  beneficios?: string;
}

// === RESENAS ===
export interface Review {
  id: string;
  product_slug: string;
  nombre: string;
  email: string;
  calificacion: 1 | 2 | 3 | 4 | 5;
  titulo: string;
  contenido: string;
  fecha: string;
  verificado: boolean;
  aprobado: "si" | "no" | "pendiente";
  destacada: boolean;
}

export interface ReviewSummary {
  promedio: number;
  total: number;
  distribucion: Record<1 | 2 | 3 | 4 | 5, number>;
}

// === CARRITO ===
export interface CartItem {
  product: Product;
  cantidad: number;
  variante?: string;
}

// === PEDIDOS ===
export type OrderStatus =
  | "creado"
  | "pendiente_pago"
  | "pagado"
  | "preparando"
  | "enviado"
  | "entregado"
  | "cancelado"
  | "reembolsado";

export interface Order {
  id: string;
  email: string;
  telefono: string;
  nombre: string;
  apellido: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
  items: CartItem[];
  subtotal: number;
  envio: number;
  total: number;
  metodo_pago: "mercadopago" | "transferencia" | "crypto";
  estado: OrderStatus;
  fecha: string;
  mercadopago_id?: string;
}

// === ASISTENTE VIRTUAL ===
export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

// === AUTH ===
export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
}

// === PHASE 1 ===
export interface Coupon {
  codigo: string;
  descuento_porcentaje: number;
  fecha_vencimiento: string; // ISO date
  usos_maximos: number;
  usos_actuales: number;
  activo: boolean;
  descripcion?: string;
}

export interface TopProductMetric {
  slug: string;
  nombre: string;
  cantidad: number;
  ingresos: number;
}

export interface DashboardMetrics {
  ventas_hoy: number;
  ventas_semana: number;
  ventas_mes: number;
  pedidos_hoy: number;
  pedidos_semana: number;
  visitas_hoy?: number;
  variacion_ventas_pct: number;
  top_productos: TopProductMetric[];
  carritos_abandonados_hoy: number;
  carritos_recuperados: number;
}

export interface AbandonedCart {
  id: string;
  email: string | null;
  items: CartItem[];
  timestamp: string;
  estado: "abandonado" | "recuperado" | "convertido";
}

export interface EmailMarketingConfig {
  enabled: boolean;
  welcomeSeries: boolean;
  abandonedCart: boolean;
  postPurchase: boolean;
  winback: boolean;
  newsletters: boolean;
}

export interface SocialMediaConfig {
  enabled: boolean;
  instagram: boolean;
  twitter: boolean;
  tiktok: boolean;
}

export interface SeoProConfig {
  enabled: boolean;
  blog: boolean;
  faqSchema: boolean;
  breadcrumbs: boolean;
  aiVisibility: boolean;
}

export interface GoogleAdsConfig {
  enabled: boolean;
  trackingId: string;
  remarketing: boolean;
}

export interface KiraConfig {
  enabled: boolean;
  whatsappFallback: boolean;
}

// Base para módulos simples con solo on/off
export interface ToggleModule {
  enabled: boolean;
}

export interface ModuleConfig {
  dashboard: ToggleModule;
  emailMarketing: EmailMarketingConfig;
  socialMedia: SocialMediaConfig;
  seoPro: SeoProConfig;
  googleAds: GoogleAdsConfig;
  kira: KiraConfig;
  cupones: ToggleModule;
  referidos: ToggleModule;
  pushNotifications: ToggleModule;
  modoCatalogo: ToggleModule;
  poweredBy: ToggleModule;
  stockAlert: { threshold: number };
}

export interface KiraInsight {
  fecha: string;
  resumen: string; // texto generado por GPT
  ventas_hoy: number;
  top_producto: string;
  carritos_abandonados: number;
  stock_bajo: string[]; // slugs de productos con stock < threshold
  sugerencias: string[];
}

// === PHASE 2: MARKETING ===

export interface Subscriber {
  id: string;
  email: string;
  fecha: string; // ISO
  source: string; // "popup", "checkout", "footer", "welcome"
  estado: "activo" | "inactivo" | "rebote";
  ultima_actividad?: string;
}

export interface BlogPost {
  slug: string;
  titulo: string;
  descripcion: string; // meta description SEO
  contenido: string; // markdown
  categoria: string;
  autor: string;
  fecha: string; // ISO
  imagen_url?: string;
  keywords: string[];
  publicado: boolean;
  tiempo_lectura?: number; // minutos, calculado
}

export interface Keyword {
  keyword: string;
  pagina_destino: string;
  volumen_estimado?: number;
  posicion?: number;
  intencion: "informacional" | "comercial" | "transaccional" | "navegacional";
}

export interface EmailLog {
  id: string;
  tipo: string;
  destinatario: string;
  asunto: string;
  fecha_envio: string;
  abierto?: boolean;
  fecha_apertura?: string;
  error?: string;
}

export type QueueEventType =
  | "welcome_series_start"
  | "abandoned_cart_1h"
  | "abandoned_cart_24h"
  | "abandoned_cart_48h"
  | "post_purchase_confirmation"
  | "post_purchase_tips"
  | "post_purchase_review_request"
  | "post_purchase_cross_sell"
  | "winback_60d"
  | "newsletter_send"
  | "sunset_cleanup";

export interface QueueEvent {
  id: string;
  tipo: QueueEventType;
  datos: Record<string, unknown>;
  timestamp: string;
  estado: "pendiente" | "procesado" | "fallido";
  intentos: number;
}
