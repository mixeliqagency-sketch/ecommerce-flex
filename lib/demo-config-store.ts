// lib/demo-config-store.ts
//
// Helpers para persistir/leer los toggles de modulos en DEMO_MODE.
//
// Estas utilidades VIVIAN antes en components/panel/ConfigToggle.tsx, pero se
// extrajeron a este archivo separado sin "use client" directive porque:
//
// 1. Next.js 14 tiene issues al importar non-component exports (funciones,
//    constantes) desde archivos marcados con "use client" cuando esos exports
//    se usan en hooks consumidos por otros client components. Causa errores
//    de hidratacion silenciosos donde TODO el tree cliente falla al hidratar.
//
// 2. Las utilidades de abajo son codigo puro sin React — no necesitan ser
//    client components. Ponerlas aca separadas es la arquitectura correcta.
//
// Consumers: ConfigToggle.tsx, hooks/useModuleConfig.ts

// Clave de localStorage para un toggle especifico. Namespace "ecomflex_cfg:"
// para no colisionar con otras keys. Formato: ecomflex_cfg:modulo:propiedad.
export function demoConfigKey(modulo: string, propiedad: string): string {
  return `ecomflex_cfg:${modulo}:${propiedad}`;
}

// Evento custom que disparamos en la misma tab cuando un toggle cambia.
// El evento 'storage' de los browsers solo dispara entre tabs distintas —
// necesitamos este custom event para que los hooks en el MISMO tab se
// enteren del cambio sin necesitar reload.
export const DEMO_CONFIG_EVENT = "ecomflex-config-change";
