import { MetadataRoute } from "next";
import { getProducts } from "@/lib/google-sheets";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://aoura-salud.vercel.app";

  // Fecha de ultima actualizacion real del sitio — actualizar manualmente en cada deploy importante
  const lastMod = new Date("2026-04-01");

  // Paginas estaticas ordenadas por prioridad SEO:
  // 1.0 = home, 0.9 = paginas de conversion (productos), 0.8 = herramientas principales,
  // 0.7 = contenido educativo, 0.6 = sub-secciones
  const staticPages: MetadataRoute.Sitemap = [
    // Home — maxima prioridad, se actualiza frecuentemente con novedades
    { url: baseUrl, lastModified: lastMod, changeFrequency: "daily", priority: 1 },

    // Catalogo — alta prioridad por intencion de compra
    { url: `${baseUrl}/productos`, lastModified: lastMod, changeFrequency: "daily", priority: 0.9 },

    // Fitness tracker — herramienta principal de retencion
    { url: `${baseUrl}/fitness`, lastModified: lastMod, changeFrequency: "weekly", priority: 0.8 },

    // Biblioteca de ejercicios — contenido SEO evergreen con alta densidad de keywords
    { url: `${baseUrl}/fitness/library`, lastModified: lastMod, changeFrequency: "monthly", priority: 0.7 },

    // Cardio tracker — herramienta secundaria de retencion
    { url: `${baseUrl}/cardio`, lastModified: lastMod, changeFrequency: "weekly", priority: 0.8 },

    // NIA nutricionista IA — diferencial de producto, actualizado cuando mejora la IA
    { url: `${baseUrl}/nia`, lastModified: lastMod, changeFrequency: "monthly", priority: 0.7 },

    // Aprender — contenido SEO educativo de largo plazo
    { url: `${baseUrl}/aprender`, lastModified: lastMod, changeFrequency: "weekly", priority: 0.7 },
  ];

  // Paginas de productos dinamicas — generadas desde Google Sheets
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    productPages = products.map((p) => ({
      url: `${baseUrl}/productos/${p.slug}`,
      lastModified: lastMod,
      changeFrequency: "weekly" as const,
      // Prioridad alta porque son paginas de producto con intencion de compra
      priority: 0.85,
    }));
  } catch {
    // Si falla la conexion a Sheets, devolver solo paginas estaticas sin romper el build
  }

  return [...staticPages, ...productPages];
}
