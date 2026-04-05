import { MetadataRoute } from "next";
import { getProducts } from "@/lib/google-sheets";
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

  return [...staticPages, ...productPages];
}
