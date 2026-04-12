import Link from "next/link";
import { getPublishedBlogPosts, getAllBlogPosts } from "@/lib/sheets/blog";
import { getAllKeywords } from "@/lib/sheets/keywords";
import { SeoChecklist } from "@/components/panel/SeoChecklist";

export const revalidate = 300;

export default async function SeoPage() {
  let published: Awaited<ReturnType<typeof getPublishedBlogPosts>> = [];
  let allPosts: Awaited<ReturnType<typeof getAllBlogPosts>> = [];
  let keywords: Awaited<ReturnType<typeof getAllKeywords>> = [];

  try {
    [published, allPosts, keywords] = await Promise.all([
      getPublishedBlogPosts(),
      getAllBlogPosts(),
      getAllKeywords(),
    ]);
  } catch (err) {
    console.error("[panel/seo] Error cargando datos:", err);
  }

  const draftCount = allPosts.length - published.length;

  const checklist: { label: string; status: "ok" | "warning" | "error"; detail?: string }[] = [
    {
      label: "Blog con artículos publicados",
      status: published.length >= 3 ? "ok" : published.length > 0 ? "warning" : "error",
      detail: `${published.length} publicados, ${draftCount} borradores`,
    },
    {
      label: "Keyword map",
      status: keywords.length >= 10 ? "ok" : keywords.length > 0 ? "warning" : "error",
      detail: `${keywords.length} keywords mapeadas`,
    },
    {
      label: "Schema FAQ en productos",
      status: "ok",
      detail: "Implementado automáticamente",
    },
    {
      label: "Schema BreadcrumbList",
      status: "ok",
      detail: "Implementado en blog",
    },
    {
      label: "Robots.txt permite bots LLM",
      status: "ok",
      detail: "GPTBot, PerplexityBot, ClaudeBot permitidos",
    },
    {
      label: "Sitemap XML",
      status: "ok",
      detail: "Incluye productos, blog y páginas legales",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-[var(--text-primary)]">SEO</h1>
        <Link
          href="/panel/seo/blog/nuevo"
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-button)] font-semibold hover:brightness-110"
        >
          + Nuevo artículo
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
          <h2 className="text-xl font-heading font-semibold mb-4 text-[var(--text-primary)]">
            Estado del SEO
          </h2>
          <SeoChecklist items={checklist} />
        </div>

        <div className="bg-[var(--bg-card)] rounded-[var(--radius-card)] p-6 border border-[var(--border-glass)]">
          <h2 className="text-xl font-heading font-semibold mb-4 text-[var(--text-primary)]">
            Artículos del blog
          </h2>
          {allPosts.length === 0 ? (
            <p className="text-[var(--text-muted)]">No hay artículos. Creá el primero.</p>
          ) : (
            <ul className="space-y-2">
              {allPosts.slice(0, 10).map((post) => (
                <li key={post.slug} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/panel/seo/blog/${post.slug}`}
                    className="text-[var(--text-primary)] hover:text-[var(--color-primary)] flex-1 truncate"
                  >
                    {post.titulo}
                  </Link>
                  <span
                    className={
                      post.publicado
                        ? "text-[var(--color-success)]"
                        : "text-[var(--text-muted)]"
                    }
                  >
                    {post.publicado ? "Publicado" : "Borrador"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
