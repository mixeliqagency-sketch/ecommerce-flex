import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Cuenta",
  description:
    "Administra tu perfil, historial de pedidos y configuracion personal. Accede a tus datos de forma segura.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
