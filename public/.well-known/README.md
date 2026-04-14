# Digital Asset Links — `assetlinks.json`

⚠️ **ATENCION: este archivo requiere acción manual antes de publicar la TWA en Google Play Store.**

## Qué es

`assetlinks.json` le dice al Android OS que la TWA (Trusted Web Activity) empaquetada con Bubblewrap **legítimamente representa** al dominio `andax.com.ar` (o el que configures). Sin este archivo correcto, Android muestra la barra de URL dentro de la TWA — lo que arruina la experiencia y puede causar rechazo en Play Store review por UX degradado.

## Cómo completarlo

### Paso 1 — Generar el keystore con Bubblewrap

Después de correr `bubblewrap init --manifest=https://andax.com.ar/manifest.webmanifest`, se crea un archivo `android.keystore` con una firma única de tu app.

### Paso 2 — Extraer el SHA-256 fingerprint

```bash
keytool -list -v -keystore android.keystore -alias android -storepass <TU_KEYSTORE_PASSWORD> -keypass <TU_KEY_PASSWORD>
```

Buscá la línea que dice `SHA256: XX:XX:XX:...` y copiá el valor completo (con los `:`).

### Paso 3 — Reemplazar en `assetlinks.json`

Editá `public/.well-known/assetlinks.json` y reemplazá el string `REEMPLAZAR_CON_FINGERPRINT_DEL_KEYSTORE` con el SHA-256 real:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "ar.com.mixeliq.ecomflex",
      "sha256_cert_fingerprints": ["AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99"]
    }
  }
]
```

> **Podés agregar múltiples fingerprints** si firmás la app con más de una key (ej: dev + release). El array `sha256_cert_fingerprints` acepta N entradas.

### Paso 4 — Verificar que el package_name coincide

El valor de `package_name` en este archivo **DEBE ser exactamente el mismo** que el `applicationId` en `twa-manifest.json` (de Bubblewrap). Por defecto este template usa `ar.com.mixeliq.ecomflex`. Si cambiás de marca, cambialo también acá.

### Paso 5 — Deploy a producción

`assetlinks.json` tiene que ser accesible en `https://<tu-dominio>/.well-known/assetlinks.json` con `Content-Type: application/json` y `Access-Control-Allow-Origin: *`. Eso **ya está configurado** en `next.config.js` → `async headers()`.

### Paso 6 — Validar con el Statement List Tester de Google

```
https://developers.google.com/digital-asset-links/tools/generator
```

Pegá tu dominio + package name + SHA-256 y Google te dice si la validación funciona. Si da 200 OK, estás listo para submitir la TWA.

---

## Referencias

- Spec oficial: https://developers.google.com/digital-asset-links/v1/getting-started
- Bubblewrap docs: https://github.com/GoogleChromeLabs/bubblewrap
- Ecomflex design doc sección 7 (TWA): `docs/superpowers/specs/2026-04-11-ecomflex-design.md`
