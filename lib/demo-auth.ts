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
import { isDemoModeClient } from "@/lib/demo-data";

const STORAGE_KEY = "demo_session_active";
const ADMIN_KEY = "demo_session_admin";
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
    // Si cerras sesion, tambien perdes el modo admin (seguridad por defecto)
    localStorage.removeItem(ADMIN_KEY);
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
 * Demo admin toggle — solo relevante en DEMO_MODE. Permite simular ser el
 * dueno de la tienda para probar el /panel sin configurar NextAuth + Sheets.
 * Requiere que haya una session demo activa primero (no podes ser admin
 * sin estar logueado).
 */
export function setDemoAdmin(active: boolean): void {
  if (typeof window === "undefined") return;
  if (active && !isDemoLoggedIn()) {
    console.warn("[demo-auth] setDemoAdmin(true) ignorado — requiere session demo activa");
    return;
  }
  if (active) {
    localStorage.setItem(ADMIN_KEY, "true");
  } else {
    localStorage.removeItem(ADMIN_KEY);
  }
  window.dispatchEvent(new Event(EVENT));
}

export function isDemoAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_KEY) === "true" && isDemoLoggedIn();
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

/**
 * Hook reactivo para el estado "soy admin" en demo mode.
 */
export function useDemoAdmin(): { isAdmin: boolean; mounted: boolean } {
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsAdmin(isDemoAdmin());
    setMounted(true);

    const handler = () => setIsAdmin(isDemoAdmin());
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { isAdmin, mounted };
}
