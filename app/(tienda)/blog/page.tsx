import type { Metadata } from "next";
import { getPublishedBlogPosts } from "@/lib/sheets/blog";
import { BlogGrid } from "@/components/blog/BlogGrid";
import { themeConfig } from "@/theme.config";

export const revalidate = 600;

export const metadata: Metadata = {
  title: `Blog | ${themeConfig.brand.name}`,
  description: `Guias, consejos y articulos sobre suplementacion deportiva, nutricion y bienestar. Aprende a elegir la creatina, magnesio, colageno y proteina que te conviene.`,
  keywords: [
    "blog suplementos",
    "creatina como tomar",
    "magnesio bisglicinato",
    "colageno hidrolizado",
    "whey protein guia",
    "nutricion deportiva",
    "suplementos argentina blog",
    ...themeConfig.seo.keywords,
  ],
  openGraph: {
    title: `Blog | ${themeConfig.brand.name}`,
    description: "Guias y consejos sobre suplementacion deportiva y bienestar.",
    type: "website",
  },
};

export default async function BlogPage() {
  let posts: Awaited<ReturnType<typeof getPublishedBlogPosts>> = [];
  try {
    posts = await getPublishedBlogPosts();
  } catch {
    // Sheets puede no estar disponible (build sin env vars); ISR reintentara
    posts = [];
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-6xl">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-heading font-bold text-[var(--text-primary)] mb-4">
          Blog
        </h1>
        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
          Articulos, guias y consejos sobre nuestros productos.
        </p>
      </header>
      <BlogGrid posts={posts} />
    </main>
  );
}
