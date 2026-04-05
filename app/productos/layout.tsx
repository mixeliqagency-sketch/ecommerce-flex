import type { Metadata } from "next";

export const metadata: Metadata = {
  // Titulo optimizado: keyword de compra + marca (52 chars)
  title: "Comprar Suplementos Deportivos Online Argentina",
  description:
    // Descripcion enfocada en conversion: keywords + diferencial de precio + envio (154 chars)
    "Compra creatina, proteina whey, omega 3 y mas suplementos deportivos en pesos argentinos. Envio a todo el pais. Calidad verificada. Tienda oficial AOURA.",
  keywords: [
    "comprar suplementos deportivos online",
    "suplementos argentina",
    "creatina precio argentina",
    "proteina whey argentina",
    "omega 3 suplemento",
    "tienda suplementos online argentina",
    "suplementos gym baratos",
    "nutricion deportiva argentina",
    "comprar creatina online",
    "suplementos en pesos",
  ],
  alternates: {
    canonical: "/productos",
  },
  openGraph: {
    title: "Comprar Suplementos Deportivos Online Argentina | AOURA",
    description:
      "Compra creatina, proteina whey, omega 3 y mas suplementos deportivos en pesos argentinos. Envio a todo el pais. Calidad verificada.",
    url: "/productos",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
