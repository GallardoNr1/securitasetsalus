# Fase 1 — Landing page y catálogo público

**Cierre:** 2026-04-28.
**Estado:** ✅ completada.

## Qué se construyó

### Layout público compartido (`app/(public)/layout.tsx`)

Grupo de rutas `(public)` con `SiteHeader` y `SiteFooter` aplicados a todas las páginas públicas de la app. Cuando lleguen las áreas autenticadas en Fase 2 (dashboard, admin, instructor) tendrán su propio layout sin estos elementos.

### Componentes nuevos

- **`components/features/SiteHeader.tsx`** — header sticky con logo, navegación primaria (Cursos, Cómo funciona, Contacto) y CTAs (Iniciar sesión, Ver cursos). Backdrop-filter + transparencia para integrarse con el contenido al hacer scroll.
- **`components/features/SiteFooter.tsx`** — footer institucional con 4 columnas (marca, Sitio, Legal, Contacto). Fondo verde profundo `$color-primary-900` para anclar visualmente el final de la página.
- **`components/features/CourseCard.tsx`** — card del catálogo con título, descripción corta, categoría, badge SENCE si aplica, metadata (duración, sede, fecha de inicio), precio y indicador de cupos restantes (con coloreado especial si quedan ≤3 o el curso está lleno).
- **`components/features/ComingSoon.tsx`** — componente reutilizable para placeholder de páginas que llegan en fases posteriores (login, register).
- **`components/ui/Card.tsx`**, **`Badge.tsx`**, **`Tag.tsx`** — wrappers React de los componentes SCSS, copiados desde Clavero y adaptados:
  - `Badge` cambia los estados (sin `expiring`/`expired` que no aplican a SES; añade `confirmed`/`pending`/`cancelled`/`failed` para inscripciones).
  - `Tag` usa tone `accent` en lugar de `gold`.
  - `Card` reemplaza la variante `diplomaExpiring` por `featured`.

### Datos mock (`lib/mock/courses.ts`)

Catálogo de **4 cursos de ejemplo** con shape compatible con `Course + CourseSession + User (instructor)` para que la migración a Prisma en Fase 3 sea solo un cambio de fuente. Cubre:

1. Cerrajería Residencial Básico (24h, CLP 180.000, RM, sí SENCE)
2. Cerrajería Automotriz Intermedio (32h, CLP 280.000, RM, sí SENCE)
3. Control de Accesos Edificios (20h, CLP 220.000, V, no SENCE)
4. Sistemas de Amaestramiento (40h, CLP 380.000, RM, sí SENCE)

Helpers `getCourseBySlug`, `getPublishedCourses({ category, subdivision })`.

### Páginas

- **`app/(public)/page.tsx`** — landing con 5 secciones:
  1. **Hero** — título de gran impacto con `<em>` en italic verde (Fraunces brilla aquí), copy de propuesta, CTAs primario y outline, sello como visual lateral.
  2. **Cómo funciona** — 3 pasos numerados (Elige curso / Asiste y aprueba / Recibe diploma).
  3. **Cursos destacados** — fondo crema `$color-bg-subtle`, grid de 3 cursos.
  4. **Por qué SES** — 4 features con borde verde a la izquierda.
  5. **CTA final** — banda verde marca con botón crema.

- **`app/(public)/cursos/page.tsx`** — catálogo público con filtros tipo "pill" por categoría (Todas / Cerrajería / Control de accesos / Seguridad física / Automotriz). Estado vacío amistoso si no hay cursos en una categoría. Soporta `?categoria=...` por URL para que sea bookmarkable.

- **`app/(public)/cursos/[slug]/page.tsx`** — detalle de curso a doble columna: temario completo (whitespace-pre con markdown crudo, en Fase 2/3 lo procesaremos con react-markdown), calendario de sesiones, bio del instructor, sidebar sticky con precio, metadata y CTA "Inscribirme y pagar". `generateStaticParams` para pre-renderizar las 4 páginas.

- **`app/(public)/verify/page.tsx`** — formulario de búsqueda por código con explicación pública de qué es un diploma SES + enlace a Clavero para certificación profesional integral.

- **`app/(public)/verify/[code]/page.tsx`** — placeholder explicando que la verificación llega en Fase 6, con código consultado mostrado en mono. `robots: { index: false }` para no indexar verificaciones individuales.

- **`app/(public)/login/page.tsx`** y **`/register/page.tsx`** — placeholders con `ComingSoon` apuntando a Fase 2.

- **`app/(public)/legal/terms/page.tsx`** y **`/legal/privacy/page.tsx`** — texto preliminar pendiente de revisión legal con la SpA en constitución. Cubre los puntos básicos: cancelaciones (con la tabla escalonada confirmada), revocación de diplomas, datos compartidos, derechos del titular.

### SEO

- **`app/sitemap.ts`** — genera `/sitemap.xml` con rutas estáticas + 4 URLs de cursos basadas en `MOCK_COURSES`.
- **`app/robots.ts`** — `/robots.txt` con disallow a `/dashboard`, `/admin`, `/instructor`, `/api/`, `/verify/[code]` (los códigos individuales se excluyen para no indexarlos en buscadores).
- **`app/icon.tsx`** — favicon dinámico generado con `ImageResponse` (monograma "S" sobre verde marca). Cuando haya un SVG vectorizado del logo, sustituir por `app/icon.svg`.
- Metadata por página con `title` y `description` específicos.

### Helpers

- **`lib/format.ts`** — `formatPrice` con soporte zero-decimal currencies (CLP/JPY/etc.) más casos generales con división por 100. `formatDate` (long/short), `formatTime`, `formatDateRange` (compacto si es mismo día, expandido si abarca varios).

## Verificación

```
$ npm run typecheck
✓ tsc --noEmit (sin errores)

$ npm run lint
✓ eslint . (sin errores)

$ npm test
✓ 38/38 tests pasados (regions, password, tokens — heredados de Fase 0)

$ npm run build
✓ Compiled successfully
✓ Generated static pages (16/16)
✓ Routes:
  - / (static)
  - /cursos (static)
  - /cursos/[slug] × 4 (SSG con generateStaticParams)
  - /verify (static)
  - /verify/[code] (dynamic)
  - /login, /register, /legal/terms, /legal/privacy (static)
  - /icon, /sitemap.xml, /robots.txt
```

## Decisiones tomadas

- **Datos mock en lugar de seed Prisma**. Razón: Fase 1 es 100% UI, no hay todavía ni `DATABASE_URL` configurada. Mantener todo en memoria evita acoplar el progreso de UI a tener Supabase listo. En Fase 3 (CRUD admin) `getPublishedCourses` se reemplaza por `db.course.findMany({ where: { status: 'PUBLISHED' } })` sin tocar componentes.

- **Filtros por categoría en URL** (`?categoria=cerrajeria`). Permite linkear, indexar y compartir filtros. En Fase 3, cuando lleguen filtros adicionales (subdivisión, fecha), se añaden como nuevos params sin romper el patrón.

- **Detalle de curso a doble columna con sidebar sticky**. La columna principal se lee como contenido editorial (temario, sesiones, instructor); el sidebar persigue al usuario con el CTA de pago. Pattern probado y de baja fricción.

- **Páginas legales con texto stub real, no placeholders**. Razón: las páginas legales son obligatorias para la pasarela de pagos y para SENCE. Mejor tenerlas con contenido razonable desde Fase 1 que dejarlo como deuda. La revisión legal definitiva cuando esté la SpA es marginal sobre este texto.

- **Botón "Inscribirme y pagar" → /login** (no a checkout directo). Razón: la inscripción requiere cuenta verificada (decisión OTEC SENCE), así que ningún usuario debería llegar al checkout sin pasar por login/register. En Fase 4 se añadirá el flujo completo (login → catálogo → checkout) con `?return=/cursos/[slug]`.

- **`/verify/[code]` placeholder explícito en lugar de error 404**. Razón: cuando lleguen los QR de la Fase 5, los códigos van a apuntar a esta URL. Mejor tener una página que diga "verificación en desarrollo" con CTA de email manual que un 404 que rompa la confianza del usuario que escanea el QR.

- **Favicon dinámico via `ImageResponse` en lugar de SVG**. Es una solución temporal — produce un PNG generado en build con el monograma. Cuando vectoricemos el logo, `app/icon.svg` toma prioridad automáticamente y este `icon.tsx` queda inerte.

## Lo que NO está en Fase 1 (intencional)

- **Buscador full-text en `/cursos`** — los filtros pill bastan con catálogo pequeño. Se añade cuando haya >20 cursos.
- **Filtros adicionales** (subdivisión, fecha, precio, sólo SENCE) — el flag `senceEligible` se ve en la card pero no es filtro todavía. Se añaden cuando haya feedback de usuarios reales.
- **Vista de calendario / mapa** — apuntado en `roadmap-future.md` para iteraciones posteriores.
- **Imágenes de portada por curso** — los cursos no tienen `imageUrl` en el schema. Se añaden cuando el contenido lo justifique. Por ahora la card muestra solo texto.
- **Testimonios de alumnos** — se añaden cuando haya alumnos reales con feedback.
- **Reviews / valoraciones** — fuera de scope MVP.
- **Estadísticas de la escuela** ("X alumnos certificados", "Y instructores", etc.) — sin datos reales que mostrar todavía.
- **Header móvil con menú hamburguesa** — el header actual oculta la nav en móvil pero los CTAs principales siguen accesibles. Se mejora cuando haya feedback real de tráfico móvil.

## Deuda técnica

- El temario completo se renderiza con `<pre>` y `white-space: pre-wrap` — preserva los saltos de línea pero no procesa Markdown. Cuando lleguen los cursos reales con temarios largos, integrar `react-markdown` con un sanitizer como `rehype-sanitize`. No bloqueante.
- `app/icon.tsx` usa `ImageResponse` que no soporta perfectamente `next/font` — el monograma renderiza en serif del sistema. Funciona pero no usa Fraunces. Se resuelve con SVG vectorizado del logo. No bloqueante.
- Los datos mock viven en `lib/mock/courses.ts` y referencian fechas relativas a `today = '2026-04-28'`. Esto significa que el catálogo se "envejece" si nadie regenera los mocks. No bloqueante mientras Fase 1 sea pre-MVP, pero en cuanto haya BD real este archivo se elimina.
- No hay tests E2E todavía (Playwright instalado pero sin specs). Se introducen al cerrar Fase 2 cuando haya rutas autenticadas que probar.

## Cómo probarlo localmente

```bash
npm run dev
# → http://localhost:3000          (landing)
# → http://localhost:3000/cursos   (catálogo)
# → http://localhost:3000/cursos/cerrajeria-residencial-basico
# → http://localhost:3000/verify
# → http://localhost:3000/verify/ABC123
# → http://localhost:3000/legal/terms
# → http://localhost:3000/legal/privacy
# → http://localhost:3000/sitemap.xml
# → http://localhost:3000/robots.txt
```

Lighthouse local sobre `/`: pendiente medirlo con dev server arrancado en una sesión futura.
