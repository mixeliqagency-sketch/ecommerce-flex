"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Tabs: Inicio, Tienda (centro semi-elevado), Cuenta
const TABS = [
  {
    href: "/",
    label: "Inicio",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/productos",
    label: "Tienda",
    center: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
  },
  {
    href: "/cuenta",
    label: "Cuenta",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden" aria-label="Navegacion principal">
      <div className="bg-bg-secondary" style={{ borderTop: "1px solid var(--border-decorative)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-end h-14 pb-1">
          {TABS.map((tab) => {
            const active = isActive(tab.href);
            const isCenter = "center" in tab && tab.center;

            if (isCenter) {
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  aria-label={tab.label}
                  className="flex-1 flex flex-col items-center"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
                      active
                        ? "bg-accent-emerald text-white shadow-accent-emerald/20"
                        : "bg-bg-secondary text-text-secondary border border-border-glass"
                    }`}
                    style={{ marginTop: "-24px" }}
                  >
                    {tab.icon}
                  </div>
                  <span
                    className={`text-[10px] min-[360px]:text-xs mt-0.5 ${
                      active ? "text-accent-emerald font-semibold" : "text-text-muted"
                    }`}
                  >
                    {tab.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={tab.label}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                aria-label={tab.label}
                className={`flex-1 flex flex-col items-center py-1 transition-colors ${
                  active ? "text-accent-emerald" : "text-text-secondary"
                }`}
              >
                <div className={`rounded-full px-2.5 min-[360px]:px-4 py-1 transition-all duration-300 ${active ? "bg-accent-emerald/15" : ""}`}>
                  {tab.icon}
                </div>
                <span className={`text-[10px] min-[360px]:text-xs ${active ? "font-semibold" : ""}`}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
