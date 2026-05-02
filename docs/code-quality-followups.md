# Mejoras de calidad de código — backlog priorizado

> Origen: audit estilo SonarQube del 2026-05-02. Cada item es auto-contenido
> — escoge cualquiera, lee "Cómo arreglarlo", ejecuta y marca `[x]` cuando
> esté cerrado. Las severidades siguen la convención Sonar (BLOCKER →
> CRITICAL → MAJOR → MINOR → INFO).
>
> Si arreglas un item: añade su commit hash al final del bloque (`Cerrado: abc1234`).

---

## 🟧 CRITICAL

### [x] 1. Rate limiting en `/api/diplomas/[code]/verify`

**Severidad**: critical · **Esfuerzo estimado**: 30 min · **Riesgo**: low

**Dónde**: [`app/api/diplomas/[code]/verify/route.ts`](../app/api/diplomas/[code]/verify/route.ts)

**Por qué**:
- Endpoint público sin auth, CORS abierto, consumido por Clavero y
  documentado en [integration-clavero.md](integration-clavero.md).
- Sin rate limiting, un actor puede:
  1. Enumerar códigos en bucle (DoS por costo de DB).
  2. Reconnaissance: descubrir qué códigos existen sin necesidad de
     romper firma alguna.
- Vercel tiene protección DDoS de baseline pero no es un bucket por IP.

**Cerrado**: `df968c4` (2026-05-02). Implementado con `@upstash/ratelimit`
sliding window 30 req/min/IP en `lib/ratelimit.ts`. Si las envs
`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` no están rellenas,
el wrapper degrada a no-op para no romper dev. Para activarlo en prod:
rellenar esas dos envs en Vercel.

---

### [x] 2. Paralelizar `issueDiplomasForCourse` (N+1 secuencial)

**Severidad**: critical · **Esfuerzo estimado**: 1 h · **Riesgo**: medium (hay PDF render + R2 upload + email Resend en cada item)

**Dónde**: [`lib/diploma/issue.ts:155-164`](../lib/diploma/issue.ts#L155-L164)

**Por qué**:
- Bucle `for (const e of enrollments) await issueDiplomaForEnrollment(e.id)`.
- Cada iteración: `findUnique` + render PDF (~500ms) + upload R2 + email
  Resend → ~2-3 segundos por alumno.
- Cierre de un curso de 12 alumnos → ~30s. Para 100 alumnos →
  ~5 minutos colgando el botón "Emitir diplomas" del instructor.

**Cerrado**: `676f87b` (2026-05-02). `Promise.all` con `pLimit(5)` —
Resend gratuito tiene límite 10 req/s, R2 sin límite notable, PDF render
es CPU local. Curso de 12 alumnos: ~30s → ~6s estimados.

---

## 🟨 MAJOR

### [x] 3. Quitar non-null assertions de `/my-courses`

**Severidad**: major · **Esfuerzo estimado**: 15 min · **Riesgo**: low

**Dónde**: [`app/(app)/my-courses/page.tsx:165, 167, 171, 173, 182`](../app/(app)/my-courses/page.tsx)

**Cerrado**: `36827ac` (2026-05-02). Reemplazado `e.diploma!.X` por un
narrow con const local `const diploma = e.diploma && e.diploma.status === 'ACTIVE' ? e.diploma : null`.

---

### [x] 4. Extraer `computeEligibility` de `saveEvaluationsAction`

**Severidad**: major · **Esfuerzo estimado**: 1.5 h · **Riesgo**: medium (lógica de evaluación es regulada por SENCE)

**Dónde**: [`app/(app)/instructor/actions.ts`](../app/(app)/instructor/actions.ts) (era función de 180 LOC)

**Cerrado**: `36827ac` (2026-05-02). [`lib/diploma/eligibility.ts`](../lib/diploma/eligibility.ts)
expone `computeEligibility(input)` función pura sin side effects.
[`lib/diploma/eligibility.test.ts`](../lib/diploma/eligibility.test.ts)
con 13 tests cubre happy path, reprobado por evaluación / asistencia /
ambas, decisión pendiente, regla de actitud opcional, edge case de curso
sin sesiones, y redondeo. `saveEvaluationsAction` pasó de ~180 LOC a ~130.

---

### [x] 5. Robustecer `lib/r2.ts` ante env vars faltantes

**Severidad**: major · **Esfuerzo estimado**: 30 min · **Riesgo**: low

**Dónde**: [`lib/r2.ts:36-39`](../lib/r2.ts) — `process.env.R2_ACCESS_KEY_ID!`

**Cerrado**: `676f87b` (2026-05-02). Validación explícita de las 3 envs
(`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) antes de
construir el cliente, con error claro si falta alguna.

---

## 🟦 MINOR

### [x] 6. Logger wrapper con env guard

**Severidad**: minor · **Esfuerzo estimado**: 30 min · **Riesgo**: low

**Cerrado**: `676f87b` (2026-05-02). [`lib/logger.ts`](../lib/logger.ts):
- `logger.debug()` solo imprime cuando `DEBUG=1` o `NODE_ENV !== 'production'`.
- `logger.warn()` añade breadcrumb a Sentry.
- `logger.error()` envía a Sentry con `tags` + `extra`.

Reemplazados `console.X` en `lib/auth.ts` (incluido el log de magic-link
URL que era un riesgo: token vivo en logs Vercel), `lib/email/client.ts`,
`lib/diploma/issue.ts`, `app/(app)/profile/actions.ts`,
`app/(app)/instructor/actions.ts`.

---

### [x] 7. `Sentry.captureException` explícito en server actions

**Severidad**: minor · **Esfuerzo estimado**: 30 min · **Riesgo**: low

**Cerrado**: `676f87b` (2026-05-02). Cada catch en server actions ahora
llama a `logger.error(message, err, { tags, ...context })` que envía a
Sentry con tags por feature/action y extras del contexto (userId,
courseId, etc.). Cubre `markAttendanceAction`, `saveEvaluationsAction`,
`updateAvatarAction`, `deleteAvatarAction`, `issueDiplomaForEnrollment`.

---

### [x] 8. Hardcode de URL en fallback de `lib/diploma/issue.ts:27`

**Severidad**: minor · **Esfuerzo estimado**: 10 min · **Riesgo**: low

**Cerrado**: `676f87b` (2026-05-02). `NEXT_PUBLIC_APP_URL` pasa a
obligatoria en `lib/env.ts`. Eliminado el fallback hardcoded; el código
consume `env.NEXT_PUBLIC_APP_URL`. Si la env falta, el módulo falla al
arrancar con mensaje claro de Zod.

---

## ⬛ INFO / observaciones de cobertura

### [~] 9. Ampliar coverage de tests

**Severidad**: info · **Esfuerzo estimado**: 4-6 h · **Riesgo**: none (sólo añade)

**Estado**: mayormente cerrado.

- ✅ **Eligibility** (`lib/diploma/eligibility.test.ts`): 13 tests.
  Commit `36827ac`.
- ✅ **Verify endpoint** (`app/api/diplomas/[code]/verify/route.test.ts`):
  14 tests cubriendo formato del código (5), rate limit (3),
  lookup BD 200/404/410 (3), CORS y normalización (3).
- ✅ **markAttendanceAction** (`app/(app)/instructor/actions.test.ts`):
  7 tests — autorización (3), validación (2), happy path con filtro
  defensivo (1), fallo de transacción (1).
- ✅ **suspendUserAction + reactivateUserAction**
  (`app/(app)/admin/users/actions.test.ts`): 11 tests — autorización (2),
  safeguards (4: self, not-found, last-admin, last-admin-OK), happy path
  con trim/truncate de motivo (2), reactivar (3).
- ⬜ **saveEvaluationsAction** + **issueDiplomasForCourseAction**:
  pendientes. La lógica núcleo (computeEligibility) ya tiene tests; lo
  que falta son los wrappers con auth + Prisma.
- ⬜ **Queries** (`lib/queries/*.ts`): pendiente. Bajo riesgo (queries
  típicas de Prisma) — mejor cubrirlas con integration tests contra
  base de datos real cuando se monte ese harness.

**Cobertura**: 4 archivos test antes → 9 ahora (53 → **98 unit tests**).
Suite E2E Playwright sigue cubriendo el happy path completo.

`test/setup.ts` ahora inyecta `NEXT_PUBLIC_APP_URL` por defecto para
que los módulos que cargan `lib/env.ts` no fallen en el harness.

---

## Estado del backlog

Última revisión: 2026-05-02.

- Items abiertos: 0
- Items parciales: 1 (item 9 — falta saveEvaluationsAction wrapper + queries)
- Items cerrados: 8

Cuando cierres un item: marca el checkbox, añade `Cerrado: <commit-hash>`
debajo del bloque y actualiza este contador.
