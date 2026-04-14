// hooks/useIsAuthenticated.ts
// Hook unificado de autenticacion — la fuente de verdad para todos los
// guards de UI (ProductCard, CartContext, checkout, cuenta, etc).
//
// En produccion: devuelve el estado real de NextAuth (via useSession).
// En DEMO_MODE: devuelve el estado de la session fake en localStorage.
//
// USO:
//   const { authenticated, loading } = useIsAuthenticated();
//   if (!authenticated) router.push("/auth/login");
//
// REGLA: NUNCA usar useSession directamente en componentes de UI — siempre
// este hook. Asi si algun dia cambiamos el provider de auth, solo editamos
// este archivo.

"use client";

import { useSession } from "next-auth/react";
import { useDemoSession } from "@/lib/demo-auth";
import { isDemoModeClient } from "@/lib/demo-data";

interface AuthState {
  authenticated: boolean;
  loading: boolean;
}

export function useIsAuthenticated(): AuthState {
  const { status } = useSession();
  const { active: demoActive, mounted: demoMounted } = useDemoSession();

  // En demo mode: usamos la session fake. Mientras no se monte el effect
  // del hook demo, devolvemos loading=true para evitar flicker.
  if (isDemoModeClient()) {
    return {
      authenticated: demoActive,
      loading: !demoMounted,
    };
  }

  // Produccion: NextAuth
  return {
    authenticated: status === "authenticated",
    loading: status === "loading",
  };
}
