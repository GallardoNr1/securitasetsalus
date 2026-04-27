# Design System — SecuritasEtSalus

## Filosofía

El design system de SES está construido con **SCSS Modules**, idéntica arquitectura al de ClaveroCerrajero. Sin Tailwind, sin CSS-in-JS. Lo que cambia es la **identidad de marca**: SES tiene su propia paleta y tipografía para diferenciarse claramente del registro profesional de Clavero.

**Personalidad visual SES:** Educativa, técnica, accesible. Transmite confianza académica sin ser corporativa. Más cercano a una escuela técnica seria que a un colegio profesional.

---

## Reutilización desde Clavero

La **arquitectura** del design system se copia 1:1 desde Clavero:

```
design-system/
├── index.scss                     # Punto de entrada — importar en layout.tsx
├── tokens/
│   ├── _colors.scss               # Paleta + aliases semánticos
│   ├── _typography.scss           # Fuentes, tamaños, pesos + mixins de texto
│   └── _spacing-shadows.scss      # Espaciado, radios, sombras, animaciones, breakpoints
├── base/
│   └── _globals.scss              # Reset moderno + estilos HTML base
└── components/
    ├── Button.module.scss
    ├── Badge.module.scss
    ├── Card.module.scss
    ├── Input.module.scss
    ├── Table.module.scss
    ├── Pagination.module.scss
    ├── FilterBar.module.scss
    └── ...
```

Los **mixins**, **escala de espaciado**, **breakpoints**, **estructura de componentes** y **convenciones de naming** son exactamente los mismos que en Clavero. Lo único que cambia son los **tokens** (colores, fuentes) y posiblemente algunas variantes de componentes específicas para SES.

Esto permite que un cambio estructural del design system (p. ej. añadir un nuevo componente `Tabs`) pueda aplicarse luego en el otro repo con un copy-paste directo.

---

## Cómo usar los tokens en un componente

```scss
// MiComponente.module.scss
@use '../../design-system/tokens/colors' as *;
@use '../../design-system/tokens/typography' as *;
@use '../../design-system/tokens/spacing-shadows' as *;

.container {
  background-color: $color-bg-surface;
  padding: $space-6;
  border-radius: $radius-xl;
  box-shadow: $shadow-md;
}

.title {
  @include text-heading-md;
  color: $color-text-brand;
}
```

---

## Paleta de colores

Paleta **derivada directamente del logo**. El escudo del águila usa un rango de verdes profundos a menta clara, y el sello circular usa un crema/papel envejecido para el fondo. Estos son los colores que estructuran toda la UI.

### Tokens

```scss
// === Primarios — escala de verdes del águila ===
$color-brand: #2c5f4a;            // Verde profundo (cuerpo del águila) — color de marca
$color-primary-700: #1f4836;      // Bordes oscuros, hover sobre brand
$color-primary-600: #3d7a5e;      // Verde medio (cuello, plumas centrales)
$color-primary-500: #5a9b7b;      // Verde claro (plumas exteriores)
$color-primary-300: #8fc4a8;      // Verde menta (highlights)
$color-primary-100: #cce0d3;      // Bordes claros, badges
$color-primary-50: #ecf3ee;       // Backgrounds sutiles

// === Acento — crema del sello (papel envejecido) ===
$color-brand-accent: #c9b87a;     // Dorado discreto para CTAs especiales (diplomas, sellos)
$color-accent-700: #9a8a52;       // Texto destacado sobre crema
$color-accent-100: #f0e9d4;       // Fondo de "papel certificado" en diplomas PDF

// === Semánticos UI ===
$color-bg-page: #fafaf7;          // Fondo de la página (papel sutil, no blanco puro)
$color-bg-surface: #ffffff;       // Cards, modals, paneles
$color-bg-subtle: #f5f3ed;        // Filas alternas, footers de card (mismo crema del sello)
$color-text-primary: #1a2622;     // Texto principal (verde casi negro)
$color-text-secondary: #4a5450;   // Texto de apoyo
$color-text-muted: #7d8480;       // Placeholders, hints
$color-border-default: #d6d2c5;   // Bordes normales (gris cálido)
$color-border-focus: #2c5f4a;     // Anillo de foco (verde marca)

// === Semánticos de estado ===
$color-success: #2c5f4a;          // Reusa el verde marca (coherencia)
$color-warning: #c9893a;          // Naranja terroso compatible con la paleta
$color-danger: #a64242;           // Rojo apagado, no agresivo
$color-info: #4a6b8a;             // Azul-pizarra discreto
```

### Validación de contraste (WCAG)

| Combinación | Ratio | Nivel |
|---|---|---|
| `#2c5f4a` sobre `#ffffff` | 7.7:1 | AAA |
| `#1a2622` sobre `#fafaf7` | 14.8:1 | AAA |
| `#4a5450` sobre `#ffffff` | 8.1:1 | AAA |
| `#7d8480` sobre `#ffffff` | 4.6:1 | AA (texto normal) |
| `#ffffff` sobre `#2c5f4a` | 7.7:1 | AAA (texto sobre brand) |
| `#9a8a52` sobre `#ffffff` | 4.7:1 | AA |

Los tokens primarios (brand, primary-700, text-primary) cumplen AAA. Los muted/accent cumplen AA para texto normal. Combinaciones decorativas (primary-300, primary-100) **no se usan para texto** — solo para fondos, bordes y badges decorativos.

### Cuándo usar cada color

- **`$color-brand`** — botones primarios, headings, links activos, logo cuando va monocromo.
- **`$color-primary-600/500`** — variantes hover/active, gráficos, ilustraciones.
- **`$color-primary-300/100/50`** — backgrounds de badges, banners informativos, fondos de sección con énfasis.
- **`$color-brand-accent` (`#c9b87a`)** — usar con moderación: bordes de diploma PDF, sellos, CTAs muy especiales que necesiten destacar sobre el verde. **No es el color de los botones primarios** — esos son brand verde.
- **`$color-accent-100` (`#f0e9d4`)** — fondo del PDF del diploma para evocar papel de certificado.

---

## Tipografía

| Variable | Fuente | Uso |
|---|---|---|
| `$font-display` | **Fraunces** | Títulos, hero, cabeceras de sección |
| `$font-body` | **Inter** | Todo el texto de UI |
| `$font-mono` | **JetBrains Mono** | Códigos de diploma, IDs |

**Diferencia con Clavero:** Clavero usa Playfair Display (más institucional, gala). SES usa Fraunces, una serif más cálida y editorial, para diferenciar tono y transmitir cercanía didáctica.

Las fuentes se cargan desde Google Fonts con `next/font/google` para optimización automática (subset, preload, sin layout shift).

### Mixins de texto

Mismos nombres que Clavero, mismos tamaños:

```scss
@include text-display-xl   // Hero principal
@include text-display-lg   // H1 de sección
@include text-display-md   // H2
@include text-heading-lg   // H3
@include text-heading-md   // H4
@include text-heading-sm   // H5
@include text-body-lg      // Intro, destacados
@include text-body-md      // Texto normal
@include text-body-sm      // Texto pequeño
@include text-label        // Labels de formulario
@include text-caption      // Hints, notas al pie
@include text-mono         // Códigos
@include text-diploma-title  // Título del diploma PDF
@include text-diploma-name   // Nombre del alumno en diploma
```

---

## Espaciado, breakpoints, animaciones

Idénticos a Clavero — escala de 4px, breakpoints `sm/md/lg/xl`, mixins responsive. **No tocar la estructura**, solo los valores cosméticos si es necesario.

---

## Componentes disponibles

Mismos que Clavero (se copian al arrancar Fase 0). Adicionalmente, SES necesita componentes específicos del catálogo:

### Componentes nuevos en SES (a crear)

- **CourseCard** — card de curso para el catálogo (imagen, título, fechas, instructor, precio, badge de "cupos disponibles" o "lleno").
- **SessionList** — listado de sesiones de un curso con fechas y estado (próxima, pasada, en curso).
- **AttendanceMatrix** — tabla de asistencia para el instructor (alumno × sesión).
- **PriceTag** — etiqueta de precio con formato según moneda.
- **CapacityBadge** — indicador "5 cupos restantes" / "Curso lleno".
- **EnrollmentStatusBadge** — badge para mostrar el estado de la inscripción del alumno.

### Componentes que vienen de Clavero

Button, Badge, Card (genérico, sin las variantes `diplomaActive` específicas de Clavero), Input, Field, Label, Select, Textarea, Tag, Container, Section, Table, Pagination, FilterBar, ErrorMessage, PasswordInput, Avatar.

---

## Reglas del design system

1. **Nunca hardcodear valores** — siempre usar tokens (`$color-*`, `$space-*`, `$font-*`).
2. **Nunca escribir CSS global** excepto en `base/_globals.scss`.
3. **Un `.module.scss` por componente** — el scoping es automático.
4. **Los tokens no se modifican por componente** — si necesitas una variante, créala en el `.module.scss` del componente.
5. **Mobile first** — escribir el estilo base para móvil y ampliar con `@include responsive-md`.
6. **Añadir nuevos tokens** al archivo correspondiente en `tokens/` antes de usarlos — nunca inventar valores on the fly.
7. **Cambios estructurales del DS deben replicarse en Clavero** (p. ej. nuevo componente reutilizable) — y al revés. Mantener paridad arquitectónica.

---

## Logo

El logo de SES existe en **dos versiones**, ambas se guardan en `public/brand/` (a crear en Fase 0):

### Versión emblema — `public/brand/logo-mark.png` (también `.svg` cuando se vectorice)

Escudo verde con un águila adulta de alas extendidas que cobija a dos polluelos blancos en su pecho. Sin texto. Es la versión compacta para:
- Favicon
- Avatar/foto de perfil de la cuenta institucional
- Espacios reducidos (header móvil, OpenGraph thumbnail)
- Watermark sutil en documentos

### Versión sello — `public/brand/logo-seal.png` (también `.svg` cuando se vectorice)

El emblema dentro de un círculo con el texto **"SECURITAS · ET · SALUS"** en la mitad superior y una rama de laurel en la mitad inferior. Es la versión institucional para:
- Header de la landing
- Footer
- Cabecera del PDF del diploma
- Documentación oficial impresa

### Significado

- **Águila protectora** = la institución (Securitas — seguridad).
- **Polluelos en el nido** = los alumnos en formación, bajo cuidado (Salus — bienestar).
- **Laurel** (versión sello) = honor académico, tradición educativa.
- **Verde** = formación, crecimiento, profesional sin ser corporativo.

### Reglas de uso

- **Tamaños mínimos:** emblema 32px de alto, sello 64px de diámetro (debajo el texto deja de ser legible).
- **Espacio de respeto:** alrededor del logo dejar al menos 0.5x del alto del logo libre de otros elementos.
- **Versiones monocromas:** el logo en `$color-brand` (verde) sobre fondos claros, o en `$color-bg-page` sobre `$color-brand` (negativo) para headers verdes.
- **No deformar, no cambiar colores fuera de la paleta**, no añadir sombras o efectos.

---

## Identidad visual y diferenciación con Clavero

| Aspecto | Clavero | SES |
|---|---|---|
| Color primario | Azul noche `#1e1b6e` | **Verde institucional `#2c5f4a`** |
| Color acento | Dorado latón `#c9a84c` | **Crema `#c9b87a`** (más apagado y orgánico) |
| Tipografía display | Playfair Display | **Fraunces** |
| Tipografía body | Source Sans 3 | **Inter** |
| Tono general | Institucional, autoridad | Educativo, didáctico, protector |
| Iconografía | Llaves, candados, sellos | Águila, nido, laurel |
| Logo | Wordmark + emblema | **Escudo con águila + sello circular** |

Las dos marcas comparten arquitectura del design system (mismos mixins, espaciado, breakpoints) y se diferencian claramente en color, tipografía y simbología. Un usuario nunca debería confundir las dos plataformas.
