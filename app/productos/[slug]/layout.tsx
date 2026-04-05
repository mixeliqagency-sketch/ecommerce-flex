import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/google-sheets";
import JsonLd from "@/components/seo/JsonLd";
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

// Layout server-side: genera schema Product para SEO (Google lee JSON-LD del HTML inicial)
export default async function Layout({ params, children }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  return (
    <>
      {product && (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.nombre,
          "description": product.descripcion || product.descripcion || "",
          "brand": { "@type": "Brand", "name": product.marca },
          "offers": {
            "@type": "Offer",
            "url": `${themeConfig.brand.url}/productos/${product.slug}`,
            "priceCurrency": "ARS",
            "price": product.precio,
            "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
          ...(product.imagen_url ? { "image": product.imagen_url } : {}),
        }} />
      )}
      {children}
    </>
  );
}
