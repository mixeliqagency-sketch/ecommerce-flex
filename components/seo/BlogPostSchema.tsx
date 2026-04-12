// Schema.org Article JSON-LD para blog posts.
// NOTA: el contenido viene de props tipados (BlogPost), no de input de usuario.
// JSON.stringify escapa caracteres especiales automaticamente.

import type { BlogPost } from "@/types";
import { themeConfig } from "@/theme.config";

export function BlogPostSchema({ post }: { post: BlogPost }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.titulo,
    description: post.descripcion,
    image: post.imagen_url ?? `${themeConfig.brand.url}${themeConfig.seo.ogImage}`,
    datePublished: post.fecha,
    dateModified: post.fecha,
    author: {
      "@type": "Person",
      name: post.autor,
    },
    publisher: {
      "@type": "Organization",
      name: themeConfig.brand.name,
      logo: {
        "@type": "ImageObject",
        url: `${themeConfig.brand.url}${themeConfig.brand.logo}`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${themeConfig.brand.url}/blog/${post.slug}`,
    },
    keywords: post.keywords.join(", "),
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
