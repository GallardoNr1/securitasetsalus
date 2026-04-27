# Brand assets — SecuritasEtSalus

Esta carpeta es donde **viven los archivos del logo y otros activos de marca** mientras la documentación está siendo construida (antes de que exista la carpeta `public/` del proyecto Next.js en Fase 0).

## Archivos esperados

| Archivo | Descripción | Quién lo aporta |
|---|---|---|
| `logo-mark.png` | Versión emblema — escudo con águila y polluelos, sin texto | Founder |
| `logo-mark.svg` | Versión vectorizada del emblema | Vectorización a futuro (a partir del PNG) |
| `logo-seal.png` | Versión sello — emblema dentro de círculo con texto "SECURITAS · ET · SALUS" y laurel | Founder |
| `logo-seal.svg` | Versión vectorizada del sello | Vectorización a futuro |

## Acción requerida del founder

Los logos enviados por chat el **2026-04-28** deben copiarse manualmente a esta carpeta como:

- `logo-mark.png` — la versión más simple (escudo solo, sin texto ni círculo).
- `logo-seal.png` — la versión completa (con círculo, texto y laurel).

Una vez en la carpeta, quedan versionados en git con el resto del proyecto.

## Migración a la app en Fase 0

Cuando arranque la Fase 0 y se cree la estructura `public/`, estos archivos se moverán a:

```
public/brand/
├── logo-mark.png
├── logo-mark.svg          (vectorizado)
├── logo-seal.png
├── logo-seal.svg          (vectorizado)
└── favicon.ico            (derivado del logo-mark)
```

Y se generarán también:
- `apple-touch-icon.png` (180x180)
- OpenGraph image (1200x630) con el sello + tagline

## Vectorización pendiente

Los originales son PNG raster. Para uso web óptimo (escalado sin pérdida, peso menor en formato SVG) conviene vectorizarlos. Opciones:

- **Inkscape** (gratis) → "Trace Bitmap" para auto-vectorización.
- **Adobe Illustrator** → "Image Trace".
- **Servicio online** como vectormagic.com (~$10).
- **Encargar a diseñador** si hay presupuesto y se quiere refinamiento manual.

No es bloqueante para Fase 0 — la app puede arrancar usando los PNG y migrar a SVG cuando esté disponible.

## Dimensiones recomendadas para los PNG originales

Si los archivos enviados son < 1024px en el lado más largo, conviene re-exportarlos a:
- `logo-mark.png`: 1024×1024 px (cuadrado), fondo transparente.
- `logo-seal.png`: 1024×1024 px (cuadrado), fondo transparente.

Esto da margen para favicons, retina displays y exportaciones a otros tamaños sin pixelado.
