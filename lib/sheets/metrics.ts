// lib/sheets/metrics.ts
// Agregación de métricas para el dashboard del panel admin.
// Lee orders via getOrdersAll() y productos via getProducts().

import { getOrdersAll } from "./orders";
import { getProducts } from "./products";
import type { DashboardMetrics, Order, OrderStatus, TopProductMetric, CartItem } from "@/types";

// Estados de pedido que cuentan como ventas confirmadas
const COMPLETED_STATES: OrderStatus[] = ["pagado", "preparando", "enviado", "entregado"];

function isCompleted(order: Order): boolean {
  return COMPLETED_STATES.includes(order.estado);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calcula métricas del dashboard leyendo todos los pedidos.
 * NOTA: usa O(n) sobre el total de pedidos. Para tiendas grandes, usar ISR
 * de 5 min en el endpoint que consume esto (ver sección 21 del spec).
 * Los carritos abandonados se calculan en metrics.ts:getAbandonedCartsCount() del módulo carts.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [orders] = await Promise.all([getOrdersAll(), getProducts()]);

  const now = new Date();
  const hoy = startOfDay(now);
  const ayer = new Date(hoy.getTime() - 24 * 60 * 60 * 1000);
  const semanaAtras = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
  const mesAtras = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);

  const completados = orders.filter(isCompleted);

  const ventasHoy = sumTotalSince(completados, hoy);
  const ventasAyer = sumTotalBetween(completados, ayer, hoy);
  const ventasSemana = sumTotalSince(completados, semanaAtras);
  const ventasMes = sumTotalSince(completados, mesAtras);

  const pedidosHoy = countSince(completados, hoy);
  const pedidosSemana = countSince(completados, semanaAtras);

  // Variación % día vs día anterior
  const variacion =
    ventasAyer > 0 ? ((ventasHoy - ventasAyer) / ventasAyer) * 100 : 0;

  const topProductos = calculateTopProducts(completados, 5);

  return {
    ventas_hoy: ventasHoy,
    ventas_semana: ventasSemana,
    ventas_mes: ventasMes,
    pedidos_hoy: pedidosHoy,
    pedidos_semana: pedidosSemana,
    variacion_ventas_pct: Math.round(variacion * 10) / 10,
    top_productos: topProductos,
    carritos_abandonados_hoy: 0, // Se llena en el endpoint que consume esto
    carritos_recuperados: 0,
  };
}

function sumTotalSince(orders: Order[], since: Date): number {
  return orders
    .filter((o) => new Date(o.fecha) >= since)
    .reduce((sum, o) => sum + o.total, 0);
}

function sumTotalBetween(orders: Order[], from: Date, to: Date): number {
  return orders
    .filter((o) => {
      const f = new Date(o.fecha);
      return f >= from && f < to;
    })
    .reduce((sum, o) => sum + o.total, 0);
}

function countSince(orders: Order[], since: Date): number {
  return orders.filter((o) => new Date(o.fecha) >= since).length;
}

/**
 * Agrega los items de todos los pedidos completados y devuelve los top N.
 */
function calculateTopProducts(orders: Order[], limit: number): TopProductMetric[] {
  const productCount = new Map<string, TopProductMetric>();

  for (const order of orders) {
    for (const item of order.items as CartItem[]) {
      const slug = item.product?.slug;
      const nombre = item.product?.nombre;
      if (!slug || !nombre) continue;

      const cantidad = item.cantidad ?? 1;
      const precio = item.product?.precio ?? 0;
      const existing = productCount.get(slug);

      if (existing) {
        existing.cantidad += cantidad;
        existing.ingresos += cantidad * precio;
      } else {
        productCount.set(slug, {
          slug,
          nombre,
          cantidad,
          ingresos: cantidad * precio,
        });
      }
    }
  }

  return Array.from(productCount.values())
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, limit);
}
