import { getDashboardMetrics } from "@/lib/sheets/metrics";
import { getAbandonedCartsToday } from "@/lib/sheets/carts";
import { KPICard } from "@/components/panel/KPICard";
import { formatPrice } from "@/lib/utils";

export const revalidate = 300;

export default async function DashboardPage() {
  const [metrics, carritosHoy] = await Promise.all([
    getDashboardMetrics(),
    getAbandonedCartsToday(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)]">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          label="Ventas hoy"
          value={formatPrice(metrics.ventas_hoy)}
          variation={metrics.variacion_ventas_pct}
        />
        <KPICard label="Pedidos hoy" value={metrics.pedidos_hoy} />
        <KPICard label="Ventas semana" value={formatPrice(metrics.ventas_semana)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
          <h2 className="text-xl font-heading font-semibold mb-4 text-[var(--text-primary)]">Top productos</h2>
          {metrics.top_productos.length === 0 ? (
            <p className="text-[var(--text-muted)]">Aún no hay ventas</p>
          ) : (
            <ol className="space-y-2">
              {metrics.top_productos.map((p, i) => (
                <li key={p.slug} className="flex justify-between text-sm text-[var(--text-secondary)]">
                  <span>{i + 1}. {p.nombre}</span>
                  <span className="text-[var(--text-muted)]">{p.cantidad} un.</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
          <h2 className="text-xl font-heading font-semibold mb-4 text-[var(--text-primary)]">Carritos abandonados</h2>
          <div className="text-3xl font-bold text-[var(--text-primary)] mb-2">{carritosHoy.length}</div>
          <p className="text-sm text-[var(--text-muted)]">abandonados hoy</p>
        </div>
      </div>
    </div>
  );
}
