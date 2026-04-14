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
      <header className="border-b border-[var(--border-glass)] bg-[var(--bg-secondary)] sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-4">
          <Link href="/panel" className="text-lg md:text-xl font-heading font-bold text-[var(--text-primary)] flex-shrink-0">
            Panel Admin
          </Link>
          <Link href="/" className="hover:text-[var(--color-primary)] transition inline-flex items-center gap-1 text-xs md:text-sm text-[var(--text-secondary)] flex-shrink-0" aria-label="Volver a la tienda">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span className="hidden sm:inline">Tienda</span>
          </Link>
        </div>
        {/* Nav tabs — horizontal scroll en mobile, fila normal en desktop.
            Antes era hidden md:flex asi que en mobile no habia navegacion
            entre secciones del panel — solo se veia la pantalla actual. */}
        <nav className="border-t border-[var(--border-glass)] overflow-x-auto scrollbar-hide">
          <div className="container mx-auto flex gap-1 px-2 text-sm text-[var(--text-secondary)] whitespace-nowrap">
            {[
              { href: "/panel", label: "Dashboard" },
              { href: "/panel/pedidos", label: "Pedidos" },
              { href: "/panel/cupones", label: "Cupones" },
              { href: "/panel/seo", label: "SEO" },
              { href: "/panel/marketing", label: "Marketing" },
              { href: "/panel/redes-sociales", label: "Redes" },
              { href: "/panel/referidos", label: "Referidos" },
              { href: "/panel/config", label: "Config" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2.5 hover:text-[var(--color-primary)] hover:bg-[var(--bg-card)] rounded transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
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
