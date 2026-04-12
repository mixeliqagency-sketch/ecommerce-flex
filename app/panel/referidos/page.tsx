// Panel: Referidos — KPIs + tabla de top referrers.

import { getAllReferrals } from "@/lib/sheets/referrals";
import { ReferralsTable } from "@/components/panel/ReferralsTable";
import { KPICard } from "@/components/panel/KPICard";
import { formatPrice } from "@/lib/utils";

export const revalidate = 60;

export default async function ReferidosPage() {
  let referrals: Awaited<ReturnType<typeof getAllReferrals>> = [];
  try {
    referrals = await getAllReferrals();
  } catch (err) {
    console.error("[panel/referidos]", err);
  }

  const totalClicks = referrals.reduce((acc, r) => acc + r.total_clicks, 0);
  const totalConversiones = referrals.reduce(
    (acc, r) => acc + r.total_conversiones,
    0
  );
  const totalIngresos = referrals.reduce((acc, r) => acc + r.total_ingresos, 0);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)]">
        Referidos
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard label="Clicks totales" value={totalClicks} />
        <KPICard label="Conversiones" value={totalConversiones} />
        <KPICard label="Ingresos generados" value={formatPrice(totalIngresos)} />
      </div>
      <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
        <h2 className="text-xl font-heading font-semibold mb-4 text-[var(--text-primary)]">
          Top referrers
        </h2>
        <ReferralsTable referrals={referrals} />
      </div>
    </div>
  );
}
