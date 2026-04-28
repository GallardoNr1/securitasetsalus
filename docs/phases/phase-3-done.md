# Fase 3 — Gestión de cursos con sesiones múltiples

**Cierre:** 2026-04-28.
**Estado:** ✅ completada en 3 commits.

| Sub-bloque | Commit | Qué cubre |
|---|---|---|
| 3a — CRUD usuarios | `e63847a` | `/admin/usuarios` listado + crear + editar |
| 3b — CRUD cursos | `ee58e80` | `/admin/cursos` listado + crear + editar con sesiones múltiples y catálogo SENCE |
| 3c — Vistas instructor/alumno + reemplazo mock | (próximo commit) | `/instructor/cursos`, `/mis-cursos`, catálogo público leyendo de BD, eliminado mock, dashboards reales |

## Qué se construyó

### Schema (migración `course_clavero_fields`)
- Reemplaza `Course.eligibleForClaveroProfessionalCert: Boolean` por:
  - `claveroSkillCode: String?` — `'LE' | 'LP' | 'L3' | 'AB' | 'AA' | 'AA+' | 'V1' | 'V2' | 'M1' | 'M2'` o null.
  - `claveroSkillSuffix: String?` — `'e+'` para L3 cuando la sede tiene máquina avanzada.
- Añade `prerequisiteSkillCodes: String[]` para validar inscripciones contra diplomas previos.
- Añade `includedKit: String?` (Markdown) describiendo el hardware/herramientas que se entregan.

### Catálogo de skills (`lib/clavero-skills.ts`)
Constantes y helpers para el sistema de codificación SES → Clavero:
- `CLAVERO_SKILL_CODES` y `CLAVERO_SKILL_LABELS` para UI.
- `isValidClaveroSkillCode`, `formatSkillCode` helpers.
- `CLAVERO_SKILL_SUFFIXES` con sufijos opcionales.

### Validaciones (`lib/validations/`)
- **`users.ts`**: createUserSchema, updateUserSchema, userListFiltersSchema. Roles SUPER_ADMIN / INSTRUCTOR / STUDENT, RUT chileno, password opcional al crear.
- **`courses.ts`**: createCourseSchema, updateCourseSchema, sessionSchema, courseListFiltersSchema con superRefine que valida:
  - Subdivisión coherente con país.
  - Sufijo Clavero solo si hay code base.
  - Sesiones sin solapes temporales.
- Helpers `parseSessionsFromFormData` y `parsePrerequisitesFromFormData` para extraer arrays anidados del FormData.

### Queries (`lib/queries/`)
- **`users.ts`**: `listUsers` con filtros + paginación de 20, `getUserById`, `listInstructors`, `getUserAvatarKey`.
- **`courses.ts`**:
  - `listCoursesAdmin` con filtros + paginación.
  - `getCourseById` con sesiones + instructor + counts.
  - `getPublishedCourseBySlug` y `listPublishedCourses` (catálogo público).
  - `listCoursesByInstructor` (vista instructor).
  - `listEnrollmentsByStudent` (vista alumno).

### Server actions
- **`app/(app)/admin/usuarios/actions.ts`**:
  - `createUserAction`: crea con `emailVerifiedAt: now`, password opcional.
  - `updateUserAction`: con salvaguarda "no quitar rol al último SUPER_ADMIN".
- **`app/(app)/admin/cursos/actions.ts`**:
  - `createCourseAction`: valida instructor, slug único, crea con sesiones en transacción.
  - `updateCourseAction`: bloquea cambios sensibles (precio, moneda, capacidad) si hay alumnos pagados, recrea sesiones de forma destructiva controlada.
  - `publishedAt` se setea solo la primera vez que pasa a PUBLISHED (idempotente).

### UI nueva
- **`/admin`** dashboard real con stats de BD (usuarios, instructores, cursos publicados/borradores) + acciones rápidas (crear curso, crear usuario) + roadmap de fases siguientes.
- **`/admin/usuarios`** listado con búsqueda + filtros pill, Table del DS, Avatar inline, Tag para rol, Badge para verificado.
- **`/admin/usuarios/new`** y **`/admin/usuarios/[id]`** con `UserForm` reutilizable.
- **`/admin/cursos`** listado con filtros, badges de estado, Tag con código Clavero y SENCE.
- **`/admin/cursos/new`** y **`/admin/cursos/[id]`** con `CourseForm` reutilizable (6 fieldsets: info general, logística, instructor, sesiones dinámicas con add/remove, pedagogía, Clavero con prerequisitos checkbox grid).
- **`/instructor/cursos`** listado de cursos asignados al instructor logueado, con calendario y meta. `/instructor` redirige aquí automáticamente.
- **`/mis-cursos`** listado de inscripciones del alumno con badges de estado.
- **`/dashboard`** del alumno: 3 cards (Mis cursos / Mis diplomas / Mi perfil) con queries reales.

### Componentes UI nuevos
- `components/ui/Table.tsx`, `Pagination.tsx`, `FilterBar.tsx` — wrappers React de los SCSS copiados en Fase 0.

### Catálogo público (reemplazo del mock)
- `app/(public)/cursos/page.tsx` y `[slug]/page.tsx` ahora leen de Prisma (`listPublishedCourses`, `getPublishedCourseBySlug`).
- `CourseCard` actualizada para recibir el shape real (sin categoría, con `_count.enrollments`, etc.).
- `app/(public)/page.tsx` (landing) muestra los 3 primeros cursos publicados; si no hay ninguno, oculta esa sección.
- `app/sitemap.ts` lee de BD; falla silenciosamente si no hay conexión.
- Eliminado `lib/mock/courses.ts` y la carpeta.
- Eliminado `components/features/DashboardStub.tsx` y SCSS (ya no se usa).

## Verificación

```
$ npm run typecheck     ✓ tsc --noEmit (sin errores)
$ npm run lint          ✓ eslint .
$ npm test              ✓ 45/45
$ npm run build         ✓ Build OK con todas las rutas /admin/cursos*, /admin/usuarios*,
                          /instructor/cursos, /mis-cursos
```

## Decisiones tomadas

- **Categorías eliminadas del catálogo público.** El mock tenía `category: 'cerrajeria' | 'control-accesos' | ...`. En el modelo real esto sería derivable de `claveroSkillCode` (LE/LP/L3 → cerrajería local, AB/AA/AA+ → técnico, V1/V2 → automotriz, M1/M2 → módulos). Pero introducir filtro por categoría sin feedback real de uso es overengineering. Lo retomamos cuando haya >10 cursos y un usuario real lo pida.
- **`updateCourseAction` recrea sesiones de forma destructiva**. Borra todas y crea las del form. Más simple que diff por `sessionNumber`. En Fase 5 (asistencia) tendremos que repensar si las sesiones acumulan datos asociados que no se pueden perder.
- **Salvaguarda de "último SUPER_ADMIN"** en `updateUserAction` — si solo hay 1 admin, no le permite degradarse. Evita que el sistema quede sin admin por un click.
- **Bloqueo de cambios sensibles con alumnos pagados** — en `updateCourseAction`, no se puede modificar precio, moneda ni reducir capacidad si `_count.enrollments > 0`. Validación en el server, no solo en UI.
- **`/instructor` redirige a `/instructor/cursos`**. El "panel" del instructor ES el listado de cursos. Una página intermedia con stats no aporta hasta que haya datos reales (asistencia, evaluaciones de Fase 5).
- **`generateStaticParams` en `/cursos/[slug]`** ahora consulta BD. Las páginas se pre-renderizan al build; al publicar/editar un curso, `revalidatePath('/cursos/[slug]')` en las actions invalida y se regenera bajo demanda.
- **Sesiones se renumeran al guardar** (`sessionNumber: i + 1`). El form puede llegar con cualquier orden; el server impone la numeración.

## Lo que NO está en Fase 3 (intencional)

- **Filtro por código Clavero o SENCE en el catálogo público** — pendiente de feedback real.
- **Inscripción del alumno con pago** — Fase 4.
- **Asistencia y evaluaciones cruzadas G19** — Fase 5.
- **Material de curso post-pago descargable** — Fase 8 (diferida del MVP).
- **Diff incremental de sesiones al editar** — overengineering hasta Fase 5.
- **Soft delete de usuarios** — un usuario que se quiera "borrar" se mueve a un estado inactivo cuando haga falta. Por ahora solo se editan; eliminar de verdad es operación de admin manual.

## Cómo probarlo localmente

```bash
npm run dev
# Login como SUPER_ADMIN (mgallardo.wdeveloper@gmail.com / Su121012se!)
# 1. Ir a /admin/usuarios/new → crear un instructor de prueba
# 2. Ir a /admin/cursos/new → crear un curso:
#    - Título: "Cerrajero Residencial Local Junior (SENCE)"
#    - Slug: cerrajero-residencial-local-junior
#    - Descripción corta: 20+ caracteres
#    - Temario: 50+ caracteres
#    - Duración: 8h, precio 180000 CLP, capacidad 12
#    - País: Chile, sede libre
#    - Instructor: el recién creado
#    - 1 sesión: fecha futura
#    - Marcar SENCE
#    - Código Clavero: LE (Llaves estándar)
#    - Status: PUBLISHED
# 3. Logout
# 4. Ir a /cursos sin login → debe aparecer el curso real
# 5. Click en el curso → /cursos/cerrajero-residencial-local-junior → ver detalle
# 6. Login con el instructor → /instructor → redirige a /instructor/cursos → ve el curso
```

## Deuda técnica

- **`updateCourseAction` borra y recrea sesiones**. Cuando llegue Fase 5 con `Attendance` referenciando `CourseSession`, esto romperá los datos de asistencia al editar. Hay que cambiar a diff por `sessionNumber` antes de Fase 5.
- **Las fechas de sesión se manejan en UTC**. Los inputs `datetime-local` los entienden como hora local del navegador, pero al persistirlos en BD queda en UTC. Para Chile el shift es de -3/-4h. Cuando llegue feedback real probablemente toque añadir un convertidor explícito.
- **No hay tests unitarios de las server actions**. La cobertura sigue dependiendo de los lib helpers ya testeados (regions, password, tokens). Los tests E2E de los flujos llegan en Fase 9 con Playwright.
- **El form de curso bloquea precio/moneda/capacidad cuando hay pagos** pero no muestra el motivo en línea — solo en el banner superior. Mejorable cuando llegue feedback real.
