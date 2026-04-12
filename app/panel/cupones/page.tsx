import { getCoupons } from "@/lib/sheets/coupons";
import { CouponForm } from "@/components/panel/CouponForm";

export const revalidate = 60;

export default async function CuponesPage() {
  const coupons = await getCoupons();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)]">Cupones</h1>
      <CouponForm />
      <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
        <h2 className="text-xl font-heading font-semibold mb-4 text-[var(--text-primary)]">Cupones activos</h2>
        {coupons.length === 0 ? (
          <p className="text-[var(--text-muted)]">No hay cupones creados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[var(--border-glass)] text-[var(--text-secondary)]">
                  <th className="py-2 pr-4">Código</th>
                  <th className="py-2 pr-4">Descuento</th>
                  <th className="py-2 pr-4">Vencimiento</th>
                  <th className="py-2 pr-4">Usos</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.codigo} className="border-b border-[var(--border-glass)]/50 text-[var(--text-primary)]">
                    <td className="py-2 pr-4 font-mono">{c.codigo}</td>
                    <td className="py-2 pr-4">{c.descuento_porcentaje}%</td>
                    <td className="py-2 pr-4">{new Date(c.fecha_vencimiento).toLocaleDateString("es-AR")}</td>
                    <td className="py-2 pr-4">{c.usos_actuales}/{c.usos_maximos || "∞"}</td>
                    <td className="py-2">{c.activo ? "✓ Activo" : "✗ Inactivo"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
