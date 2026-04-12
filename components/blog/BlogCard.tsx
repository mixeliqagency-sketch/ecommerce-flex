// Card de articulo en lista
import Link from "next/link";
import type { BlogPost } from "@/types";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-[var(--bg-card)] rounded-[var(--radius-card)] border border-[var(--border-glass)] overflow-hidden hover:border-[var(--color-primary)]/50 transition"
    >
      {post.imagen_url && (
        <div className="aspect-video overflow-hidden bg-[var(--bg-secondary)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imagen_url}
            alt={post.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mb-2">
          <span>{post.categoria}</span>
          <span>·</span>
          <span>{post.tiempo_lectura} min</span>
        </div>
        <h3 className="text-xl font-heading font-semibold mb-2 text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition">
          {post.titulo}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{post.descripcion}</p>
        <div className="mt-4 text-xs text-[var(--text-muted)]">
          {new Date(post.fecha).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>
    </Link>
  );
}
