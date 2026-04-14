import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/sheets/products";
import { getReviewsByProduct } from "@/lib/sheets/reviews";
import JsonLd from "@/components/seo/JsonLd";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { themeConfig } from "@/theme.config";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Producto no encontrado" };
  }

  const desc = product.descripcion || "Producto de calidad";
  // Truncar descripcion a ~155 caracteres para SEO optimo
  const fullDesc = `${product.nombre} de ${product.marca}. ${desc}. $${product.precio} — Envio a todo el pais.`;
  const seoDesc = fullDesc.length > 160 ? fullDesc.slice(0, 157) + "..." : fullDesc;

  return {
    title: product.nombre,
    description: seoDesc,
    openGraph: {
      title: product.nombre,
      description: `${product.nombre} — $${product.precio}. ${product.descripcion || "Producto de calidad."}`,
      type: "website",
      ...(product.imagen_url ? { images: [{ url: product.imagen_url }] } : {}),
    },
  };
}

// Layout server-side: genera schema Product + BreadcrumbList + AggregateRating
// para SEO. Google lee JSON-LD del HTML inicial y emite rich snippets en SERP.
// Post-audit 2026-04-13 (SEO expert + auditor): agregamos BreadcrumbList
// (navegacion visible en SERP) y AggregateRating cuando hay reviews reales
// (estrellas visibles en resultados de Google Shopping).
export default async function Layout({ params, children }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  // Fetch de reviews solo para calcular AggregateRating del schema.
  // Si falla (Sheets down / demo mode), seguimos sin el campo — Google
  // igual indexa el producto, solo no muestra estrellas en SERP.
  let aggregateRating: { ratingValue: number; reviewCount: number } | null = null;
  if (product) {
    try {
      const reviews = await getReviewsByProduct(slug);
      if (reviews.length > 0) {
        const sum = reviews.reduce((acc, r) => acc + (r.calificacion ?? 0), 0);
        aggregateRating = {
          ratingValue: Number((sum / reviews.length).toFixed(2)),
          reviewCount: reviews.length,
        };
      }
    } catch {
      // Fail silently — el schema Product sin rating sigue siendo valido
    }
  }

  const productUrl = product ? `${themeConfig.brand.url}/productos/${product.slug}` : "";

  return (
    <>
      {product && (
        <>
          {/* Schema.org Product con AggregateRating opcional (solo si hay reviews) */}
          <JsonLd data={{
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.nombre,
            "description": product.descripcion || "",
            "brand": { "@type": "Brand", "name": product.marca },
            "offers": {
              "@type": "Offer",
              "url": productUrl,
              "priceCurrency": themeConfig.currency.code,
              "price": product.precio,
              "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            },
            ...(product.imagen_url ? { "image": product.imagen_url } : {}),
            ...(aggregateRating ? {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": aggregateRating.ratingValue,
                "reviewCount": aggregateRating.reviewCount,
                "bestRating": 5,
                "worstRating": 1,
              },
            } : {}),
          }} />

          {/* BreadcrumbList — Google lo usa para mostrar el path en los resultados
              de busqueda en vez del URL plano. Mejora CTR ~5-10%. */}
          <BreadcrumbSchema items={[
            { name: "Inicio", url: themeConfig.brand.url },
            { name: "Tienda", url: `${themeConfig.brand.url}/productos` },
            { name: product.nombre, url: productUrl },
          ]} />
        </>
      )}
      {children}
    </>
  );
}
