# Infraestructura — SecuritasEtSalus

## Visión general

```
Usuario
  └── Cloudflare (DNS + CDN + protección DDoS)
        └── Vercel (frontend + API Routes Next.js)
              ├── Supabase (PostgreSQL — proyecto SES, distinto del de Clavero)
              ├── Cloudflare R2 (diplomas PDF, material de curso, recibos)
              ├── Stripe (pagos y webhooks)
              ├── Resend (emails transaccionales)
              └── Sentry (errores y trazas)
```

**Importante:** SES y Clavero comparten arquitectura pero **no comparten infraestructura**. Cuentas separadas en cada proveedor (Supabase, R2 buckets distintos, proyecto Vercel propio, cuenta Stripe propia, Sentry propio). La única comunicación entre ambas plataformas es vía HTTPS pública.

---

## Entornos

| Entorno | Descripción | Rama Git |
|---|---|---|
| `development` | Local en la máquina del desarrollador | `feature/*` |
| `staging` | Preview automático en Vercel | `develop` |
| `production` | Dominio definitivo de SES | `main` |

Cada entorno tiene su propia BD y sus propias claves de Stripe (test / live).

---

## Hosting — Vercel

- **Plan:** Pro (variables por entorno, logs avanzados, protección de ramas).
- **Deploy automático:** push a `main` → producción; push a `develop` → preview URL única.
- **Edge Functions:** se usan para `/api/diplomas/[code]/verify` (consulta global con baja latencia, especialmente útil porque Clavero llamará a este endpoint desde sus regiones).
- **Build gateado por tests:** mismo patrón que Clavero — `buildCommand` ejecuta `typecheck + unit tests` con `NODE_ENV=test` antes de buildear.
- **Dominio:** arranque con **`ses.agsint.cl`** (subdominio temporal bajo el dominio que ya gestiona el founder). Migración a dominio propio cuando la SpA esté constituida y se compre — candidatos: `securitasetsalus.cl`, `securitas-et-salus.com`. La migración es de ~15 min (ver [deployment.md](deployment.md)).

---

## Base de datos — PostgreSQL

**Supabase (proyecto SES)**
- PostgreSQL gestionado.
- Backups automáticos diarios, retención 30 días.
- Pool de transacciones para serverless (puerto 6543).
- `DIRECT_URL` para migraciones (puerto 5432).
- Región: **`us-east-1` (Virginia)** — elegida por mejor latencia hacia LATAM (~80ms a Chile vs ~150ms desde eu-west-1). Asume deuda operativa de gestionar dos regiones (Clavero está en eu-west-1) a cambio de experiencia más rápida para los alumnos.

### Backups
- Backup automático diario en Supabase.
- Backup manual antes de cada migración importante.
- Retención: 30 días.

---

## Almacenamiento — Cloudflare R2

```
ses-diplomas/                # PDFs de diplomas emitidos
  └── [userId]/
        └── [diplomaId].pdf

ses-course-materials/         # Material descargable post-pago
  └── [courseId]/
        └── [archivo].pdf

ses-payment-receipts/         # Recibos de pago en PDF
  └── [userId]/
        └── [paymentId].pdf
```

**Acceso:**
- Diplomas: URLs firmadas con expiración de 15 min.
- Material de curso: URLs firmadas con expiración de 24 h (más amable para el alumno que descarga varias veces).
- Recibos: URLs firmadas con expiración de 1 h.
- Nunca URLs públicas directas a archivos.

---

## Pagos — Stripe

### Modelo de productos

A diferencia de Clavero (Price IDs hardcoded), SES usa **`price_data` dinámico** en cada Stripe Checkout Session porque el catálogo de cursos es variable. Esto además deja la **multi-currency lista sin esfuerzo extra**: `currency` se lee de `Course.currency` en cada sesión, y aunque por ahora todos los cursos sean CLP, el día que entre otro país basta con crear cursos con otra moneda:

```ts
// Pseudocódigo en /api/enrollments/checkout
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [{
    price_data: {
      currency: course.currency.toLowerCase(),  // p. ej. 'clp'
      unit_amount: course.price,                // en la unidad mínima (CLP es zero-decimal)
      product_data: {
        name: course.title,
        description: course.shortDescription,
      },
    },
    quantity: 1,
  }],
  metadata: {
    enrollmentId: enrollment.id,
    userId: user.id,
    courseId: course.id,
    type: 'COURSE_ENROLLMENT',
  },
  success_url: `${appUrl}/dashboard?enrollment=success`,
  cancel_url: `${appUrl}/cursos/${course.slug}?cancelled=true`,
});
```

### Flujo de pago

```
Alumno pulsa "Inscribirme y pagar"
→ POST /api/enrollments/checkout
   - Verifica que el alumno esté logueado y tenga email verificado
   - Verifica que haya cupos en el curso
   - Crea Enrollment con status=PENDING_PAYMENT
   - Crea Stripe Checkout Session con price_data dinámico
→ Redirige al alumno a checkout.stripe.com
→ Stripe llama a POST /api/payments/webhook con checkout.session.completed
   - Verifica firma con STRIPE_WEBHOOK_SECRET
   - Lee metadata.enrollmentId
   - Si Payment con ese stripePaymentId ya existe → idempotente, devuelve 200
   - Si no → marca Enrollment como CONFIRMED, crea Payment, dispara email
```

### Variables de entorno

```
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
```

(No hace falta `STRIPE_*_PRICE_ID` — los precios son dinámicos por curso.)

### Reembolsos

Política escalonada por antelación al primer día del curso:

| Antelación | Reembolso |
|---|---|
| ≥ 28 días | 100% |
| 28 – 14 días | 75% |
| 14 – 4 días | 50% |
| 96 – 48 h | 25% |
| < 48 h o no asiste | 0% |

Política más generosa que la propuesta inicial — los cursos presenciales se planifican con bastante antelación y dar margen de cancelación al alumno reduce fricción de inscripción.

Si **SES** cancela el curso (cupo insuficiente, indisponibilidad del instructor, fuerza mayor), el alumno recibe **siempre el 100%** o crédito para otro curso a su elección, independientemente de la fecha.

El webhook maneja `charge.refunded` para reflejar el estado en BD y liberar el cupo del curso.

---

## OTEC SENCE

SES se registra como **OTEC** (Organismo Técnico de Capacitación) ante el SENCE chileno desde el inicio. Esto permite que cursos elegibles puedan acogerse a la **franquicia tributaria SENCE**, donde un empleador puede descontar el coste del curso de sus impuestos cuando capacita a sus empleados.

### Implicaciones técnicas

- Cada `Course` lleva el flag `senceEligible: boolean`. Solo los cursos con este flag muestran la opción "Aplicar franquicia SENCE" en el checkout.
- En el flujo de checkout, si el alumno marca "Aplicar SENCE":
  - Se solicitan datos extra: RUT del alumno, RUT del empleador, datos de contacto del DRH.
  - Se almacenan en `Enrollment.senceUsed = true` y `Enrollment.employerRut`.
  - Tras el curso, SES emite el **Certificado SENCE** además del diploma normal — formato oficial del SENCE con datos del curso, alumno, empresa y horas.
- SES debe mantener la **comunicación electrónica con SENCE** (envío de listados de inscripción, asistencia y término de cursos) para los cursos con franquicia. Esto implica:
  - Identificación del curso ante SENCE (código de curso autorizado).
  - Plazos de notificación al SENCE (antes del inicio, durante, al finalizar).
  - Formatos específicos de archivos (`.txt` con estructura SENCE).

### Implicaciones administrativas (no son código pero condicionan el lanzamiento)

- Constitución de la SpA chilena.
- Inscripción como OTEC ante SENCE (papeleo + auditoría inicial).
- Acreditación de cursos individuales ante SENCE (cada curso debe estar autorizado para que pueda acogerse a franquicia).
- Cuenta bancaria empresarial para recibir transferencias.

**Estado:** trámites administrativos en paralelo al desarrollo. La plataforma puede lanzarse sin SENCE activo y activar el flag `senceEligible` cuando llegue la autorización por curso.

---

## Autenticación — NextAuth.js

### Providers
- **Credentials** (email + contraseña hasheada con bcrypt 12 rondas).
- **Magic Link** (vía Resend) — desde el inicio. Reduce fricción para alumnos puntuales que no quieren recordar contraseña.

### Sesiones
- JWT en cookie HttpOnly.
- JWT incluye: `userId`, `role`, `region`.
- Expiración: 24 h con renovación automática.

### Email verification (obligatoria)

Mismo patrón que Clavero (Phase 9): el alumno se registra → recibe email con token → al hacer clic, queda verificado y puede inscribirse en cursos. Los `INSTRUCTOR` y `SUPER_ADMIN` creados manualmente quedan pre-verificados.

---

## Emails — Resend

Plantillas (React Email) en `lib/email/templates/`:

| Evento | Email enviado |
|---|---|
| Registro completado (verificación) | Token de verificación (24 h) |
| Email verificado | Bienvenida + cómo navegar el catálogo |
| Inscripción a curso confirmada (post-pago) | Datos prácticos: sede, fechas, qué llevar |
| 48 h antes del primer día del curso | Recordatorio + recordatorio de qué llevar |
| Diploma emitido | Adjunto/enlace al PDF + código de verificación |
| No alcanzó requisitos del diploma | Notificación con motivo (asistencia/nota) |
| Pago confirmado | Recibo |
| Recuperación de contraseña | Token de reset |

### Variables de entorno

```
RESEND_API_KEY
EMAIL_FROM=noreply@ses.agsint.cl  # arranque con subdominio agsint, migrar al dominio propio cuando esté la SpA
```

### DMARC + DKIM + SPF

Recomendado configurar en DNS antes de salir a alumnos reales (mismo problema que Clavero — dominio nuevo cae en spam sin estos registros).

---

## Variables de entorno completas (.env.example)

```bash
# Base de datos (Supabase — proyecto SES)
DATABASE_URL=
DIRECT_URL=

# NextAuth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME_DIPLOMAS=ses-diplomas
R2_BUCKET_NAME_MATERIALS=ses-course-materials
R2_BUCKET_NAME_RECEIPTS=ses-payment-receipts

# Email
RESEND_API_KEY=
EMAIL_FROM=

# Sentry
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Seguridad

- HTTPS forzado por Cloudflare.
- Headers de seguridad en `next.config.ts` (HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, CSP).
- Rate limiting en endpoints sensibles: `/api/auth/*`, `/api/enrollments/checkout`, `/api/diplomas/[code]/verify` (implementación apuntada para Fase 9, alineada con el roadmap de Clavero).
- Webhooks de Stripe verifican firma criptográfica.
- Bcrypt 12 rondas para passwords.
- Datos sensibles en logs nunca (mismas reglas que Clavero).

---

## Escalabilidad

Misma arquitectura que Clavero, escalable a múltiples países:
- Campo `region` en `User` y `Course` permite filtrar por país.
- `REGION_ADMIN` se asignan por país (cuando arranque el modelo multipaís).
- Stripe acepta múltiples monedas — `price_data.currency` es por curso, no por plataforma.
- R2 tiene distribución global por defecto vía Cloudflare CDN.

---

## Diferencias clave de infra respecto a Clavero

| Aspecto | Clavero | SES |
|---|---|---|
| Buckets R2 | 2 (diplomas, exports) | 3 (diplomas, materiales, recibos) |
| Stripe productos | 2 Price IDs hardcoded | `price_data` dinámico por curso |
| Webhooks Stripe | `checkout.session.completed` (RENEWAL + COURSE) | `checkout.session.completed` (COURSE_ENROLLMENT) + `charge.refunded` |
| Roles | 5 (incluye GOV_VIEWER) | 3-4 (SUPER_ADMIN, REGION_ADMIN opcional, INSTRUCTOR, STUDENT) |
| Cron | `check-expiring` (vencimientos diplomas) | `course-reminder` (recordatorio 48h antes del curso) |
| Endpoint público de verificación | Sí (`/api/verify/[code]`) | Sí (`/api/diplomas/[code]/verify`) — Clavero lo consume |
