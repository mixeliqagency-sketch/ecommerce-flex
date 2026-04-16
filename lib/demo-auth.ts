// lib/demo-auth.ts
// Simulacion de sesion de usuario en DEMO_MODE.
//
// En produccion Ecomflex usa NextAuth (Google OAuth o email/password contra
// Sheets). En DEMO_MODE no hay NextAuth configurado, pero igual queremos
// que Pablo pueda testear el flow: "estoy deslogueado → no puedo comprar
// ni ir a cuenta → voy a /auth/login → se setea una session fake → puedo
// todo → cerrar sesion → vuelta al estado inicial".
//
// Implementacion: un flag booleano en localStorage + evento custom para que
// los componentes que escuchan se re-rendereen al cambiar.
//
// NO usar esta sesion fake para decisiones de seguridad server-side. Solo
// es UX para el modo demo.

"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "demo_session_active";
const EVENT = "demo-session-change";

// Nombre de usuario fake — lo mostramos en /cuenta cuando esta logueado en demo
export const DEMO_USER = {
  name: "Usuario Demo",
  email: "demo@andax.com.ar",
  image: null as string | null,
};

export function setDemoSession(active: boolean): void {
  if (typeof window === "undefined") return;
  if (active) {
    localStorage.setItem(STORAGE_KEY, "true");
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  // Disparar un evento para que el hook en otros componentes se entere.
  // El evento 'storage' del browser solo dispara entre tabs distintas, no
  // dentro de la misma tab — por eso usamos un custom event.
  window.dispatchEvent(new Event(EVENT));
}

export function isDemoLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

/**
 * Hook reactivo que se actualiza cuando cambia el estado de la sesion demo.
 * Retorna `false` en SSR y en el primer render (hasta que el useEffect lee
 * localStorage). Usarlo siempre con el `mounted` flag abajo si necesitas
 * saber si ya se hidrato.
 */
export function useDemoSession(): { active: boolean; mounted: boolean } {
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setActive(isDemoLoggedIn());
    setMounted(true);

    const handler = () => setActive(isDemoLoggedIn());
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { active, mounted };
}

