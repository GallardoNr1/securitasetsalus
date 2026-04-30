# Brief de rediseño — SecuritasEtSalus

> Pega este archivo entero en claude.ai junto con screenshots de las páginas que quieras rediseñar. Está pensado para ser autocontenido — claude.ai no necesita acceso al repo.

---

## 1. Qué es SecuritasEtSalus (SES)

**Producto:** Escuela presencial de cerrajería profesional en Chile, con reconocimiento OTEC SENCE (formación oficial elegible para franquicia tributaria).

**Cliente final:** cerrajeros y aspirantes a cerrajeros, mayoritariamente hombres 25-50 años, con formación técnica previa o gente reorientándose. Hablan español de Chile.

**Modelo de negocio:** cursos pagados (CLP), 1-3 días presenciales, con material incluido. Al cerrar el curso el alumno recibe un **diploma verificable por QR** (cada diploma tiene un código corto único `SES-XXXX-XXXX`).

**Diferencial:** rigor académico, instructores con experiencia real en el oficio, integración con un organismo certificador hermano (Clavero) que emite certificados profesionales sobre la base de los diplomas SES.

**Tono visual buscado:**
- **Institucional, formal, técnico.** No es una startup chillona. Más cerca de un colegio profesional o una escuela técnica oficial.
- **Cálido y artesanal.** El oficio del cerrajero tiene historia. El diseño debería evocar **papel envejecido, sello oficial, latón**, sin ser anticuado ni recargado.
- **Confianza y autoridad.** El cliente final es un profesional que invierte en su carrera, no un consumidor impulsivo.

**Tono visual a evitar:**
- Glassmorphism / neumorphism / efectos chillones.
- Gradientes pastel.
- Iconos genéricos tipo "startup en SaaS".
- Fotografía de stock.
- Cualquier cosa que parezca un curso online masivo (Udemy / Coursera).

---

## 2. Identidad visual existente (NO TOCAR)

### Paleta de color

La paleta deriva de un logo de águila verde sobre fondo crema (papel envejecido + sello). Los nombres de variable usan SCSS modules.

**Verdes (cuerpo del águila — color principal de la marca):**
```
$color-primary-50:  #ecf3ee
$color-primary-100: #cce0d3
$color-primary-200: #aed1bc
$color-primary-300: #8fc4a8   // verde menta (highlights)
$color-primary-400: #74af90
$color-primary-500: #5a9b7b   // verde claro
$color-primary-600: #3d7a5e   // verde medio
$color-primary-700: #2c5f4a   // ★ verde profundo — color principal
$color-primary-800: #1f4836   // bordes, sombras
$color-primary-900: #143828
$color-primary-950: #0b2218
```

**Crema (sello / papel envejecido):**
```
$color-accent-50:  #faf6e9
$color-accent-100: #f0e9d4   // fondo del sello
$color-accent-200: #e5d9b3
$color-accent-300: #d8c897
$color-accent-400: #c9b87a   // ★ crema principal (CTAs especiales)
$color-accent-500: #b3a067
$color-accent-600: #9a8a52
$color-accent-700: #7c6f3f
$color-accent-800: #5b522d
$color-accent-900: #3a341c
```

**Neutros (papel cálido + tinta verde casi negra):**
```
$color-neutral-0:   #ffffff
$color-neutral-50:  #fafaf7   // ★ fondo de página (papel sutil)
$color-neutral-100: #f5f3ed   // ★ superficies elevadas
$color-neutral-200: #e8e5dc
$color-neutral-300: #d6d2c5   // bordes
$color-neutral-400: #b3afa0
$color-neutral-500: #7d8480   // texto muted
$color-neutral-600: #4a5450   // texto secundario
$color-neutral-700: #2f3833
$color-neutral-800: #1f2622
$color-neutral-900: #1a2622   // ★ texto principal (verde casi negro)
```

**Semánticos:**
```
success: #2c5f4a (reusa el verde marca)
warning: #c9893a (ámbar quemado)
danger:  #a64242 (rojo terroso, no rojo Bootstrap)
info:    #4a6b8a (azul ahumado)
```

**Aliases que ya usa el código:**
```
$color-bg-page          → #fafaf7   fondo cálido
$color-bg-surface       → #ffffff   tarjetas, modales
$color-bg-subtle        → #f5f3ed   fondo de bloques sutiles
$color-text-primary     → #1a2622   texto cuerpo
$color-text-secondary   → #4a5450   texto secundario
$color-text-muted       → #7d8480   texto auxiliar
$color-text-brand       → #2c5f4a   links / acentos brand
$color-border-default   → #d6d2c5   bordes normales
$color-brand            → #2c5f4a   color principal
```

### Tipografía

Tres familias cargadas vía `next/font`:

| Rol | Familia | Para qué |
|---|---|---|
| Display | **Fraunces** (serif cálida, didáctica) | Títulos H1/H2, nombre en diplomas, hero |
| Body | **Inter** (sans-serif legible) | Texto general, formularios, tablas, navegación |
| Mono | **JetBrains Mono** | Códigos de diploma (`SES-A4F2-9P3X`), IDs |

**Escala (rem, base 16px):**
```
xs   = 0.75rem   (12px)
sm   = 0.875rem  (14px)
md   = 1rem      (16px) — base
lg   = 1.125rem  (18px)
xl   = 1.25rem   (20px)
2xl  = 1.5rem    (24px)
3xl  = 1.875rem  (30px)
4xl  = 2.25rem   (36px)
5xl  = 3rem      (48px)
6xl  = 3.75rem   (60px)
```

**Estilos pre-mezclados que usa el código (mixins):**
- `text-display-xl/lg/md` — Fraunces, bold, tracking apretado, line-height 1.2-1.375. Para titulares grandes.
- `text-heading-lg/md/sm` — Inter, semibold/bold. Para subtítulos.
- `text-body-lg/md/sm` — Inter regular. Texto cuerpo.
- `text-label` — Inter medium, tracking ligeramente abierto. Labels de form.
- `text-caption` — Inter regular, tamaño xs, tracking abierto. Pies de foto.
- `text-mono` — JetBrains Mono. Códigos.
- `text-diploma-title` — Fraunces 36px bold (PDF).
- `text-diploma-name` — Fraunces 48px black italic (PDF).

### Espaciado

Escala 4px:
```
1=4px, 2=8px, 3=12px, 4=16px, 5=20px, 6=24px,
8=32px, 10=40px, 12=48px, 16=64px, 20=80px, 24=96px
```

Ancho máximo de contenido: **1280px** (`$space-page-max`).

### Radios / Sombras / Animación

```
radius-sm:  2px
radius-md:  6px   ← el más usado
radius-lg:  8px
radius-xl:  12px
radius-2xl: 16px
radius-full: 9999px

shadows: cálidas (tinta sepia rgba(26,20,13,...)) en lugar de negro puro
duration-fast:   150ms
duration-normal: 250ms
ease-default:    cubic-bezier(0.4, 0, 0.2, 1)

shadow-diploma:  efecto pergamino con borde crema
```

### Breakpoints (mobile first)

```
sm:  480px
md:  768px   ← tablet
lg:  1024px  ← desktop chico
xl:  1280px  ← desktop estándar
2xl: 1536px  ← pantallas grandes
```

---

## 3. Componentes existentes (referencia, NO los rediseñes desde cero)

Estos componentes ya están construidos en `components/ui/` y se reutilizan. El rediseño debe **componerlos**, no recrearlos:

| Componente | API resumida |
|---|---|
| **Button** | `variant="primary\|accent\|secondary\|ghost\|danger\|outline"`, `size="sm\|md\|lg\|xl"`, `loading`, `fullWidth`, `iconOnly`. Acepta `href` y se vuelve link. |
| **Tag** | `tone="neutral\|brand\|accent"`. Píldora pequeña inline. |
| **Badge** | `status="active\|revoked\|confirmed\|pending\|cancelled\|failed"`, `tone="primary\|accent"`, `showDot`. Estado fuerte. |
| **Card** | Tarjeta básica con borde + sombra. |
| **Input** | `Field`, `Label`, `Input`, `Select`, `Textarea`, `ErrorMessage`. |
| **PasswordInput** | Toggle "mostrar contraseña". |
| **Avatar** | Foto desde R2 o iniciales. `size="xs\|sm\|md\|lg\|xl"`. |
| **Table** | `Table.Head/Body/Row/Cell/HeaderCell`. |
| **Pagination** | Numeric con prev/next. |
| **FilterBar** | Filtros tipo chip horizontales. |
| **Breadcrumbs** | `items={[{label, href?}]}`. |

---

## 4. Páginas que sí merece la pena modernizar

Estas son las **públicas y de venta** — donde gana modernizar el aspecto:

### 4.1 Landing pública (`/`)

Estructura actual (en orden):
1. **Hero**
   - Eyebrow: "Escuela de cerrajería profesional"
   - H1: "Formación rigurosa para los *profesionales* de la cerrajería en Chile"
   - Lead: "Cursos presenciales con instructores con experiencia real en el oficio. Diplomas verificables por QR y reconocimiento profesional avalado por OTEC SENCE."
   - Dos CTAs: "Ver catálogo" (primary) + "Verificar diploma" (secondary)
2. **Por qué SES** — 3 cards con beneficios (instructores, diplomas verificables, OTEC SENCE)
3. **Cursos destacados** — 3 CourseCard del catálogo con precio, duración, sede
4. **Cómo funciona** — 4 pasos (matricularse → asistir → evaluación → diploma con QR)
5. **CTA final** — banner con "Empieza tu formación"
6. **Footer**

### 4.2 Catálogo público (`/courses`)

- Listado paginado de cursos PUBLISHED.
- Cada card: título, sede, fecha de la primera sesión, duración, precio, badge SENCE si aplica.
- Filtros (region, fecha) — actualmente ausente, sería buena adición.

### 4.3 Detalle de curso (`/courses/[slug]`)

Estructura actual:
- H1 con título del curso
- Bloques: descripción corta, temario completo (Markdown), instructor con avatar + bio, kit incluido, sesiones (fechas), sede + dirección, precio, CTA inscribirse (todavía deshabilitado — depende de Stripe).

### 4.4 Verificación pública de diploma (`/verify/[code]`)

**Esta es crítica** — es la cara externa cuando un empleador, autoridad o cliente verifica un diploma. Estructura:
- Code consultado en grande (mono).
- Estado: VIGENTE / REVOCADO / NO ENCONTRADO / FORMATO INVÁLIDO.
- Si VIGENTE: tarjeta con nombre del alumno, curso, duración, fecha de emisión, sede, región, skill Clavero asociado.
- Nota explicativa sobre la diferencia entre "diploma SES" (formación) y "certificado profesional" (idoneidad — emitido por Clavero).

### 4.5 Formulario de búsqueda de verificación (`/verify`)

Solo un input para introducir el código. Muy minimalista.

---

## 5. Páginas que NO debes rediseñar

Las pantallas internas (admin / instructor / dashboard del alumno / formularios de creación / asistencia / evaluación). Son **herramientas de productividad** y la pauta visual actual ya funciona. Modernizarlas no aporta ROI y rompería la coherencia.

---

## 6. Lo que se puede tocar y lo que no

### ✅ Sí puede cambiar
- Layout, jerarquía visual, ritmo vertical.
- Tamaños tipográficos relativos (qué se ve grande, qué se ve pequeño).
- Composición de los CTAs (botones más prominentes, menos prominentes…).
- Efectos sutiles de hover, transiciones.
- Backgrounds (con texturas papel, patrones geométricos sutiles, motivos de cerrajería bien usados).
- Iconografía (preferiblemente line-icons monocromos en `$color-text-brand`, evita emoji y stock pictograms).
- Variantes nuevas de los componentes existentes si justifica.

### ❌ No debe cambiar
- Paleta de colores (los hex de arriba son sagrados).
- Familias tipográficas (Fraunces / Inter / JetBrains Mono).
- Stack técnico (es Next.js + SCSS Modules — no Tailwind, no styled-components).
- Estructura de archivos del design system.
- Identidad institucional (no convertirlo en un look "consumer SaaS").

---

## 7. Lo que tiene que entregar la propuesta

Por cada página rediseñada que apruebe el founder, claude.ai debería devolver:

1. **Mockup HTML/CSS o React** — visual interactivo en artifact.
2. **Notas de diseño** — qué decisiones se tomaron y por qué (ej: "el Hero usa Fraunces 60px porque el institucional pide presencia tipográfica").
3. **Lista de componentes nuevos** que el rediseño introduzca, si los hay (ej: "TestimonialCard", "StepIndicator").
4. **Lista de cambios al design system** si propone alguno (ej: "añadir `shadow-hero` para el background del hero"). El founder evalúa caso por caso.

---

## 8. Restricciones técnicas que conviene saber

- **El sitio carga rápido y tiene buen SEO.** Cualquier propuesta que requiera carga pesada de assets (videos hero autoplay, librerías de animación gigantes) tiene que justificar el coste.
- **Los textos están en español de Chile.** Cuidado con expresiones que no se usan ahí ("aluno" en lugar de "alumno", etc.).
- **Móvil first.** Una proporción importante del tráfico será móvil, especialmente la verificación pública (gente escaneando un QR).
- **Accesibilidad razonable.** Contraste AA mínimo, focos visibles, jerarquía semántica correcta. No es WCAG AAA, pero no debe romper screen readers básicos.

---

## 9. Brief de prompt sugerido para claude.ai

Pega esto debajo del brief al iniciar la conversación:

> "Aquí tienes el design system y el brief de SecuritasEtSalus, una escuela de cerrajería profesional chilena. Quiero modernizar la **landing pública** (`/`) y la **página de verificación de diploma** (`/verify/[code]` cuando es VIGENTE).
>
> Mantén estrictamente la paleta y tipografías. Propón una versión moderna de cada una con HTML/CSS funcional en un artifact. Antes de generar nada, dime qué te llama la atención de la identidad y qué dirección visual te imaginas, y te doy luz verde antes de que empieces a maquetar."

---

## 10. Material adicional opcional

Si claude.ai pide más contexto, puedes pegarle también:
- Screenshots de las páginas actuales (cualquier herramienta de captura).
- El SCSS de un componente puntual (`design-system/components/Button.module.scss` por ejemplo).
- El curso de demo (`Aperturas Básicas`) como ejemplo concreto del tipo de producto.

---

**Generado por:** SecuritasEtSalus repo (`docs/design-brief-for-claude.md`).
**Fecha:** 2026-04-30.
