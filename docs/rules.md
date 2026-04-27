# Reglas del proyecto — SecuritasEtSalus

> Reglas heredadas de ClaveroCerrajero. Las dos plataformas mantienen las mismas convenciones para que un desarrollador pueda saltar de un repo a otro sin sorpresas.

## Regla fundamental: documentar después de cada fase

Al finalizar cada fase de desarrollo, **es obligatorio** crear o actualizar un archivo `docs/phases/phase-X-done.md` que incluya:

- Qué se construyó exactamente
- Decisiones técnicas tomadas y por qué
- Problemas encontrados y cómo se resolvieron
- Deuda técnica pendiente (si la hay)
- Capturas o descripciones de lo que funciona
- Instrucciones para probar lo construido localmente

Esta documentación no es opcional. Sin ella, la fase no se considera cerrada.

---

## Reglas de código

### Nomenclatura
- **Variables, funciones, rutas, archivos de código** → inglés.
- **Comentarios en código** → español.
- **UI visible al usuario** → español.
- **Documentación técnica** → español (excepto fragmentos de código).

### Estilos
- Usar **SCSS Modules** — no Tailwind, no CSS-in-JS.
- Un archivo `.module.scss` por componente.
- Los tokens de diseño viven en `design-system/tokens/` y se importan donde se necesiten.
- Nunca hardcodear colores, tamaños ni fuentes — siempre usar variables del design system.

### Componentes
- Un componente por archivo.
- Props tipadas con TypeScript siempre.
- Sin `any` — si no se sabe el tipo, se investiga.
- Los componentes de UI pura van en `components/ui/`.
- Los componentes de negocio van en `components/[feature]/`.

### Design system
- **Siempre usar componentes del design system.** Si un componente necesario no existe (Table, Pagination, Modal, Tabs, etc.), **se crea** en `design-system/components/` con su `.module.scss` + wrapper React en `components/ui/`, y luego se usa.
- Prohibido estilar directamente elementos HTML semánticos (`<table>`, `<select>`, `<input>` custom) con SCSS scoped a una página, a menos que sea una variante puntual sobre un componente existente.
- Si necesitas una variante de un componente que ya existe (p. ej. Button en otra forma), amplía el componente con un prop antes de crear uno nuevo.

### Base de datos
- Toda modificación al esquema pasa por una migración de Prisma.
- Nunca modificar la base de datos en producción directamente.
- Los seeds van en `prisma/seed.ts`.

### Git
- Ramas: `main` → producción, `develop` → integración, `feature/nombre` → desarrollo.
- Cada feature branch corresponde a una tarea concreta.
- Los commits siguen el formato: `tipo(scope): descripción` — ej. `feat(diplomas): emisión automática al cerrar curso`.
- No hacer merge a `main` sin haber pasado por `develop`.

### Pagos
- Nunca loguear datos de Stripe en producción.
- Probar siempre con tarjetas de test de Stripe antes de activar live keys.
- Las claves de Stripe van en variables de entorno, nunca en el código.
- El webhook handler debe ser **idempotente**: el mismo `stripePaymentId` no genera doble inscripción ni doble diploma.

### Variables de entorno
- El archivo `.env.example` se mantiene siempre actualizado con todas las keys necesarias (sin valores reales).
- Las variables de entorno se tipan en `lib/env.ts` usando Zod para validación al arrancar.

---

## Reglas específicas de SES (no aplican a Clavero)

### Cursos publicables
- Un curso solo aparece en `/cursos` si está en estado `PUBLISHED`.
- Una vez hay al menos un Enrollment con `paidAt`, el curso **no puede cambiar fechas, precio ni capacidad** sin un proceso explícito de "modificación con notificación a inscritos".
- Los cursos sin sesiones definidas no se pueden publicar.

### Sesiones
- Un curso debe tener al menos 1 `CourseSession`.
- Las sesiones de un mismo curso deben ser contiguas y ordenadas por fecha (validación en el form).

### Cierre de curso
- El cierre del curso solo lo puede ejecutar el `INSTRUCTOR` asignado al curso o un `SUPER_ADMIN`.
- El cierre es **idempotente**: si se ejecuta dos veces, no se duplican diplomas.
- Una vez cerrado, no se pueden modificar asistencias ni notas (auditoría).

### Inscripciones
- Un alumno **no puede inscribirse dos veces** al mismo curso (CONFIRMED activo).
- Si una inscripción se cancela con reembolso, el cupo libera automáticamente.
- El alumno debe tener **email verificado** para iniciar checkout.

---

## Reglas de seguridad

- Los diplomas en R2 se sirven siempre con URLs firmadas con expiración corta (15 min).
- El material de curso solo es accesible para alumnos con Enrollment activo en ese curso.
- Ningún endpoint de API devuelve datos sin verificar el rol del usuario autenticado, salvo los explícitamente públicos (`/cursos`, `/cursos/[slug]`, `/verify/[code]`, `/api/diplomas/[code]/verify`).
- El endpoint `/api/diplomas/[code]/verify` solo expone datos no sensibles: nombre del alumno, título del curso, fecha emisión, estado, escuela e instructor. Nunca email, nunca dirección.
- Rate limiting en `/api/auth/*`, `/api/enrollments/checkout` y `/api/diplomas/[code]/verify`.

---

## Reglas de calidad

- Cada feature nueva lleva al menos un test.
- Los componentes críticos (cierre de curso + emisión de diploma, webhook de pago, verificación QR) llevan tests unitarios y E2E.
- Antes de cada deploy a producción: `npm run typecheck` + `npm run lint` + `npm test` + `npm run build` — todo en verde.
- Build de Vercel está gateado por typecheck + tests via `NODE_ENV=test` (mismo patrón que Clavero).

---

## Checklist de cierre de fase

```
[ ] El código está en develop y revisado
[ ] No hay errores de TypeScript ni de build
[ ] Los tests pasan (unit + E2E relevantes)
[ ] Las variables de entorno están documentadas en .env.example
[ ] Se ha creado docs/phases/phase-X-done.md
[ ] El README está actualizado si aplica
[ ] Se ha actualizado el cuadro de estado en docs/phases.md
```
