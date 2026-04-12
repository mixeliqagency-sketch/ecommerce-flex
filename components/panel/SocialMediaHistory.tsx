// Tabla de historial de publicaciones en redes sociales (server component).

import type { SocialMediaPost } from "@/types";

const PLATFORM_STYLES: Record<SocialMediaPost["platform"], string> = {
  instagram: "bg-pink-500/15 text-pink-400",
  twitter: "bg-sky-500/15 text-sky-400",
  tiktok: "bg-fuchsia-500/15 text-fuchsia-400",
};

const ESTADO_STYLES: Record<SocialMediaPost["estado"], string> = {
  pendiente: "text-[var(--text-muted)]",
  publicado: "text-[var(--color-success)]",
  fallido: "text-[var(--color-danger)]",
};

function truncate(text: string, max = 80): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

export function SocialMediaHistory({ posts }: { posts: SocialMediaPost[] }) {
  if (posts.length === 0) {
    return (
      <p className="text-[var(--text-muted)] text-sm">
        No hay publicaciones todavia.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-[var(--border-glass)] text-[var(--text-secondary)]">
            <th className="py-2 pr-3">Plataforma</th>
            <th className="py-2 pr-3">Contenido</th>
            <th className="py-2 pr-3">Estado</th>
            <th className="py-2 pr-3">Fecha</th>
            <th className="py-2">Ext. ID</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr
              key={p.id}
              className="border-b border-[var(--border-glass)]/50 text-[var(--text-primary)]"
            >
              <td className="py-2 pr-3">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${PLATFORM_STYLES[p.platform]}`}
                >
                  {p.platform}
                </span>
              </td>
              <td className="py-2 pr-3 max-w-xs">
                <span title={p.contenido}>{truncate(p.contenido)}</span>
              </td>
              <td className={`py-2 pr-3 ${ESTADO_STYLES[p.estado]}`}>
                {p.estado}
              </td>
              <td className="py-2 pr-3 text-[var(--text-muted)]">
                {p.fecha_creacion
                  ? new Date(p.fecha_creacion).toLocaleString("es-AR")
                  : "—"}
              </td>
              <td className="py-2 text-xs text-[var(--text-muted)] font-mono">
                {p.external_id || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
