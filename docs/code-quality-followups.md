# Mejoras de calidad de código — backlog priorizado

> Origen: audit estilo SonarQube del 2026-05-02. Cada item es auto-contenido
> — escoge cualquiera, lee "Cómo arreglarlo", ejecuta y marca `[x]` cuando
> esté cerrado. Las severidades siguen la convención Sonar (BLOCKER →
> CRITICAL → MAJOR → MINOR → INFO).
>
> Si arreglas un item: añade su commit hash al final del bloque (`Cerrado: abc1234`).

---

## 🟧 CRITICAL

### [ ] 1. Rate limiting en `/api/diplomas/[code]/verify`

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

**Cómo arreglarlo**:
1. `npm i @upstash/ratelimit @upstash/redis` (ya hay cuenta Upstash en
   producción para Sentry — reutilizar, o crear DB Redis nueva).
2. Añadir env vars `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
   en `lib/env.ts` y Vercel.
3. Crear `lib/ratelimit.ts` con un bucket sliding window de 30 req/min
   por IP.
4. En el handler, hacer `const { success } = await ratelimit.limit(ip)`
   y devolver `429` con `Retry-After` si falla.
5. Loggear los 429 a Sentry como `level: 'warning'` para detectar abuso.

**Verificación**:
- Test E2E: 31 requests seguidos desde misma IP → 31º responde 429.
- Sentry recibe el evento.

---

### [ ] 2. Paralelizar `issueDiplomasForCourse` (N+1 secuencial)

**Severidad**: critical · **Esfuerzo estimado**: 1 h · **Riesgo**: medium (hay PDF render + R2 upload + email Resend en cada item)

**Dónde**: [`lib/diploma/issue.ts:155-164`](../lib/diploma/issue.ts#L155-L164)

**Por qué**:
- Bucle `for (const e of enrollments) await issueDiplomaForEnrollment(e.id)`.
- Cada iteración: `findUnique` + render PDF (~500ms) + upload R2 + email
  Resend → ~2-3 segundos por alumno.
- Cierre de un curso de 12 alumnos → ~30s. Para 100 alumnos →
  ~5 minutos colgando el botón "Emitir diplomas" del instructor.

**Cómo arreglarlo**:
1. `npm i p-limit`.
2. Reemplazar el `for` por:
   ```ts
   const limit = pLimit(5);
   const results = await Promise.all(
     enrollments.map((e) => limit(() => issueDiplomaForEnrollment(e.id))),
   );
   ```
3. Mantener la idempotencia que ya existe (líneas 54-60 chequean si
   diploma ya existe).
4. Acumular contadores recorriendo `results` después.

**Cuidado**:
- Resend tiene rate limit de 10 req/s en plan gratuito → con concurrencia
  5 vamos sobrados.
- R2 (Cloudflare) sin rate limit notable.

**Verificación**:
- Cerrar curso de 4 alumnos en local: tiempo de respuesta < 5s (antes ~10s).
- E2E `e2e/full-flow.spec.ts` sigue pasando.

---

## 🟨 MAJOR

### [ ] 3. Quitar non-null assertions de `/my-courses`

**Severidad**: major · **Esfuerzo estimado**: 15 min · **Riesgo**: low

**Dónde**: [`app/(app)/my-courses/page.tsx:165, 167, 171, 173, 182`](../app/(app)/my-courses/page.tsx)

**Por qué**:
- `e.diploma!.code`, `e.diploma!.pdfKey` enmascaran nulls reales si la
  query cambia. TypeScript no protege porque `!` lo silencia.
- Si en el futuro el `select` de `lib/queries/courses.ts:listEnrollmentsByStudent`
  hace `pdfKey` opcional, el component crashea en runtime.

**Cómo arreglarlo**:
- Antes del bloque que usa `e.diploma!.X`, hacer:
  ```ts
  const diploma = e.diploma;
  if (!diploma) return null; // o un fallback visual
  ```
- O hacer `select` que garantice los campos no-null en `lib/queries/courses.ts`
  y tipar el retorno con `NonNullable<>`.

**Verificación**: TypeScript no necesita `!` en ninguna línea.

---

### [ ] 4. Extraer `computeEligibility` de `saveEvaluationsAction`

**Severidad**: major · **Esfuerzo estimado**: 1.5 h · **Riesgo**: medium (lógica de evaluación es regulada por SENCE)

**Dónde**: [`app/(app)/instructor/actions.ts:161-341`](../app/(app)/instructor/actions.ts) (función de 180 LOC)

**Por qué**:
- Mezcla validación + cálculo de elegibilidad (asistencia % + nota mínima
  + flags `hasEvaluation`) + transacción Prisma + revalidación.
- Cero tests directos sobre la lógica de elegibilidad — sólo cobertura
  E2E del happy path.
- Si SENCE cambia el umbral de aprobación (hoy 4.0 sobre 7.0), hay que
  navegar 180 líneas para encontrar el switch.

**Cómo arreglarlo**:
1. Crear `lib/diploma/eligibility.ts` con función pura:
   ```ts
   type EligibilityInput = {
     totalSessions: number;
     attendedSessions: number;
     finalGrade: number | null;
     hasEvaluation: boolean;
     passingGrade: number; // 4.0
     requiredAttendancePct: number; // 100
   };
   type EligibilityResult = {
     passed: boolean;
     reason: 'ok' | 'attendance' | 'evaluation' | 'both' | null;
   };
   export function computeEligibility(input: EligibilityInput): EligibilityResult { ... }
   ```
2. Tests `lib/diploma/eligibility.test.ts` con casos:
   - 100% asistencia + nota 4.0 + hasEvaluation=true → passed
   - 100% asistencia + nota 3.9 → failed reason=evaluation
   - 90% asistencia + nota 6.0 → failed reason=attendance
   - 50% asistencia + nota 1.0 → failed reason=both
   - hasEvaluation=false + 100% asistencia → passed (no requiere nota)
3. Reemplazar la lógica inline en `saveEvaluationsAction` por una llamada
   a `computeEligibility(...)`.

**Verificación**: Vitest pasa nuevos tests + E2E `full-flow.spec.ts` sigue verde.

---

### [ ] 5. Robustecer `lib/r2.ts` ante env vars faltantes

**Severidad**: major · **Esfuerzo estimado**: 30 min · **Riesgo**: low

**Dónde**: [`lib/r2.ts:36-39`](../lib/r2.ts) — `process.env.R2_ACCESS_KEY_ID!`

**Por qué**:
- `getClient()` chequea `isR2Available()` pero los `process.env.X!`
  posteriores no son null-safe. Si alguien borra una env en Vercel,
  el primer upload falla con error oscuro `Cannot read properties of
  undefined`.

**Cómo arreglarlo**:
- Reemplazar los `!` por validación explícita al construir el cliente:
  ```ts
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error('R2 env vars missing — check Vercel project settings');
  }
  ```
- O centralizar el guard en `lib/env.ts` con Zod (que ya hay).

**Verificación**: borrar `R2_ACCESS_KEY_ID` localmente, intentar subir
avatar → error claro, no `undefined`.

---

## 🟦 MINOR

### [ ] 6. Logger wrapper con env guard

**Severidad**: minor · **Esfuerzo estimado**: 30 min · **Riesgo**: low

**Dónde**:
- [`lib/auth.ts:130`](../lib/auth.ts) — `console.info(`[magic-link skipped] → ${email} (URL: ${url})`)`
- [`lib/email/client.ts:55`](../lib/email/client.ts)
- [`app/(app)/profile/actions.ts:201, 209, 237, 250`](../app/(app)/profile/actions.ts)

**Por qué**:
- Logs sin guard de entorno terminan en los logs de Vercel.
- En particular `lib/auth.ts:130` loggea la URL completa del magic link
  cuando Resend no está configurado — un dev/staging con Resend mal
  configurado expone tokens válidos en logs.

**Cómo arreglarlo**:
1. Crear `lib/logger.ts`:
   ```ts
   const isDebug = process.env.DEBUG === '1' || process.env.NODE_ENV !== 'production';
   export const logger = {
     debug: (...args: unknown[]) => { if (isDebug) console.log('[debug]', ...args); },
     info: (...args: unknown[]) => console.info(...args),
     warn: (...args: unknown[]) => console.warn(...args),
     error: (err: unknown, ctx?: Record<string, unknown>) => {
       console.error(err);
       Sentry.captureException(err, { extra: ctx });
     },
   };
   ```
2. Reemplazar todos los `console.X` listados arriba.
3. Para el caso de magic link sin Resend: cambiar a `logger.debug` para
   que no aparezca en prod.

**Verificación**: `grep -rE 'console\.(log|info|warn)' lib app | grep -v node_modules` debería estar vacío salvo los archivos del propio logger.

---

### [ ] 7. `Sentry.captureException` explícito en server actions

**Severidad**: minor · **Esfuerzo estimado**: 30 min · **Riesgo**: low

**Dónde**:
- [`app/(app)/instructor/actions.ts:124-131, 333-340`](../app/(app)/instructor/actions.ts)
- Resto de server actions con `try { ... } catch (err) { console.error(...); return generic }`

**Por qué**:
- Sentry está cableado vía `instrumentation.ts` y captura errors
  no manejados, pero los catches manuales no envían a Sentry.
- Resultado: el usuario ve "no se pudo guardar" pero el dev no se entera.

**Cómo arreglarlo**:
- Añadir `Sentry.captureException(err, { tags: { action: 'mark-attendance', courseId, userId } })`
  antes del `return { ok: false, ... }`.
- Idealmente usar el `logger.error` del item 6.

**Verificación**: forzar un error en local (ej: bajar la DB) → ver el
evento en Sentry con los tags correctos.

---

### [ ] 8. Hardcode de URL en fallback de `lib/diploma/issue.ts:27`

**Severidad**: minor · **Esfuerzo estimado**: 10 min · **Riesgo**: low

**Dónde**: [`lib/diploma/issue.ts:27`](../lib/diploma/issue.ts#L27)
```ts
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://securitasetsalus.cl';
```

**Por qué**:
- Si en staging falta `NEXT_PUBLIC_APP_URL`, el QR del diploma apunta a
  producción, lo cual confunde testing.

**Cómo arreglarlo**:
- Mover la validación a `lib/env.ts` (Zod): `NEXT_PUBLIC_APP_URL: z.string().url()`.
  En el código consumir `env.NEXT_PUBLIC_APP_URL` sin fallback.
- Si la env falta, el módulo falla al cargar — error claro.

**Verificación**: borrar la env local, ver que el server falla al
arrancar con mensaje claro.

---

## ⬛ INFO / observaciones de cobertura

### [ ] 9. Ampliar coverage de tests

**Severidad**: info · **Esfuerzo estimado**: 4-6 h · **Riesgo**: none (sólo añade)

**Estado actual**: 5 unit tests (`password`, `regions`, `tokens`, `diploma/code`) + 16 E2E Playwright.

**Cero tests** en:

| Archivo | Por qué importa |
|---|---|
| `lib/queries/*.ts` | Queries con joins y filtros — riesgo de N+1 si cambian |
| `lib/diploma/issue.ts` | Idempotencia es crítica; mock R2 + Resend |
| `app/(app)/instructor/actions.ts` | Cierre de curso = lógica regulada |
| `app/(app)/admin/users/actions.ts` | Suspensión + role change con safeguards |
| `app/api/diplomas/[code]/verify/route.ts` | Endpoint público con contrato firme |

**Recomendación**: priorizar `lib/diploma/eligibility.ts` (item 4) y los
casos edge del verify endpoint (códigos malformados, status REVOKED, 404,
CORS). Los E2E ya cubren el happy path — lo que falta es robustez de
edge cases.

---

## Estado del backlog

Última revisión: 2026-05-02.

- Items abiertos: 9
- Items cerrados: 0

Cuando cierres un item: marca el checkbox, añade `Cerrado: <commit-hash>`
debajo del bloque y actualiza este contador.
