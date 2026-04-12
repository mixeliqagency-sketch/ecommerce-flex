// Layout del panel admin — protege rutas con verificación de rol
// Middleware ya protege /panel/* (requiere login). Este layout además
// verifica que el usuario sea admin. Clientes autenticados son rebotados.
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthSession } from "@/lib/auth";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();

  if (!session || session.user.role !== "admin") {
    redirect("/auth/login?callbackUrl=/panel");
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header className="border-b border-[var(--border-glass)] bg-[var(--bg-secondary)]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/panel" className="text-xl font-heading font-bold text-[var(--text-primary)]">
            Panel Admin
          </Link>
          <nav className="hidden md:flex gap-6 text-sm text-[var(--text-secondary)]">
            <Link href="/panel" className="hover:text-[var(--color-primary)] transition">Dashboard</Link>
            <Link href="/panel/pedidos" className="hover:text-[var(--color-primary)] transition">Pedidos</Link>
            <Link href="/panel/cupones" className="hover:text-[var(--color-primary)] transition">Cupones</Link>
            <Link href="/panel/seo" className="hover:text-[var(--color-primary)] transition">SEO</Link>
            <Link href="/panel/config" className="hover:text-[var(--color-primary)] transition">Config</Link>
            <Link href="/" className="hover:text-[var(--color-primary)] transition">← Tienda</Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
