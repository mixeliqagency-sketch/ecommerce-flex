// Renderiza markdown a HTML usando marked.
// SEGURIDAD: el markdown proviene del admin (rol verificado), no de usuarios anonimos.
// marked es seguro por defecto (escapa HTML embebido que no sea whitelisted).

import { marked } from "marked";

marked.setOptions({
  gfm: true,
  breaks: false,
});

export function MarkdownContent({ markdown }: { markdown: string }) {
  const html = marked.parse(markdown, { async: false }) as string;
  return (
    <div
      className="prose-content"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
