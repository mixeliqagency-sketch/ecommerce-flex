"use client";

// DemoAdminGate — client guard para rutas /panel/* cuando estamos en DEMO_MODE.
//
// En PRODUCCION: el layout server-side de /panel ya hace el check de role
// contra NextAuth, este componente es transparente (siempre renderea children).
//
// En DEMO_MODE: el layout server-side deja pasar a cualquiera porque no hay
// NextAuth. Este wrapper ejecuta el check de "soy el dueno en demo" en cliente
// leyendo el flag de localStorage. Si no lo sos, te redirigimos a /cuenta
// donde esta la perilla para activarlo.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDemoAdmin } from "@/lib/demo-auth";
import { isDemoModeClient } from "@/lib/demo-data";

export default function DemoAdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAdmin, mounted } = useDemoAdmin();

  useEffect(() => {
    // Solo aplica en demo. En prod el server-side layout ya protegio la ruta.
    if (!isDemoModeClient()) return;
    if (!mounted) return;
    if (!isAdmin) {
      router.replace("/cuenta?panel=blocked");
    }
  }, [mounted, isAdmin, router]);

  // En prod dejamos pasar siempre (el server-side layout ya verifico admin).
  if (!isDemoModeClient()) return <>{children}</>;

  // En demo: hasta que el hook monte + confirme admin, mostramos placeholder.
  if (!mounted || !isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-text-secondary">
        Verificando acceso...
      </div>
    );
  }

  return <>{children}</>;
}
