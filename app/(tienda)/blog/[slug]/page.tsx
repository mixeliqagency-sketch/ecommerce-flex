import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPostBySlug, getPublishedBlogPosts } from "@/lib/sheets/blog";
import { MarkdownContent } from "@/components/blog/MarkdownContent";
import { BlogPostSchema } from "@/components/seo/BlogPostSchema";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { themeConfig } from "@/theme.config";

export const revalidate = 600;

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const posts = await getPublishedBlogPosts();
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    // Sheets puede no estar disponible en build time; ISR generara las paginas on-demand
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  if (!post || !post.publicado) return { title: "Articulo no encontrado" };

  return {
    title: `${post.titulo} | ${themeConfig.brand.name}`,
    description: post.descripcion,
    keywords: post.keywords,
    openGraph: {
      title: post.titulo,
      description: post.descripcion,
      type: "article",
      publishedTime: post.fecha,
      images: post.imagen_url ? [post.imagen_url] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post || !post.publicado) notFound();

  const breadcrumbs = [
    { name: "Inicio", url: themeConfig.brand.url },
    { name: "Blog", url: `${themeConfig.brand.url}/blog` },
    { name: post.titulo, url: `${themeConfig.brand.url}/blog/${post.slug}` },
  ];

  return (
    <>
      <BlogPostSchema post={post} />
      <BreadcrumbSchema items={breadcrumbs} />

      <article className="container mx-auto px-4 py-12 max-w-3xl">
        <nav className="text-sm text-[var(--text-muted)] mb-6">
          <Link href="/" className="hover:text-[var(--color-primary)]">
            Inicio
          </Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-[var(--color-primary)]">
            Blog
          </Link>
          <span className="mx-2">/</span>
          <span>{post.categoria}</span>
        </nav>

        <header className="mb-8">
          <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] mb-4">
            <span>{post.categoria}</span>
            <span>·</span>
            <span>{post.tiempo_lectura} min de lectura</span>
            <span>·</span>
            <span>
              {new Date(post.fecha).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-[var(--text-primary)] mb-4 leading-tight">
            {post.titulo}
          </h1>
          <p className="text-lg text-[var(--text-secondary)]">{post.descripcion}</p>
          <div className="mt-6 text-sm text-[var(--text-muted)]">Por {post.autor}</div>
        </header>

        {post.imagen_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={post.imagen_url}
            alt={post.titulo}
            className="w-full rounded-[var(--radius-card)] mb-8"
          />
        )}

        <MarkdownContent markdown={post.contenido} />
      </article>
    </>
  );
}
