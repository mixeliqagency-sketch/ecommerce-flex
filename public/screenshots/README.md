# Screenshots para Google Play Store

Esta carpeta contiene los **screenshots obligatorios** que Google Play Store exige al publicar la app.

## Especificaciones técnicas

| Requisito | Valor |
|---|---|
| **Mínimo** | 2 screenshots (Google exige al menos 2) |
| **Recomendado** | 4-8 screenshots (mejor conversión en la store listing) |
| **Orientación** | Portrait (vertical) |
| **Dimensiones** | 1080 × 1920 px (16:9 vertical) — estándar Android |
| **Formato** | PNG preferido, JPG aceptable |
| **Peso máximo** | 8 MB por imagen (pero menos es mejor) |
| **Idioma** | Español (AR) — localizable en Play Console |

## Nombres de archivo esperados

Estos nombres **ya están referenciados** en `app/manifest.ts` y en el Play Console listing. No los cambies a menos que actualices ambos:

```
public/screenshots/
├── home.png          — Hero de la tienda con productos destacados
├── productos.png     — Catálogo (/productos) con filtros visibles
├── producto.png      — Ficha individual (/productos/[slug])
└── checkout.png      — Pantalla de checkout con MercadoPago
```

## Cómo capturarlos

### Opción 1 — Chrome DevTools (rápido, para template)
1. `npm run dev`
2. Chrome → DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
3. Dimensions custom: `1080 × 1920`
4. Navegá a cada página
5. DevTools menu → "Capture full size screenshot"
6. Renombrar y guardar acá

### Opción 2 — Dispositivo físico real (recomendado para final)
1. Instalá la TWA en un Android real vía Bubblewrap
2. Pixel 6+ o similar (alta resolución)
3. Screenshot nativo (`Power + Volume Down`)
4. Transferir por ADB o cable USB

### Opción 3 — Playwright / Puppeteer (automatizable)
Se puede scriptear en `scripts/screenshots.mjs` usando Playwright para regenerar los 4 screenshots en una sola corrida. Útil cuando cambiás el diseño y hay que re-subir al Play Console.

## Qué incluir en cada screenshot

| Screenshot | Elementos clave | Texto overlay opcional |
|---|---|---|
| `home.png` | Hero + Features + ReviewCarousel | "Suplementos premium. Envío 48h." |
| `productos.png` | Grid de 6-8 productos + filtros | "Calidad real con RNPA oficial" |
| `producto.png` | Detalle, badge oferta, botón agregar | "12 cuotas sin interés" |
| `checkout.png` | Acordeones de pago + MercadoPago | "Pagá como te convenga" |

## Antes de submitir a Play Console

- [ ] Los 4 screenshots están en esta carpeta
- [ ] Cada uno pesa menos de 500 KB (optimizá con `squoosh.app` o `tinypng.com` si es necesario)
- [ ] No contienen datos reales de usuarios ni credenciales
- [ ] No contienen marcas de agua ni logos de herramientas de screenshot
- [ ] Los subiste al listing de Play Console en la sección "Graphic assets"

## Referencias

- Play Console listing docs: https://support.google.com/googleplay/android-developer/answer/9866151
- Ecomflex design doc sección 7: `docs/superpowers/specs/2026-04-11-ecomflex-design.md`
