# Rediseño visual v3 — sweep completo

**Cierre:** 2026-04-30.
**Estado:** ✅ aplicado a todas las superficies públicas y autenticadas.

> Esta no es una "fase" funcional — el producto ya estaba terminado en
> Fase 13. Es un sweep de identidad visual sobre el handoff de claude.ai
> que tocó casi todas las pantallas. Se documenta aquí para que cuando
> alguien lea `phases.md` no se pregunte qué pasó entre el deploy de
> Fase 13 y los commits del 30 de abril.

## Sistema visual

- **Tipografía:** Fraunces (display) + Inter (body) + JetBrains Mono
  (códigos). Identidades en `design-system/tokens/_typography.scss`.
- **Paleta:** verde marca `$p-700 #2c5f4a`, crema acento `$a-300`,
  neutrals desaturados con tono verdoso.
- **Lenguaje:** títulos grandes con segunda línea en *italic* del color
  marca; pills de estado con dot + halo difuminado; "sello" del logo
  como marca de agua semi-transparente, frecuentemente rotado.

## Pantallas tocadas

### Públicas

- **Landing** (`app/(public)/page.tsx`) — Hero v3 asimétrico (sello +
  cards flotantes), stepper con círculos conectados por línea sólida en
  gradiente, **bento grid "Una escuela seria"** (5 cards: instructor en
  oficio + QR firmado + Franquicia SENCE + Cohortes de diez + Mapeo
  Clavero), **CTA card de cohorte** con sello de fondo y dos botones.
- **Catálogo** (`/courses`) y detalle (`/courses/[slug]`).
- **Verify** (`/verify` + `/verify/[code]`) — pasaporte con 4 estados.
- **Legal** (`/legal/terms`, `/legal/privacy`).
- **Contact** (`/contact`) — *nueva*. Hero con sello rotado + form +
  side panel con correo, WhatsApp, card oscura para empresas/SENCE y
  listado de sedes. Form simulado por ahora (Resend pendiente de
  dominio verificado).

### Auth

- **Split layout `AuthShell`** para `/login`, `/register`,
  `/forgot-password`. Form a la izquierda con título grande tipo
  "Iniciar / sesión." y panel de marca a la derecha con el sello como
  decoración + copy institucional. Variantes de gradiente por side
  (login = verde profundo, signup = verde más oscuro, recover = crema).
- En mobile (<lg) el panel derecho se oculta y el form ocupa todo el
  ancho.

### Autenticadas (alumno)

- **Dashboard** (`/dashboard`).
- **Mis cursos** (`/my-courses`).
- **Mis diplomas** (`/my-diplomas`) — cards estilo pasaporte compacto.
- **Profile** (`/profile`) — *rediseñado con sidebar al estilo handoff*.
  Sidebar sticky 240px en desktop con anchors a 5 secciones: Datos
  personales (`#datos`), Cuenta y seguridad (`#seguridad`),
  Notificaciones (`#notificaciones`), Métodos de pago (`#pagos`),
  Eliminar cuenta (`#peligro`). Las tres últimas son placeholders con
  tag "Próximamente"; la de eliminar lleva tono danger en el sidebar.
  Active state vía `hashchange`.

### Headers

- **`FloatingHeader`** (solo landing, glass sobre el hero).
- **`SiteHeader`** (resto de páginas públicas, sólido sticky).
- **`AppHeader`** + **`AppNav`** (zona autenticada).
- **`PublicNav`** — *nueva*. Pill central compartida con 3 links
  reales: Inicio (`/`), Cursos (`/courses`), Contacto (`/contact`).
  Sin anclas a la landing — solo páginas con su propio pathname para
  que el active state sea predecible. Visible ≥lg; en mobile el
  drawer del `MobileMenu` cubre la navegación.
- **`UserMenu`** — limpiado: solo Mi perfil + Cerrar sesión (la
  navegación del sitio vive en `AppNav`, no se duplica en el
  desplegable de avatar).
- **`MobileMenu`** — items públicos = Inicio + Cursos + Contacto +
  Verificar diploma; en sesión muestra los items de cada rol.

## Diploma PDF

- `lib/diploma/pdf.tsx` — el sello del logo se carga una vez al
  importar el módulo (`readFileSync`) y se renderiza dos veces:
  - Como **marca de agua grande (620×620, opacity 0.08, rotate 18°)**
    desplazada hacia la esquina superior derecha — solo se ve "media
    figura" detrás del contenido.
  - Como **sello pequeño (36×36)** en el header, junto al wordmark.
- Header con el código de verificación a la derecha; cuerpo con pill
  "Diploma de formación", título partido en bold + bold-oblique, línea
  bajo el nombre del alumno, meta-row con divisores verticales, footer
  firma + QR.
- Para regenerar los diplomas existentes con el nuevo diseño hay que
  borrar las filas de `Diploma` en el DB y volver a emitirlos desde
  `/instructor/courses/[id]`.

## Componentes nuevos

| Componente | Ruta | Notas |
|---|---|---|
| `AuthShell` | `components/features/AuthShell.tsx` | Split layout para login/signup/recover. |
| `PublicNav` | `components/features/PublicNav.tsx` | Pill central con `usePathname`. |
| `ProfileSidebar` | `app/(app)/profile/ProfileSidebar.tsx` | Sidebar local de la página de perfil. |
| `ContactForm` | `app/(public)/(with-header)/contact/ContactForm.tsx` | Simulado, sin backend. |

## Decisiones que es útil recordar

1. **Sin nav central con anclas a la landing.** Probamos primero con
   `#como-funciona` etc. en el header. Cuando había "Cursos" como link
   externo y el resto eran anchors, el active state era inconsistente
   (siempre marcado "Cursos" desde la landing). Resuelto restringiendo
   a links de páginas reales: Inicio / Cursos / Contacto.
2. **El sello como elemento gráfico en vez de imagen literal.** Aparece
   como marca de agua en el panel derecho de auth, en el bento del
   landing, en la CTA de cohorte y en el diploma PDF. Siempre con
   opacity baja y desplazamiento para que solo se vea media figura.
3. **`UserMenu` no duplica la navegación.** Probamos meter "Panel /
   Cursos / Diplomas" en el desplegable del avatar — la navegación ya
   vive en `AppNav` central. Mantener dos sitios donde decidir lo
   mismo era pérdida.
4. **Form de contacto simulado.** Falta backend (Resend) hasta que
   `securitasetsalus.cl` esté verificado en Resend para enviar desde
   `hola@`. Ahora el submit muestra success tras un delay de 600ms.
