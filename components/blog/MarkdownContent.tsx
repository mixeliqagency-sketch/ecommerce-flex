// Renderiza markdown a HTML usando marked + sanitiza con DOMPurify.
// SEGURIDAD: incluso cuando el markdown viene del admin, sanitizamos siempre
// (defensa en profundidad). DOMPurify elimina <script>, event handlers y otros
// vectores XSS sin romper el HTML legítimo de blog posts.

import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

marked.setOptions({
  gfm: true,
  breaks: false,
});

export function MarkdownContent({ markdown }: { markdown: string }) {
  const rawHtml = marked.parse(markdown, { async: false }) as string;
  const safeHtml = DOMPurify.sanitize(rawHtml);
  return (
    <div
      className="prose-content"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
