import { getAllSubscribers } from "@/lib/sheets/subscribers";
import { getEmailStats } from "@/lib/sheets/emails-log";
import { SubscribersTable } from "@/components/panel/SubscribersTable";
import { NewsletterForm } from "@/components/panel/NewsletterForm";
import { KPICard } from "@/components/panel/KPICard";

export const revalidate = 300;

export default async function MarketingPage() {
  let subscribers: Awaited<ReturnType<typeof getAllSubscribers>> = [];
  let stats = {
    enviados_hoy: 0,
    enviados_semana: 0,
    tasa_apertura_pct: 0,
    total_enviados: 0,
  };

  try {
    [subscribers, stats] = await Promise.all([getAllSubscribers(), getEmailStats()]);
  } catch (err) {
    console.error("[panel/marketing] Error cargando datos:", err);
  }

  const activos = subscribers.filter((s) => s.estado === "activo").length;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)]">Marketing</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard label="Suscriptores activos" value={activos} />
        <KPICard label="Emails enviados hoy" value={stats.enviados_hoy} />
        <KPICard label="Tasa apertura" value={`${stats.tasa_apertura_pct}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
          <h2 className="text-xl font-heading font-semibold mb-4 text-[var(--text-primary)]">
            Enviar newsletter
          </h2>
          <NewsletterForm />
        </div>

        <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
          <h2 className="text-xl font-heading font-semibold mb-4 text-[var(--text-primary)]">
            Suscriptores recientes
          </h2>
          <SubscribersTable subscribers={subscribers} />
        </div>
      </div>
    </div>
  );
}
