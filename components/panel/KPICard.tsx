// Card reutilizable para mostrar KPI en el dashboard
interface KPICardProps {
  label: string;
  value: string | number;
  variation?: number; // % vs día anterior
  icon?: React.ReactNode;
}

export function KPICard({ label, value, variation, icon }: KPICardProps) {
  const variationColor =
    variation === undefined
      ? ""
      : variation > 0
      ? "text-[var(--color-success)]"
      : variation < 0
      ? "text-[var(--color-danger)]"
      : "text-[var(--text-muted)]";

  const variationArrow =
    variation === undefined ? "" : variation > 0 ? "▲" : variation < 0 ? "▼" : "—";

  return (
    <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-heading font-bold text-[var(--text-primary)]">{value}</div>
      {variation !== undefined && (
        <div className={`text-sm mt-2 ${variationColor}`}>
          {variationArrow} {Math.abs(variation).toFixed(1)}% vs ayer
        </div>
      )}
    </div>
  );
}
