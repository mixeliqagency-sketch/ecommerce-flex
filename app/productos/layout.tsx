import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Productos",
  description:
    "Explora nuestro catalogo completo de productos. Envio a todo el pais. Calidad verificada.",
  keywords: [
    "comprar online",
    "productos argentina",
    "tienda online argentina",
    "ofertas online",
    "envio a todo el pais",
  ],
  alternates: {
    canonical: "/productos",
  },
  openGraph: {
    title: "Productos",
    description:
      "Explora nuestro catalogo completo de productos. Envio a todo el pais. Calidad verificada.",
    url: "/productos",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
