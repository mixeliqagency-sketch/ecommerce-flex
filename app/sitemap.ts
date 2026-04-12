import { MetadataRoute } from "next";
import { getProducts } from "@/lib/sheets/products";
import { getPublishedBlogPosts } from "@/lib/sheets/blog";
import { themeConfig } from "@/theme.config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || themeConfig.brand.url;
  const lastMod = new Date("2026-04-05");

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: lastMod, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/productos`, lastModified: lastMod, changeFrequency: "daily", priority: 0.9 },
  ];

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    productPages = products.map((p) => ({
      url: `${baseUrl}/productos/${p.slug}`,
      lastModified: lastMod,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));
  } catch {
    // Si falla Sheets, devolver solo paginas estaticas
  }

  // Blog: pagina raiz + posts publicados
  let posts: Awaited<ReturnType<typeof getPublishedBlogPosts>> = [];
  try {
    posts = await getPublishedBlogPosts();
  } catch (err) {
    console.error("[sitemap] Error leyendo blog posts:", err);
  }

  const blogRootUrl: MetadataRoute.Sitemap[number] = {
    url: `${baseUrl}/blog`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  };

  const blogUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.fecha),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...productPages, blogRootUrl, ...blogUrls];
}
