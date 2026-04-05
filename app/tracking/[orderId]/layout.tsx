import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seguimiento de Pedido",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
