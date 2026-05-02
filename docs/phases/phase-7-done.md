# Fase 7 — Emails transaccionales (parcial)

**Cierre:** 2026-05-02.
**Estado:** ✅ completada salvo `PendingEvaluationEmail` (depende del
modelo de evaluaciones cruzadas G19, todavía no diseñado).

## Qué se construyó

3 templates nuevos + 1 cron + cableado en las actions/webhook que ya
existían. Completa el ciclo de vida del alumno con avisos en cada
transición clave (recordatorio antes del curso, cierre con
no-aprobación, recibo formal de pago).

### Migración

`prisma/migrations/20260502170609_add_session_reminder_sent_at/`:
- `CourseSession.reminderSentAt: DateTime?` para evitar dobles envíos
  del recordatorio de 48h.

### Templates (`lib/email/templates/`)

- `CourseReminderEmail.tsx` — recordatorio 48h antes de la primera
  sesión del curso. Datos: nombre, curso, fecha+hora formateada en
  America/Santiago, sede + dirección si está rellena, enlace a
  `/my-courses`. Incluye el "qué llevar" estándar (10 min antes,
  documento, ropa de taller).
- `DiplomaFailedEmail.tsx` — al cerrar el curso si el alumno no
  aprobó. Distingue 3 motivos (`attendance` / `evaluation` / `both`)
  con copy específico para cada uno; muestra nota final y % asistencia
  reales. Tono neutral, invitando a reinscribirse en próxima cohorte.
- `PaymentReceiptEmail.tsx` — recibo formal con datos contables. Ojo:
  **es un email distinto al `EnrollmentConfirmationEmail`** que ya
  existía. El confirmation es UX ("ya estás dentro"); el receipt es
  contable ("aquí está tu comprobante con datos formales SES, RUT
  empleador si SENCE, pensado para imprimir/archivar").

### Cron (`/api/cron/course-reminders/route.ts`)

Ejecución horaria (cron `0 * * * *` en `vercel.json`):
- Busca `CourseSession` con `sessionNumber=1`, `reminderSentAt=null` y
  `startsAt` en ventana [now+46h, now+50h].
- Por qué la ventana ±2h: el cron corre cada hora, así garantizamos
  cobertura aunque algún tick se retrase, sin riesgo de doble envío
  (lo previene el flag `reminderSentAt`).
- Para cada sesión, manda emails a todos los enrollments CONFIRMED
  con `pLimit(5)` para no saturar Resend.
- Sella `reminderSentAt` aunque algún email individual falle —
  preferimos perder 1-2 emails (que quedan en Sentry para retrigger
  manual) a duplicarlos.

### Cableado de los otros 2

- **`saveEvaluationsAction`** (`app/(app)/instructor/actions.ts`):
  acumula `failedToNotify` durante la transacción y, FUERA de ella,
  manda `DiplomaFailedEmail` en paralelo (best-effort). Solo notifica
  a alumnos que pasan AHORA a FAILED — re-evaluaciones repetidas no
  vuelven a spam-ear.
- **Webhook `/api/payments/webhook`**: tras crear el Payment, manda
  `EnrollmentConfirmationEmail` y `PaymentReceiptEmail` en paralelo
  (best-effort). El receipt incluye `employerName` y `employerRut` si
  la inscripción usó SENCE.

### Variables de entorno

Añadidas en `lib/env.ts` y `.env.example`:
- `SES_LEGAL_NAME` — razón social que aparece en el recibo. Default
  `"SecuritasEtSalus SpA"` para entornos pre-launch.
- `SES_LEGAL_RUT` — RUT formal de la SpA. Si falta no se muestra (es
  opcional hasta que la empresa esté formalmente constituida).

## Decisiones técnicas

### Recibo separado del confirmation

Habría sido tentador unificar — un solo email con confirmación + datos
contables. La razón para separar:
- El confirmation tiene tono cálido, CTA visual, lo lees y archivas.
- El recibo es formal, datos para SENCE, lo imprime/forwarea a su
  contable. Distinto público objetivo (alumno vs RR.HH.), distinto
  uso. Mezclarlos los hace peor a ambos.

### Marcar `reminderSentAt` aunque fallen emails individuales

La alternativa (no marcar si hay errores) implica que el siguiente tick
del cron volvería a procesar la sesión y mandaría el email a todo el
mundo otra vez. Con SES de 12 alumnos el riesgo de spam si fallan 2
emails es 10 emails duplicados — peor que perder 2 emails que el
admin puede retrigger manualmente desde Sentry.

### `failedToNotify` por fuera de la transacción

Si Resend falla en medio de una transacción Prisma con `db.$transaction`
el commit se aborta y perdemos las evaluaciones. El email es
best-effort; la persistencia de la nota es prioritaria.

### `PendingEvaluationEmail` queda pendiente

Necesita el modelo de evaluaciones cruzadas G19 (alumno evalúa al
curso/instructor de forma anónima al cierre). Ese modelo está marcado
en `docs/phases.md` como `[PENDIENTE: definir formato exacto antes de
empezar]`. Sin ese modelo no hay nada que recordar — cuando se
implemente, el email es trivial.

## Cómo probar localmente

### CourseReminderEmail
1. En BD, edita una `CourseSession` con `sessionNumber=1` para que
   `startsAt` caiga en ~48h y `reminderSentAt=null`.
2. Asegura que hay enrollments CONFIRMED en ese curso.
3. `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/course-reminders`.
4. Comprueba que llegan los emails (o aparecen en logs de dev si
   Resend no está configurado).

### DiplomaFailedEmail
1. Como instructor, abre la evaluación del curso.
2. Asigna notas que no aprueben (≥3.0 / 7.0 con asistencia OK).
3. Guarda — el alumno recibe el email con `reason='evaluation'`.

### PaymentReceiptEmail
1. Stripe CLI listening (ver phase-4-done.md).
2. Inscríbete a un curso y paga con tarjeta test.
3. Llegan dos emails: confirmation + receipt. El receipt lleva el
   "Comprobante #" con los últimos 10 chars del enrollmentId.

## Pendiente / deuda

- `PendingEvaluationEmail` + cron `pending-evaluations` — depende del
  diseño de evaluaciones cruzadas G19.
- Tests del cron `course-reminders` (mock de Prisma + Resend).
- Tests de los wrappers de email (los templates no necesitan tests —
  son JSX/HTML).

## Checklist de cierre

- [x] Código en main y revisado
- [x] Sin errores TypeScript ni lint
- [x] Tests pasan (129 unit)
- [x] Variables nuevas documentadas en `.env.example`
- [x] `docs/phases/phase-7-done.md` creado
- [x] `docs/phases.md` actualizado
- [x] `vercel.json` con el nuevo cron schedule
