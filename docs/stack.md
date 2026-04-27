# Stack tecnológico — SecuritasEtSalus

## Principios de elección

- **Mismo stack que ClaveroCerrajero.** SES y Clavero comparten arquitectura y herramientas para reaprovechar conocimiento, design system y patrones probados. Lo único que cambia es el modelo de datos y la lógica de negocio.
- **Solidez sobre novedad** — tecnologías maduras con ecosistema amplio.
- **TypeScript en todo** — tipado estricto de principio a fin.
- **SCSS Modules para estilos** — control total, sin abstracciones que oculten el CSS real.
- **Escalable desde el día uno** — multirregión, multirol, volumen alto de usuarios.

---

## Frontend

### Next.js 16 + React 19 + TypeScript (App Router)

Misma versión que Clavero. Mismas razones:
- SSR y SSG nativos — SEO crítico para el catálogo público de cursos (`/cursos`, `/cursos/[slug]`).
- API Routes integradas.
- App Router con React Server Components.
- Turbopack estable por defecto.
- `next.config.ts` con `typedRoutes: true`, `reactStrictMode: true`, `poweredByHeader: false`, headers de seguridad.

**Breaking changes vs Next 14 que aplican:** `cookies()`, `headers()`, `params`, `searchParams` son asíncronos.

### SCSS Modules

Mismos motivos que en Clavero (control del CSS, scoping automático, sin Tailwind).

**Estructura idéntica:**
```
design-system/
  tokens/          → variables globales
  base/            → reset y estilos globales
  components/      → estilos de componentes compartidos
  layouts/         → estilos de layouts reutilizables
```

**Tokens que cambian respecto a Clavero:** la paleta de colores y posiblemente la tipografía. Ver [design-system.md](design-system.md).

### React Hook Form + Zod

Igual que Clavero. Schemas Zod compartidos cliente/servidor.

---

## Backend

### API Routes de Next.js

Suficiente para el volumen previsto. Mismo enfoque que Clavero.

### Prisma ORM 7

Mismo patrón:
- URL de conexión en `prisma.config.ts` (no en `schema.prisma`).
- `prisma-client-js` como generador.
- Migraciones versionadas en Git.

### NextAuth.js v5

- Sesiones JWT en cookies HttpOnly.
- **Providers:** Credentials (email/contraseña con bcrypt) **+ Magic Link** (vía Resend) desde el inicio. Magic Link reduce fricción para alumnos puntuales que no quieren recordar contraseña.
- JWT incluye `userId`, `role`, `region`.
- Middleware de Next.js protege rutas por rol.

---

## Base de datos

### PostgreSQL

Misma decisión que Clavero. Razones idénticas (tipos complejos, FTS, exportaciones).

### Supabase

PostgreSQL gestionado con backups automáticos. Plan Pro al arrancar.

**Importante:** SES y Clavero deben usar **proyectos Supabase distintos** (BDs separadas). Son entidades legales separadas y sus datos no se mezclan. La única comunicación entre ambas es vía API HTTP pública.

---

## Almacenamiento

### Cloudflare R2

Mismo motivo que Clavero (sin egress, API S3-compatible, CDN global).

**Buckets de SES:**
```
ses-diplomas/
  └── [userId]/
        └── [diplomaId].pdf

ses-course-materials/
  └── [courseId]/
        └── [archivo].pdf

ses-payment-receipts/
  └── [userId]/
        └── [paymentId].pdf
```

Accesos siempre vía URLs firmadas con expiración corta (15 min para diplomas, 24 h para material descargable).

---

## Pagos

### Stripe

Mismo patrón que Clavero, con dos diferencias clave:

1. **Pago lo inicia el alumno**, no el admin. Flujo `/cursos/[slug] → "Inscribirme y pagar" → Stripe Checkout`.
2. **Productos dinámicos**, no Price IDs hardcoded — el precio del curso vive en `Course.price` y se pasa a Stripe Checkout como `price_data` en cada sesión, no como `price` ID estático. Esto permite que el admin cree cursos nuevos con precios distintos sin tocar el catálogo de Stripe.

**Webhook único:** `checkout.session.completed` confirma la inscripción y la marca `CONFIRMED`. Patrón idempotente con `Payment.stripePaymentId` único.

**Moneda:** **CLP nativo en arranque** (SES solo opera en Chile en Fase 0). La columna `Course.currency` existe desde el día uno con `'CLP'` por defecto, y `price_data` dinámico en Stripe Checkout ya soporta cualquier moneda sin cambios. El día que SES escale a otro país basta con crear cursos con otra `currency`. **Multi-currency listo, no implementado.**

---

## Email

### Resend + React Email

Idéntico a Clavero. Plantillas en `lib/email/templates/`. Mismo helper `sendEmail`.

**Plantillas de SES (distintas de Clavero):**
- `WelcomeEmail` — al verificar email tras registro.
- `EmailVerification` — token de verificación.
- `PasswordReset` — recuperación de contraseña.
- `EnrollmentConfirmation` — pago confirmado, datos prácticos del curso.
- `CourseReminder` — 24-48h antes del primer día del curso.
- `DiplomaIssued` — diploma emitido + adjunto/enlace al PDF.
- `DiplomaFailed` — el alumno no alcanzó los requisitos del diploma.
- `PaymentReceipt` — recibo del pago.

---

## Infraestructura y DevOps

### Vercel

- Deploy automático desde Git (`main` → producción, `develop` → preview).
- Variables de entorno por entorno.
- Edge Functions para `/api/diplomas/[code]/verify` (consultable globalmente con baja latencia, igual que `/api/verify/[code]` en Clavero).

### Cloudflare

- DNS para el dominio de SES. Arranque con **`ses.agsint.cl`** (subdominio bajo el dominio actual de Clavero) hasta que la SpA esté constituida y se compre dominio propio.
- Protección DDoS, proxy.

### Sentry

Mismo patrón que Clavero v10 multi-runtime.

---

## Herramientas de desarrollo

| Herramienta | Uso |
|---|---|
| ESLint 10 | Linting con reglas TypeScript estrictas |
| Prettier | Formateo automático |
| Husky + lint-staged | Pre-commit hooks |
| Prisma Studio | Explorador visual de BD |
| Stripe CLI | Webhooks en local |
| Vitest 4 + @testing-library | Tests unitarios y de componentes |
| Playwright 1 | E2E |

---

## Estructura de carpetas

```
securitasetsalus/
├── app/                        # App Router de Next.js
│   ├── (public)/               # Landing, catálogo, verify
│   ├── (auth)/                 # Login, registro, password reset
│   ├── dashboard/              # Área del alumno
│   ├── admin/                  # Panel de administración
│   ├── instructor/             # Panel del instructor
│   └── api/                    # API Routes
├── components/
│   ├── ui/                     # Componentes de UI pura
│   └── features/               # Componentes de negocio
├── design-system/              # SCSS: tokens, base, componentes
├── lib/
│   ├── auth.ts                 # Configuración de NextAuth
│   ├── db.ts                   # Cliente Prisma (singleton)
│   ├── env.ts                  # Validación env vars con Zod
│   ├── r2.ts                   # Cliente R2
│   ├── stripe.ts               # Cliente Stripe
│   ├── resend.ts               # Cliente Resend
│   ├── enrollments.ts          # Lógica de inscripción + emisión de diplomas
│   ├── attendance.ts           # Lógica de asistencia + cálculo de % asistencia
│   └── diplomas.ts             # Generación de PDF + QR + verificación
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── prisma.config.ts
├── next.config.ts
├── docs/
└── public/
```

---

## Reutilización desde Clavero (qué se copia tal cual)

Al arrancar Fase 0, las siguientes piezas se copian desde el repo de Clavero y se adaptan mínimamente:

- `design-system/` entero (con paleta nueva).
- `lib/db.ts`, `lib/env.ts` (vars distintas).
- `lib/r2.ts`, `lib/stripe.ts`, `lib/resend.ts` (clients).
- `lib/email/send.ts`, `lib/email/client.ts`.
- `lib/regions.ts` (ISO 3166-2 LATAM, sin cambios).
- `lib/tokens.ts` (password reset + email verification).
- `lib/validations/auth.ts` (login/register/password schemas).
- Configs: `vitest.config.ts`, `playwright.config.ts`, `next.config.ts` (headers de seguridad), `tsconfig.json`, `eslintrc`, `prettierrc`, `vercel.json` (build gateado por tests).
- `test/setup.ts`.
- Patrón de `lib/auth.ts` con NextAuth v5 (ajustado a roles SES).
- Estructura de directorios y convenciones.

Lo que **no se copia** porque es específico de Clavero:
- Modelo Prisma de Diploma con caducidad.
- Lógica de directorio público y perfiles.
- `lib/gov-export.ts`.
- Cron de vencimientos.
- Sistema de reclamaciones.
- Emails específicos de renovación / vencimiento.
