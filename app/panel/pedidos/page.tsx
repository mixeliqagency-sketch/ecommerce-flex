import { getOrdersAll } from "@/lib/sheets/orders";
import { OrderStatusBadge } from "@/components/panel/OrderStatusBadge";
import { formatPrice } from "@/lib/utils";

export const revalidate = 30;

export default async function PedidosPage() {
  const orders = await getOrdersAll();
  orders.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)]">Pedidos</h1>
      <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)] overflow-x-auto">
        {orders.length === 0 ? (
          <p className="text-[var(--text-muted)]">Todavía no hay pedidos.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[var(--border-glass)] text-[var(--text-secondary)]">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Cliente</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Método</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-[var(--border-glass)]/50 text-[var(--text-primary)]">
                  <td className="py-2 pr-4 font-mono text-xs">{order.id.slice(0, 8)}</td>
                  <td className="py-2 pr-4">{order.nombre} {order.apellido}</td>
                  <td className="py-2 pr-4">{formatPrice(order.total)}</td>
                  <td className="py-2 pr-4">{order.metodo_pago}</td>
                  <td className="py-2 pr-4"><OrderStatusBadge status={order.estado} /></td>
                  <td className="py-2">{new Date(order.fecha).toLocaleDateString("es-AR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
