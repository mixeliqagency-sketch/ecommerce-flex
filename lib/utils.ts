interface Category {
  slug: string;
  nombre: string;
  icono: string;
}

// Formatear precio argentino: $28.000
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Calcular porcentaje de descuento
export function calcDiscount(original: number, current: number): number {
  if (!original || original <= current) return 0;
  return Math.round(((original - current) / original) * 100);
}

// Calcular cuotas segun monto (logica simplificada para mostrar en cards)
export function calcInstallments(precio: number): { cantidad: number; monto: number } | null {
  if (precio <= 0) return null;
  if (precio >= 50000) return { cantidad: 12, monto: Math.round(precio / 12) };
  if (precio >= 25000) return { cantidad: 6, monto: Math.round(precio / 6) };
  if (precio >= 10000) return { cantidad: 3, monto: Math.round(precio / 3) };
  return null;
}

// Categorias con iconos (los SVG se renderizan en los componentes)
export const CATEGORIES: Category[] = [
  { slug: "todos", nombre: "Todos", icono: "grid" },
  { slug: "proteinas", nombre: "Proteinas", icono: "protein" },
  { slug: "creatina", nombre: "Creatina", icono: "lightning" },
  { slug: "adaptogenos", nombre: "Adaptogenos", icono: "leaf" },
  { slug: "colageno", nombre: "Colageno", icono: "drop" },
  { slug: "superfoods", nombre: "Superfoods", icono: "seed" },
  { slug: "ofertas", nombre: "Ofertas", icono: "tag" },
  { slug: "accesorios", nombre: "Accesorios", icono: "bag" },
];

// Envio gratis a partir de este monto
export const FREE_SHIPPING_THRESHOLD = 50000;

// Armar link de WhatsApp con mensaje pre-cargado
export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
