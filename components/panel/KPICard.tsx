// Card reutilizable para mostrar KPI en el dashboard
interface KPICardProps {
  label: string;
  value: string | number;
  variation?: number; // % vs día anterior
  icon?: React.ReactNode;
}

// SVG inline: nunca usar flechas Unicode (regla permanente)
function ArrowUp() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline"
      aria-hidden="true"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
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

  return (
    <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-heading font-bold text-[var(--text-primary)]">{value}</div>
      {variation !== undefined && (
        <div className={`text-sm mt-2 ${variationColor} flex items-center gap-1`}>
          {variation > 0 && <ArrowUp />}
          {variation < 0 && <ArrowDown />}
          <span>{Math.abs(variation).toFixed(1)}% vs ayer</span>
        </div>
      )}
    </div>
  );
}
