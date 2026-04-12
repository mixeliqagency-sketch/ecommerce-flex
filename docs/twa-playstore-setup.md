# TWA + Play Store Setup — Ecomflex

Guia completa para publicar Ecomflex como app Android en Google Play Store usando Trusted Web Activities (TWA).

Una TWA es basicamente una PWA envuelta en un APK que se publica en Play Store como cualquier otra app nativa. Usa Chrome Custom Tabs por debajo, asi que es la misma web pero instalable desde la Play Store.

---

## 1. Prerrequisitos

- Node.js 18+ instalado
- JDK 17+ (requerido por Bubblewrap para firmar el APK)
- Cuenta Google Play Console (USD 25 pago unico)
- PWA ya desplegada en HTTPS con `manifest.json` valido (ya esta en `/manifest.json`)
- Dominio final de produccion (ej: `ecomflex.vercel.app` o dominio propio)

---

## 2. Instalar Bubblewrap

Bubblewrap es la CLI oficial de Google para generar TWAs.

```bash
npm install -g @bubblewrap/cli
```

Verificar:

```bash
bubblewrap --version
```

---

## 3. Inicializar el proyecto TWA

Desde una carpeta fuera del repo (ej: `C:\Users\Usuario\Desktop\ecomflex-twa`):

```bash
bubblewrap init --manifest https://ecomflex.vercel.app/manifest.json
```

Bubblewrap va a preguntar:

- **Domain:** `ecomflex.vercel.app`
- **Application ID:** `com.mixeliq.ecomflex`
- **Display mode:** `standalone`
- **Orientation:** `portrait`
- **Theme color:** `#10B981`
- **Background color:** `#0A0A0B`
- **Icon:** path al `icon-512.png`
- **Maskable icon:** mismo
- **Splash screen:** generado auto
- **Signing key:** crear nuevo keystore

---

## 4. Generar keystore

Bubblewrap crea el keystore durante `init`, o se puede generar manualmente:

```bash
keytool -genkey -v -keystore ecomflex-release.keystore \
  -alias ecomflex -keyalg RSA -keysize 2048 -validity 10000
```

**IMPORTANTE:** Guardar el keystore y el password en un lugar seguro (1Password, Bitwarden). Si se pierde NO se puede volver a subir updates a Play Store.

Hacer backup en:
- Google Drive personal (cifrado)
- Disco externo
- Password manager

---

## 5. Extraer el SHA-256 fingerprint

```bash
keytool -list -v -keystore ecomflex-release.keystore -alias ecomflex
```

Buscar la linea que dice `SHA256:` y copiar el valor (algo como `AB:CD:EF:...`).

---

## 6. Actualizar `assetlinks.json`

El archivo `public/.well-known/assetlinks.json` verifica que el dominio pertenece a la misma organizacion que la app. Sin esto, la TWA muestra una barra de URL arriba (feo).

Editar `public/.well-known/assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.mixeliq.ecomflex",
    "sha256_cert_fingerprints": [
      "AB:CD:EF:12:34:56:..."
    ]
  }
}]
```

Deploy a Vercel y verificar que `https://ecomflex.vercel.app/.well-known/assetlinks.json` devuelve 200.

---

## 7. Build del APK/AAB

```bash
bubblewrap build
```

Esto genera:
- `app-release-signed.apk` — para testear en un dispositivo
- `app-release-bundle.aab` — para subir a Play Store

Testear el APK instalandolo en un Android:

```bash
adb install app-release-signed.apk
```

Si ves una barra de URL arriba, el `assetlinks.json` no esta bien configurado o no se deployeo.

---

## 8. Screenshots para Play Store

Play Store requiere al menos 2 screenshots en formato portrait (1080x1920 recomendado).

Opciones para generarlos:

1. **Dispositivo real:** abrir la PWA en Chrome Android, sacar screenshots con volumen-abajo + power
2. **Emulador Android Studio:** Pixel 7 Pro, Chrome, navegar
3. **Chrome DevTools:** modo device (iPhone 12 Pro / Pixel 5), screenshot full page

Paginas a capturar:
- `/` — Home
- `/productos` — Catalogo
- `/producto/[id]` — Detalle de un producto
- `/checkout` — Checkout

Guardar como:
- `public/screenshots/home.png`
- `public/screenshots/productos.png`
- `public/screenshots/producto.png`
- `public/screenshots/checkout.png`

**Nota:** El `manifest.json` ya apunta a estos paths. Hasta que no existan, van a dar 404 (no rompe nada, solo no muestran screenshots en el prompt de instalacion).

---

## 9. Subir a Play Console

1. Entrar a [play.google.com/console](https://play.google.com/console)
2. Crear app nueva:
   - Nombre: **Ecomflex**
   - Idioma default: Espanol (Argentina)
   - Tipo: App
   - Gratis o pago: Gratis
3. Ir a **Release → Production → Create new release**
4. Subir el `app-release-bundle.aab`
5. Completar:
   - **Store listing:** descripcion corta (80 char), descripcion larga (4000 char), screenshots, icono 512x512, feature graphic 1024x500
   - **Content rating:** completar questionnaire
   - **Target audience:** 13+
   - **Privacy policy:** URL a `/privacidad`
   - **Data safety:** declarar que datos se recolectan
6. Submit for review

Review de Google tarda **1-7 dias** la primera vez.

---

## 10. Updates futuros

Cuando haya cambios en la PWA, no necesitas regenerar el APK (la TWA siempre carga la ultima version de la web). Solo necesitas un nuevo AAB cuando:

- Cambia el `manifest.json` (icono, colores, nombre)
- Cambia el `package_name`
- Queres actualizar metadata en Play Store

Para rebuild:

```bash
bubblewrap update
bubblewrap build
```

Subir el nuevo AAB a Play Console con un `versionCode` incrementado.

---

## 11. Troubleshooting

- **Barra de URL visible en la TWA:** `assetlinks.json` mal configurado o con SHA incorrecto
- **App no abre links externos:** agregar dominios en `additionalTrustedOrigins` durante `init`
- **Splash screen feo:** regenerar icon maskable 512x512 con padding de 20%
- **Rechazo de Play Store por "broken functionality":** probablemente falta privacy policy o el checkout no carga en WebView
