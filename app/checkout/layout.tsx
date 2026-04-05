import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Finaliza tu compra. Pago seguro con MercadoPago. Envio rapido a todo el pais.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
