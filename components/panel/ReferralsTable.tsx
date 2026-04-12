// Tabla de links de referidos (server component), ordenada por ingresos desc.

import type { ReferralLink } from "@/types";
import { formatPrice } from "@/lib/utils";

export function ReferralsTable({ referrals }: { referrals: ReferralLink[] }) {
  if (referrals.length === 0) {
    return (
      <p className="text-[var(--text-muted)] text-sm">
        Todavia no hay links de referidos.
      </p>
    );
  }

  const sorted = [...referrals].sort(
    (a, b) => b.total_ingresos - a.total_ingresos
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-[var(--border-glass)] text-[var(--text-secondary)]">
            <th className="py-2 pr-3">Email</th>
            <th className="py-2 pr-3">Codigo</th>
            <th className="py-2 pr-3 text-right">Clicks</th>
            <th className="py-2 pr-3 text-right">Conversiones</th>
            <th className="py-2 pr-3 text-right">Ingresos</th>
            <th className="py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr
              key={r.id}
              className="border-b border-[var(--border-glass)]/50 text-[var(--text-primary)]"
            >
              <td className="py-2 pr-3">{r.user_email}</td>
              <td className="py-2 pr-3 font-mono text-xs">{r.codigo}</td>
              <td className="py-2 pr-3 text-right">{r.total_clicks}</td>
              <td className="py-2 pr-3 text-right">{r.total_conversiones}</td>
              <td className="py-2 pr-3 text-right">
                {formatPrice(r.total_ingresos)}
              </td>
              <td className="py-2">
                <span
                  className={
                    r.activo
                      ? "text-[var(--color-success)]"
                      : "text-[var(--text-muted)]"
                  }
                >
                  {r.activo ? "activo" : "inactivo"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
