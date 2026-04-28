# Fases de desarrollo — SecuritasEtSalus

## Resumen

| Fase | Nombre | Estado |
|---|---|---|
| 0 | Setup y configuración inicial | ✅ [Cerrada 2026-04-28](phases/phase-0-done.md) |
| 1 | Landing page y catálogo público | ✅ [Cerrada 2026-04-28](phases/phase-1-done.md) |
| 2 | Autenticación y roles | ✅ [Cerrada 2026-04-28](phases/phase-2-done.md) |
| 3 | Gestión de cursos con sesiones múltiples | ⬜ Pendiente |
| 4 | Inscripción pagada con Stripe | ⬜ Pendiente |
| 5 | Asistencia, evaluación y emisión de diplomas | ⬜ Pendiente |
| 6 | Verificación pública de diplomas + integración con Clavero | ⬜ Pendiente |
| 7 | Emails transaccionales | ⬜ Pendiente |
| 8 | Material de curso (post-pago) | ⬜ Pendiente |
| 9 | Tests, observabilidad y lanzamiento | ⬜ Pendiente |

**Estimación inicial total:** ~6-8 semanas a tiempo parcial, asumiendo reaprovechamiento agresivo de Clavero.

---

## Fase 0 — Setup y configuración inicial

**Objetivo:** Tener el proyecto arrancando localmente con toda la infraestructura base lista. **Aprovechar al máximo el repo de Clavero.**

### Tareas
- [ ] Inicializar proyecto Next.js 16 + React 19 + TypeScript 6.
- [ ] Copiar desde Clavero: configs (`next.config.ts`, `tsconfig.json`, `eslint`, `prettier`, `vercel.json`, `vitest.config.ts`, `playwright.config.ts`), helpers (`lib/db.ts`, `lib/env.ts`, `lib/regions.ts`, `lib/tokens.ts`, `lib/r2.ts`, `lib/stripe.ts`, `lib/resend.ts`, `lib/email/`), `test/setup.ts`.
- [ ] Adaptar `lib/env.ts` con las vars de SES (sin las STRIPE_*_PRICE_ID, sin GOV_*).
- [ ] Configurar SCSS Modules + copiar el design system de Clavero.
- [ ] Adaptar paleta y tipografía del design system a la identidad de SES (ver [design-system.md](design-system.md)).
- [ ] Instalar y configurar Prisma 7 + `prisma.config.ts`.
- [ ] Crear schema Prisma con los modelos definidos en project-brief.
- [ ] Configurar NextAuth.js v5 con providers Credentials + Magic Link (Resend).
- [ ] Crear proyecto Vercel + proyecto Supabase + bucket R2 para SES.
- [ ] Configurar dominio (subdominio temporal o definitivo).
- [ ] Configurar Sentry.
- [ ] Primer deploy funcional (página vacía).

### Entregable
Repositorio con proyecto Next.js corriendo en local y deploy automático a Vercel funcionando.

### Documentación obligatoria al cerrar
`docs/phases/phase-0-done.md`

---

## Fase 1 — Landing page y catálogo público

**Objetivo:** Tener el sitio público listo para mostrar la oferta de cursos.

### Tareas
- [ ] Maquetar landing institucional (hero, propuesta de valor, "cómo funciona", instructores destacados, testimonios, CTA al catálogo).
- [ ] Implementar `/cursos` — listado público con filtros (región, fecha, tema/categoría, precio).
- [ ] Implementar `/cursos/[slug]` — detalle de curso con temario completo, fechas, instructor, sede, precio, botón "Inscribirme y pagar" (que redirige a `/login` si no está logueado).
- [ ] Página `/verify/[code]` — formulario de placeholder (Fase 6 lo conecta al endpoint real).
- [ ] SEO básico (meta tags, sitemap, robots.txt, OpenGraph).
- [ ] Responsive completo.

### Entregable
Catálogo público navegable en producción con cursos de ejemplo (seed).

### Documentación obligatoria al cerrar
`docs/phases/phase-1-done.md`

---

## Fase 2 — Autenticación y roles

**Objetivo:** Sistema de login funcional con roles y verificación de email.

### Tareas
- [ ] Modelo `User` con `role`, `region`, `emailVerifiedAt`.
- [ ] `/register` — registro de alumnos con verificación de email obligatoria.
- [ ] `/login` — login con email + contraseña.
- [ ] `/forgot-password` y `/reset-password/[token]`.
- [ ] `/verify-email/sent` y `/verify-email/[token]`.
- [ ] Middleware de protección de rutas por rol.
- [ ] Redirección por rol: STUDENT → `/dashboard`, INSTRUCTOR → `/instructor`, SUPER_ADMIN → `/admin`.
- [ ] Dashboard básico por rol (estructura sin datos).
- [ ] Perfil de usuario editable (`/profile`).
- [ ] Seed con SUPER_ADMIN inicial.
- [ ] Reaprovechar plantillas de email de Clavero (welcome, verification, password reset) — adaptar branding.

### Roles a implementar en esta fase
- `SUPER_ADMIN`
- `INSTRUCTOR`
- `STUDENT`

`REGION_ADMIN` queda fuera. SES arranca solo Chile y un único `SUPER_ADMIN` gestiona todas las regiones. El campo `region` ya está en el modelo desde el día uno para no migrar después.

### Auth providers
- **Credentials** (email + contraseña).
- **Magic Link** vía Resend (desde el inicio — reduce fricción para alumnos puntuales).

### Entregable
Sistema de auth completo con verificación de email y redirección por roles.

### Documentación obligatoria al cerrar
`docs/phases/phase-2-done.md`

---

## Fase 3 — Gestión de cursos con sesiones múltiples

**Objetivo:** Admin crea cursos con varias sesiones; los cursos quedan publicables al catálogo.

### Tareas
- [ ] Modelos `Course`, `CourseSession`.
- [ ] CRUD de cursos en `/admin/cursos` (listado con filtros).
- [ ] Formulario de creación `/admin/cursos/new`:
  - Datos del curso (título, slug auto-generado, descripción corta, temario completo, duración total, precio, moneda con default `CLP`, capacidad).
  - Asignar instructor (autocomplete sobre usuarios con rol INSTRUCTOR).
  - Asignar región y sede.
  - Añadir/quitar sesiones (al menos 1) con fecha y hora de inicio + fin.
  - Flags: `hasEvaluation` (default true), `senceEligible` (default false), `eligibleForClaveroProfessionalCert` (default false).
  - Estado: `DRAFT` o `PUBLISHED` (solo PUBLISHED aparece en `/cursos`).
- [ ] Edición de curso (mismo form) con bloqueo de cambios cuando ya hay inscritos pagados.
- [ ] `/admin/cursos/[id]` — detalle con lista de inscritos, asistencia agregada, acciones.
- [ ] Vista del instructor `/instructor/cursos` — listado de cursos asignados.
- [ ] Vista del alumno `/mis-cursos` — listado de inscripciones (filtra por estado).

### Entregable
Admin puede crear curso completo con sesiones, asignarlo a instructor, publicarlo al catálogo.

### Documentación obligatoria al cerrar
`docs/phases/phase-3-done.md`

---

## Fase 4 — Inscripción pagada con Stripe

**Objetivo:** El alumno se inscribe y paga directamente desde el catálogo.

### Tareas
- [ ] Modelos `Enrollment` y `Payment`.
- [ ] `POST /api/enrollments/checkout` — crea Enrollment (status PENDING_PAYMENT) + Stripe Checkout Session con `price_data` dinámico (lee `currency` del Course).
- [ ] Validaciones pre-checkout: alumno verificado, cupos disponibles, no inscrito ya.
- [ ] **Flujo SENCE**: si el curso tiene `senceEligible=true`, el checkout pregunta "¿Aplicar franquicia SENCE?" antes del pago. Si sí, recolecta RUT alumno, RUT empleador, contacto DRH; los guarda en `Enrollment`.
- [ ] `POST /api/payments/webhook` — handler de `checkout.session.completed` idempotente.
- [ ] Tras webhook: Enrollment → CONFIRMED, crea Payment, dispara email de confirmación.
- [ ] Manejo de `charge.refunded` con cálculo según política escalonada (100/75/50/25/0% según antelación). Liberar cupo del curso al cancelar.
- [ ] `/billing` — historial de pagos del alumno.
- [ ] `/admin/pagos` — vista admin de todos los pagos con filtros (rango fecha, curso, estado, SENCE sí/no).
- [ ] Tests con Stripe CLI (test cards 4242 4242…).
- [ ] Política de cancelaciones implementada con la tabla escalonada.

### Entregable
Alumno paga un curso desde el catálogo público y queda inscrito automáticamente.

### Documentación obligatoria al cerrar
`docs/phases/phase-4-done.md`

---

## Fase 5 — Asistencia, evaluación y emisión de diplomas

**Objetivo:** Instructor marca asistencia por sesión y registra evaluación final; el sistema emite diplomas a quienes cumplen requisitos.

### Tareas
- [ ] Modelos `Attendance`, `Diploma`.
- [ ] `/instructor/cursos/[id]/asistencia` — interfaz por sesión, lista de inscritos, toggle asistencia.
- [ ] `/instructor/cursos/[id]/evaluacion` — registrar nota final por alumno + cierre del curso.
- [ ] **Evaluaciones cruzadas (G19, OTEC SENCE)** — *[PENDIENTE: definir formato exacto antes de empezar esta tarea]*:
  - Modelos `CourseEvaluation`, `CourseEvaluationResponse` (anonimato), `StudentEvaluation`.
  - Formulario alumno → curso/instructor disponible al cerrar la última sesión (link en email + en `/mis-cursos/[id]`).
  - Formulario instructor → alumno integrado en `/instructor/cursos/[id]/evaluacion`.
  - Estado `EnrollmentStatus.PENDING_EVALUATION` para cuando faltan evaluaciones pero el resto está completo.
  - Recordatorios automáticos a alumnos con cuestionario pendiente.
  - Reportes agregados anónimos por curso para auditoría SENCE.
- [ ] Lógica `closeCourseAndIssueDiplomas`:
  - Para cada Enrollment del curso:
    - Calcula % asistencia (sesiones marcadas como asistidas / total sesiones).
    - Si asistencia < 100% O (`hasEvaluation` Y nota < aprobado) → `FAILED` (irrecuperable).
    - Si todo lo anterior está OK pero falta alguna evaluación cruzada → `PENDING_EVALUATION`.
    - Si todo está OK + evaluaciones cruzadas completas → `COMPLETED` + emite Diploma.
  - Cuando todas las evaluaciones cruzadas se completan después del cierre del curso, recalcular y emitir diplomas pendientes (idempotente).
- [ ] Cuando `senceEligible=true` y el alumno usó franquicia, además del diploma normal se emite el **Certificado SENCE** en formato oficial (otra plantilla PDF separada).
- [ ] Generación PDF del diploma con QR + código único, almacenamiento en R2.
- [ ] `/mis-diplomas` — alumno descarga el PDF. Si tiene `PENDING_EVALUATION`, mostrar el cuestionario con CTA "Completa para recibir tu diploma".
- [ ] `/admin/diplomas` — listado, revocación manual.
- [ ] Idempotencia en cierre del curso (no se puede cerrar dos veces, no se duplican diplomas).

### Entregable
Instructor cierra un curso y los diplomas aprobados se emiten automáticamente con PDF descargable.

### Documentación obligatoria al cerrar
`docs/phases/phase-5-done.md`

---

## Fase 6 — Verificación pública de diplomas + integración con Clavero

**Objetivo:** Cualquiera puede verificar un diploma de SES; Clavero puede consumir el endpoint para validar diplomas que sus cerrajeros suben.

### Tareas
- [ ] `/verify/[code]` — página pública con datos del diploma (alumno, curso, fecha, estado, instructor, escuela).
- [ ] `GET /api/diplomas/[code]/verify` — endpoint JSON público (Edge Function).
  - Respuesta exitosa: `{ ok: true, diploma: { studentName, courseTitle, courseHours, issuedAt, status, schoolName: "SecuritasEtSalus", instructorName, region } }`.
  - Respuesta fallida: `{ ok: false, error: "DIPLOMA_NOT_FOUND" | "DIPLOMA_REVOKED" }`.
- [ ] CORS abierto al endpoint para que Clavero (otra origin) pueda consumirlo.
- [ ] Rate limiting en el endpoint (proteger de abuso).
- [ ] Documentar el contrato exacto en [integration-clavero.md](integration-clavero.md).
- [ ] Coordinación con Clavero: cuando Clavero esté listo (Fase 11 de Clavero), su flujo de "subir diploma SES" llamará a este endpoint para validar.

### Entregable
Endpoint funcional consumible desde Clavero. Página pública de verificación humana.

### Documentación obligatoria al cerrar
`docs/phases/phase-6-done.md`

---

## Fase 7 — Emails transaccionales

**Objetivo:** Automatizar todas las comunicaciones con alumnos e instructores.

### Tareas
- [ ] Configurar Resend + dominio verificado (DKIM + SPF + DMARC).
- [ ] Plantillas React Email:
  - Verificación de email
  - Welcome post-verificación
  - Confirmación de inscripción + datos prácticos
  - Recordatorio 48h antes del primer día del curso
  - Diploma emitido (con PDF adjunto o enlace firmado)
  - No alcanzó requisitos del diploma (con motivo)
  - Recibo de pago
  - Recuperación de contraseña
- [ ] Cron diario `/api/cron/course-reminders` que envía recordatorios 48h antes.
- [ ] Reaprovechar layout/branding base de los emails de Clavero.

### Entregable
Sistema de emails completo cubriendo todo el ciclo de vida del alumno.

### Documentación obligatoria al cerrar
`docs/phases/phase-7-done.md`

---

## Fase 8 — Material de curso (post-pago)

**Objetivo:** Los alumnos inscritos acceden a material de apoyo (PDFs, recursos) tras el pago.

### Tareas
- [ ] Modelo `CourseMaterial` (curso, archivo, descripción, fecha publicación).
- [ ] Admin sube archivos al bucket `ses-course-materials` desde `/admin/cursos/[id]/material`.
- [ ] Alumno con Enrollment en estado CONFIRMED o COMPLETED ve la pestaña "Material" en `/mis-cursos/[id]`.
- [ ] URLs firmadas con expiración 24h.
- [ ] **Diferida fuera de MVP** — se implementa cuando un instructor lo pida explícitamente. En el lanzamiento inicial el material se entrega en presencial.

### Entregable
Alumnos inscritos descargan material adjunto al curso desde la app.

### Documentación obligatoria al cerrar
`docs/phases/phase-8-done.md`

---

## Fase 9 — Tests, observabilidad y lanzamiento

**Objetivo:** Plataforma lista para alumnos reales.

### Tareas
- [ ] Tests unitarios de lógica crítica (`lib/enrollments.ts`, `lib/attendance.ts`, `lib/diplomas.ts`, `lib/payments.ts`, `lib/regions.ts`, `lib/tokens.ts`, `lib/validations/*`).
- [ ] Tests de componentes UI clave.
- [ ] Tests E2E (Playwright):
  - Flujo público: catálogo → detalle curso.
  - Registro + verificación de email.
  - Login + dashboards por rol.
  - Inscripción + checkout (con Stripe test mode).
  - Instructor marca asistencia + cierra curso + emite diploma.
  - Verificación pública de diploma.
- [ ] Coverage ≥ 90% en archivos críticos.
- [ ] Build gateado por tests en Vercel (mismo patrón que Clavero).
- [ ] Lighthouse en páginas públicas.
- [ ] Auditoría de seguridad: rate limiting, CSP, headers, permisos por rol.
- [ ] Sentry DSN en Vercel + smoke test de captura de errores.
- [ ] Activar Stripe live con la **cuenta Stripe propia de SES** (separada de la de Clavero, creada con datos de la SpA chilena).
- [ ] Configurar dominio definitivo en Cloudflare.
- [ ] Documentación operativa para el admin (cómo crear cursos, cómo cerrar, cómo revocar diploma).

### Entregable
Plataforma en producción con dominio real, pagos live, primer alumno inscrito de verdad.

### Documentación obligatoria al cerrar
`docs/phases/phase-9-done.md`
