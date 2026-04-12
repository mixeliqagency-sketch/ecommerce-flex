import type { OrderStatus } from "@/types";

const STATUS_COLORS: Record<OrderStatus, string> = {
  creado: "bg-gray-500",
  pendiente_pago: "bg-yellow-500",
  pagado: "bg-blue-500",
  preparando: "bg-indigo-500",
  enviado: "bg-purple-500",
  entregado: "bg-green-500",
  cancelado: "bg-red-500",
  reembolsado: "bg-orange-500",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  creado: "Creado",
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  preparando: "Preparando",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`${STATUS_COLORS[status]} text-white text-xs px-2 py-1 rounded-full inline-block`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
