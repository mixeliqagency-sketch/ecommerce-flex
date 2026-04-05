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
