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
  estado:
    | "pendiente"
    | "confirmado"
    | "despachado"
    | "en_camino"
    | "entregado";
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
export type OrderStatus =
  | "creado"
  | "pendiente_pago"
  | "pagado"
  | "preparando"
  | "enviado"
  | "entregado"
  | "cancelado"
  | "reembolsado";

export interface Coupon {
  codigo: string;
  descuento_porcentaje: number;
  fecha_vencimiento: string; // ISO date
  usos_maximos: number;
  usos_actuales: number;
  activo: boolean;
  descripcion?: string;
}

export interface DashboardMetrics {
  ventas_hoy: number;
  ventas_semana: number;
  ventas_mes: number;
  pedidos_hoy: number;
  pedidos_semana: number;
  visitas_hoy?: number;
  variacion_ventas_pct: number;
  top_productos: { slug: string; nombre: string; cantidad: number; ingresos: number }[];
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

export interface ModuleConfig {
  dashboard: { enabled: boolean };
  emailMarketing: {
    enabled: boolean;
    welcomeSeries: boolean;
    abandonedCart: boolean;
    postPurchase: boolean;
    winback: boolean;
    newsletters: boolean;
  };
  socialMedia: { enabled: boolean; instagram: boolean; twitter: boolean; tiktok: boolean };
  seoPro: { enabled: boolean; blog: boolean; faqSchema: boolean; breadcrumbs: boolean; aiVisibility: boolean };
  googleAds: { enabled: boolean; trackingId: string; remarketing: boolean };
  kira: { enabled: boolean; whatsappFallback: boolean };
  cupones: { enabled: boolean };
  referidos: { enabled: boolean };
  pushNotifications: { enabled: boolean };
  modoCatalogo: { enabled: boolean };
  poweredBy: { enabled: boolean };
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
