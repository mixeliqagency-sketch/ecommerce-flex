// Componente reutilizable para insertar schema markup JSON-LD (datos estructurados para SEO)
// Recibe un objeto con la estructura del schema y lo renderiza como <script type="application/ld+json">
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
