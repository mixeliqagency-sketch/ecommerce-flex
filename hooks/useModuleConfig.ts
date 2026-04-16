// hooks/useModuleConfig.ts
//
// Hook unificado para leer el estado de los toggles de modulos de Ecomflex.
// Lo usan componentes como EmailCapturePopup, ReferralBanner, CartCrossSell,
// PushPermissionPrompt, ShopAssistant para decidir si renderizarse o no.
//
// FUENTES DE VERDAD:
//  - PROD: fetch a /api/config (con cache en memoria del modulo + revalidate
//    cada 5 min via el header s-maxage que ya tiene el endpoint). El Sheets
//    tab "Config" es la autoridad, el admin lo edita desde /panel/config.
//  - DEMO: localStorage con claves namespaceadas por `demoConfigKey()`. Los
//    toggles del panel en demo escriben ahi directo (ver ConfigToggle).
//
// DEFAULTS: si un modulo no esta definido todavia (primera carga, o el admin
// nunca lo tocó), usamos DEFAULT_CONFIG de lib/sheets/config.ts para que
// todo arranque prendido por defecto (ver regla en design doc seccion 5).
//
// USO:
//   const { isEnabled } = useModuleConfig();
//   if (!isEnabled("emailMarketing")) return null;
//   if (!isEnabled("emailMarketing", "welcomeSeries")) return null;
//
// IMPORTANTE: los componentes que usan este hook DEBEN ser client components.
// Si necesitas gatear algo server-side, usa getConfig() directo.

"use client";

import { useEffect, useState } from "react";
import { isDemoModeClient } from "@/lib/demo-data";
// CRITICO: NO importar helpers de config directamente desde componentes de panel
// (ahora en andax-data) porque eso causa errores de hidratacion en Next.js 14
// que rompen TODO el tree cliente silenciosamente.
// Los helpers viven en lib/demo-config-store.ts (codigo puro).
import { demoConfigKey, DEMO_CONFIG_EVENT } from "@/lib/demo-config-store";
import type { ModuleConfig } from "@/types";

// Defaults para cuando un modulo todavia no fue seteado. Coinciden con
// DEFAULT_CONFIG de lib/sheets/config.ts pero duplicados aca para evitar
// un import server-side desde un hook client. Si alguien cambia uno,
// mantener ambos sincronizados.
const DEFAULT_ENABLED: Record<string, Record<string, boolean>> = {
  dashboard: { enabled: true },
  emailMarketing: {
    enabled: true,
    welcomeSeries: true,
    abandonedCart: true,
    postPurchase: true,
    winback: true,
    newsletters: true,
  },
  socialMedia: { enabled: true, instagram: true, twitter: true, tiktok: true },
  seoPro: { enabled: true, blog: true, faqSchema: true, breadcrumbs: true, aiVisibility: true },
  // googleAds.trackingId no esta aca porque es un string (no boolean), y este
  // hook solo reporta boolean toggles. Si un consumer necesita el trackingId,
  // debe leerlo de otro lado (themeConfig o un hook especifico).
  googleAds: { enabled: false, remarketing: false },
  kira: { enabled: true, whatsappFallback: true },
  cupones: { enabled: true },
  referidos: { enabled: true },
  pushNotifications: { enabled: true },
  modoCatalogo: { enabled: false },
  poweredBy: { enabled: true },
};

// Cache de modulo — una sola request a /api/config por mount de app (en prod).
let cachedConfig: ModuleConfig | null = null;
let cachePromise: Promise<ModuleConfig> | null = null;

async function fetchConfigOnce(): Promise<ModuleConfig> {
  if (cachedConfig) return cachedConfig;
  if (cachePromise) return cachePromise;
  cachePromise = fetch("/api/config")
    .then((r) => r.json())
    .then((data) => {
      cachedConfig = data as ModuleConfig;
      return cachedConfig;
    })
    .catch(() => {
      // Si falla el fetch, usamos defaults.
      cachedConfig = DEFAULT_ENABLED as unknown as ModuleConfig;
      return cachedConfig;
    });
  return cachePromise;
}

/**
 * Lee un toggle desde localStorage (en demo mode). Devuelve null si no existe.
 */
function readDemoToggle(modulo: string, propiedad: string): boolean | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(demoConfigKey(modulo, propiedad));
  if (stored === "true") return true;
  if (stored === "false") return false;
  return null;
}

/**
 * Determina si un modulo o sub-modulo esta activo en el momento.
 * Es sincronico — acepta la config en memoria o defaults si todavia no hay fetch.
 */
function evaluate(
  config: ModuleConfig | null,
  modulo: string,
  propiedad: string = "enabled",
): boolean {
  // 1. En demo: localStorage tiene prioridad
  if (isDemoModeClient()) {
    const fromLocal = readDemoToggle(modulo, propiedad);
    if (fromLocal !== null) return fromLocal;
  }

  // 2. Si tenemos config del API (prod), usarla
  if (config) {
    const mod = (config as unknown as Record<string, Record<string, unknown>>)[modulo];
    if (mod && typeof mod[propiedad] === "boolean") {
      return mod[propiedad] as boolean;
    }
  }

  // 3. Fallback a defaults hardcoded
  const fallback = DEFAULT_ENABLED[modulo]?.[propiedad];
  return fallback ?? false;
}

interface UseModuleConfigReturn {
  isEnabled: (modulo: string, propiedad?: string) => boolean;
  loaded: boolean;
}

/**
 * Hook reactivo: lee el config de modulos y se re-renderiza cuando cambia.
 * En demo reacciona a cambios en localStorage (eventos custom). En prod
 * cachea el resultado del fetch por mount.
 */
export function useModuleConfig(): UseModuleConfigReturn {
  const [config, setConfig] = useState<ModuleConfig | null>(cachedConfig);
  const [loaded, setLoaded] = useState(cachedConfig !== null);
  const [, forceRender] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // En demo no hay fetch — todo viene de localStorage.
    if (isDemoModeClient()) {
      setLoaded(true);
      const handler = () => forceRender((n) => n + 1);
      window.addEventListener(DEMO_CONFIG_EVENT, handler);
      window.addEventListener("storage", handler);
      return () => {
        window.removeEventListener(DEMO_CONFIG_EVENT, handler);
        window.removeEventListener("storage", handler);
      };
    }

    // En prod: fetch once, cache en memoria del modulo.
    if (!cachedConfig) {
      fetchConfigOnce().then((c) => {
        if (!cancelled) {
          setConfig(c);
          setLoaded(true);
        }
      });
    } else {
      setLoaded(true);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isEnabled: (modulo: string, propiedad: string = "enabled") =>
      evaluate(config, modulo, propiedad),
    loaded,
  };
}
