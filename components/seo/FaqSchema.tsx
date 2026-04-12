// Schema.org FAQPage JSON-LD — produce rich snippet en Google.
// El contenido viene de props tipados (no input de usuario), por lo que JSON.stringify
// es seguro: no se inyecta HTML, solo una cadena JSON dentro de <script type="application/ld+json">.
import JsonLd from "./JsonLd";

interface FaqItem {
  question: string;
  answer: string;
}

export function FaqSchema({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return <JsonLd data={schema} />;
}
