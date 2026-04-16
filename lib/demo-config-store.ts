// lib/demo-config-store.ts
//
// Helpers para persistir/leer los toggles de modulos en DEMO_MODE.
// Usado por hooks/useModuleConfig.ts para leer config desde localStorage.

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
