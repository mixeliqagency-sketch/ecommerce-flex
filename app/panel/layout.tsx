// Layout del panel admin — protege rutas con verificación de rol
// Middleware ya protege /panel/* (requiere login). Este layout además
// verifica que el usuario sea admin. Clientes autenticados son rebotados.
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthSession } from "@/lib/auth";
import DemoAdminGate from "@/components/panel/DemoAdminGate";

// Defense in depth: DEMO_MODE solo opera fuera de prod por default. Para
// showcase publicos intencionales seteamos ADEMAS DEMO_MODE_ALLOW_PRODUCTION
// — mismo patron que middleware.ts. Sin el opt-in explicito, un deploy
// accidental con DEMO_MODE=true sigue protegiendo el panel.
const IS_DEMO =
  process.env.DEMO_MODE === "true" &&
  (process.env.NODE_ENV !== "production" ||
    process.env.DEMO_MODE_ALLOW_PRODUCTION === "true");

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // En DEMO_MODE dejamos entrar al panel sin auth — sirve para que un cliente
  // potencial vea el producto completo antes de configurar NextAuth.
  if (!IS_DEMO) {
    const session = await getAuthSession();
    if (!session || session.user.role !== "admin") {
      redirect("/auth/login?callbackUrl=/panel");
    }
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
            <Link href="/panel/marketing" className="hover:text-[var(--color-primary)] transition">Marketing</Link>
            <Link href="/panel/redes-sociales" className="hover:text-[var(--color-primary)] transition">Redes</Link>
            <Link href="/panel/referidos" className="hover:text-[var(--color-primary)] transition">Referidos</Link>
            <Link href="/panel/config" className="hover:text-[var(--color-primary)] transition">Config</Link>
            <Link href="/" className="hover:text-[var(--color-primary)] transition inline-flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Tienda
            </Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {/* En DEMO_MODE este gate client-side chequea isDemoAdmin() del
            localStorage y redirige a /cuenta si no activo el "soy el dueno".
            En prod el gate es transparente — el server-side ya verifico role. */}
        <DemoAdminGate>{children}</DemoAdminGate>
      </main>
    </div>
  );
}
