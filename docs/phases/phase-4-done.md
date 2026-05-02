# Fase 4 — Inscripción pagada con Stripe + flujo SENCE + refunds

**Cierre:** 2026-05-02.
**Estado:** ✅ completada (modo test — falta activar live keys).

## Qué se construyó

Flujo end-to-end de inscripción del alumno: desde el botón en
`/courses/[slug]` hasta el diploma emitido. Cubre los tres caminos del
producto:

1. **Pago directo Stripe** — el alumno paga con tarjeta en Checkout.
2. **Franquicia SENCE** — el alumno declara empleador, el admin
   aprueba/rechaza, el pago lo gestiona la OTEC.
3. **Modo "sin Stripe"** — graceful fallback cuando `STRIPE_SECRET_KEY`
   está vacía (entornos pre-launch). La inscripción pasa directa a
   CONFIRMED al crearla.

### Migración de schema

`prisma/migrations/20260502140353_add_enrollment_fields/`:
- `EnrollmentStatus` ahora incluye `PENDING_SENCE_APPROVAL`.
- `Enrollment` añade `cancelledAt`, `cancelReason`, `senceRejectionReason`.

### Helpers de pagos (`lib/payments/`)

- `checkout.ts` — `createCheckoutSession()` envuelve Stripe con
  `price_data` dinámico por curso, `enrollmentId` en metadata para
  resolución vía webhook, expiración 60 min.
- `refunds.ts` — `computeRefundAmount()`, función pura con política
  escalonada (≥14d → 100%, 7-13d → 75%, 3-6d → 50%, 1-2d → 25%,
  <1d → 0%). Floor a la unidad mínima (CLP zero-decimal).

### Server actions

- `app/(public)/(with-header)/courses/[slug]/actions.ts` — `enrollAction`
  con pre-checks (sesión, email verificado, RUT si SENCE), capacidad
  contada en transacción, decisión del modo según flags.
- `app/(app)/admin/payments/actions.ts` — `approveSenceEnrollmentAction`
  y `rejectSenceEnrollmentAction` con safeguards de status y motivo
  obligatorio en rechazo.
- `app/(app)/billing/actions.ts` — `cancelEnrollmentAction` que llama
  Stripe refunds, actualiza Payment, libera cupo y dispara email.

### Webhook (`app/api/payments/webhook/route.ts`)

- Verificación de firma vía `parseWebhookEvent`.
- Eventos manejados:
  - `checkout.session.completed` → Enrollment CONFIRMED + crea Payment
    (idempotente vía `stripePaymentId UNIQUE`) + dispara email.
  - `charge.refunded` → marca Payment REFUNDED_FULL/PARTIAL.
- Idempotencia: si llega un evento duplicado, el constraint UNIQUE en
  Payment.stripePaymentId hace que la transacción falle y respondemos
  200 sin dobles efectos.
- Errores → 500 para que Stripe reintente.

### Páginas nuevas

- `/billing/success` — gracias por inscribirte (con variante `mode=no-stripe`).
- `/billing/cancelled` — pago cancelado, vuelve al curso.
- `/billing` — histórico del alumno con tabla + botón cancelar inline.
- `/admin/payments` — listado + filtros (q, status, senceUsed) +
  panel arriba con SENCE pendientes.

### Componentes

- `EnrollPanel` (client) en `/courses/[slug]` — reemplaza el botón
  estático. Cuatro estados: no logueado, lleno, email no verificado,
  formulario activo con checkbox SENCE opcional.
- `CancelButton` (client) en `/billing` — confirmación inline con
  motivo opcional.
- `SenceReviewPanel` (client) en `/admin/payments` — bloque por
  solicitud SENCE pendiente con botones Aprobar/Rechazar.

### Emails (`lib/email/templates/`)

4 templates nuevos con su wrapper en `lib/email/send.ts`:
- `EnrollmentConfirmationEmail` — al confirmar pago Stripe.
- `EnrollmentSenceApprovedEmail` — al aprobar admin.
- `EnrollmentSenceRejectedEmail` — al rechazar admin (con motivo).
- `CancelationRefundEmail` — al cancelar (con monto y tier).

`BaseLayout.tsx` extendido con `danger`/`dangerLight`/`dangerDark` en
la paleta de email.

### Cron

`/api/cron/enrollments-cleanup` (GET autenticado con `CRON_SECRET`):
- Limpia Enrollments en `PENDING_PAYMENT` con > 24h de antigüedad,
  pasándolos a CANCELLED.
- Programado en `vercel.json` para correr todos los días a las 03:00 UTC.

### Navegación

`AppNav` ahora muestra `/billing` para STUDENT y `/admin/payments`
para SUPER_ADMIN. El middleware (`auth.config.ts`) ya cubría las
rutas: `/billing` exige rol student/admin, `/admin/payments` cae bajo
`/admin` (solo SUPER_ADMIN).

## Decisiones técnicas

### `price_data` inline en lugar de Price IDs pre-creados

Stripe permite ambas. Elegimos `price_data` por curso porque cada
Course tiene su precio + moneda + título distintos y queremos evitar
sincronizar productos cada vez que el admin edita un curso. Coste:
no podemos usar Promotion Codes. Si los necesitamos en el futuro,
migrar a Prices será una tarea aislada.

### Capacidad: optimista, no pesimista

Aceptamos riesgo de overcap residual cuando dos clicks coinciden al
milisegundo. El cron de cleanup recupera cupos no consumados en 24h.
Para SES (~10 cupos por curso, baja concurrencia simultánea) este
trade-off es aceptable. Si en el futuro vemos overcaps reales, se
puede pasar a row-level lock con `SELECT ... FOR UPDATE`.

### `stripePaymentId = checkout_session_id`

Guardamos el ID de la Checkout Session (`cs_...`), no el
`payment_intent`. Razón: el webhook `checkout.session.completed` es
nuestro punto de entrada principal — usarlo como ID del Payment hace
trivial la idempotencia (UNIQUE constraint). Para refundear, hacemos
`stripe.checkout.sessions.retrieve` para sacar el `payment_intent` y
llamar a `refunds.create` contra él.

### SENCE no consume cupo de Stripe

Las solicitudes SENCE se crean directas como `PENDING_SENCE_APPROVAL`
sin pasar por Stripe Checkout. La idea es que el flujo de pago real
SENCE lo gestiona el empleador con la OTEC fuera de la plataforma; SES
solo necesita registrar el cupo y emitir el diploma cuando aplique. El
admin "aprueba" la solicitud y la pasa a CONFIRMED.

### Política de refund pública

Los porcentajes están alineados con prácticas OTEC chilenas y con la
Ley 19.496 (Derechos del Consumidor). Centralizados en
`lib/payments/refunds.ts` para que se puedan ajustar de un solo punto
si cambia la decisión de negocio.

## Tests

- `lib/payments/refunds.test.ts` — 14 tests sobre la función pura
  (5 tiers + redondeo + edge cases temporales).

Total suite: 53 (antes Fase 4) → **129 unit tests**.

E2E `e2e/full-flow.spec.ts` sigue pasando — cubre el flujo completo
asistencia → eval → diploma → verify, asumiendo enrollments seedeados.
Cuando se quiera cubrir el flujo de pago Stripe end-to-end con
Playwright, hace falta orquestar Stripe CLI dentro del harness — fuera
de scope de Fase 4.

## Variables de entorno añadidas

`.env.example`:
```
# Vercel inyecta estas via integración Upstash → Stripe usa estas
# para rate limiting (ya configurado en Fase 9 del backlog de calidad).
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Stripe — ya estaba en .env.example, ahora obligatorio rellenar al
# menos STRIPE_SECRET_KEY para activar el flujo de pago.
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...   # opcional para Fase 4
STRIPE_WEBHOOK_SECRET=whsec_...

# Cron jobs — ya existía pero ahora SE NECESITA en prod para el cleanup
# de PENDING_PAYMENT.
CRON_SECRET=...
```

## Cómo probar localmente

1. `STRIPE_SECRET_KEY=sk_test_...` en `.env.local`.
2. `npm run dev` y `npx stripe listen --forward-to http://localhost:3000/api/payments/webhook`.
3. Apuntar `STRIPE_WEBHOOK_SECRET` al `whsec_...` que imprime `stripe listen`.
4. Como alumno verificado, ir a un curso PUBLISHED → "Inscribirme y pagar".
5. Stripe Checkout en modo test → tarjeta `4242 4242 4242 4242` (CVC y fecha cualquiera futura).
6. Webhook llega → enrollment confirmada en `/my-courses` y `/billing`.
7. Cancelar desde `/billing` → comprobar que el reembolso refleja el tier correcto.

## Pendiente / deuda

- **Tests del flujo Stripe end-to-end** (mocking `enrollAction`,
  webhook, refunds). La función pura `computeRefundAmount` ya tiene 14
  tests. Los wrappers con auth + Prisma quedan abiertos en el item 9
  del backlog de calidad.
- **Activar live keys** cuando la SpA tenga factura chilena verificada.
  El código no requiere cambios — solo intercambiar `sk_test_*` por
  `sk_live_*` en Vercel.
- **Promotion codes / cupones**. No soportado con `price_data` inline.
  Si se necesita, requiere migrar a Prices pre-creados.

## Checklist de cierre

- [x] Código en main y revisado
- [x] Sin errores TypeScript ni lint
- [x] Tests pasan (129 unit)
- [x] Variables nuevas documentadas en `.env.example`
- [x] `docs/phases/phase-4-done.md` creado
- [x] `docs/phases.md` actualizado
- [x] `vercel.json` con cron del cleanup
