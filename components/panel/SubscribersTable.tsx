import type { Subscriber } from "@/types";

export function SubscribersTable({ subscribers }: { subscribers: Subscriber[] }) {
  if (subscribers.length === 0) {
    return <p className="text-[var(--text-muted)]">Sin suscriptores aún.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-[var(--border-glass)] text-[var(--text-secondary)]">
            <th className="py-2 pr-4">Email</th>
            <th className="py-2 pr-4">Origen</th>
            <th className="py-2 pr-4">Estado</th>
            <th className="py-2">Suscrito</th>
          </tr>
        </thead>
        <tbody>
          {subscribers.slice(0, 50).map((s) => (
            <tr
              key={s.id}
              className="border-b border-[var(--border-glass)]/50 text-[var(--text-primary)]"
            >
              <td className="py-2 pr-4">{s.email}</td>
              <td className="py-2 pr-4 text-[var(--text-muted)]">{s.source}</td>
              <td className="py-2 pr-4">
                <span
                  className={
                    s.estado === "activo"
                      ? "text-[var(--color-success)]"
                      : "text-[var(--text-muted)]"
                  }
                >
                  {s.estado}
                </span>
              </td>
              <td className="py-2">
                {new Date(s.fecha).toLocaleDateString("es-AR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {subscribers.length > 50 && (
        <p className="text-xs text-[var(--text-muted)] mt-2">
          Mostrando los primeros 50 de {subscribers.length}
        </p>
      )}
    </div>
  );
}
