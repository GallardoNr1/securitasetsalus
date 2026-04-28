# Servicios externos — SecuritasEtSalus

Inventario único de las cuentas, dominios y vars de entorno que necesita SES para funcionar en producción. Si te preguntas "¿dónde estaba la API key de Stripe?", "¿qué buckets tenía R2?" o "¿dónde se compró el dominio?", aquí está la respuesta.

## Categorías

```
A. INFRAESTRUCTURA   → Vercel + Supabase
B. STORAGE           → Cloudflare R2
C. DOMINIO Y EMAIL   → NIC Chile + Resend
D. PAGOS             → Stripe
E. OBSERVABILIDAD    → Sentry
```

---

## A. Infraestructura

### A1. Vercel (hosting)

**Para qué:** ejecuta Next.js (frontend + API routes + middleware) y emite SSL automático.

**Cuenta:** *[PENDIENTE: confirmar — personal o de la SpA cuando esté constituida]*.

**Plan recomendado:** Hobby (gratis) hasta que haya tráfico real; subir a Pro ($20/mes/usuario) cuando lance al piloto si necesitamos analytics avanzados o protección de ramas.

**Configuración necesaria al crear el proyecto:**
- Conectar repositorio GitHub `securitasetsalus`.
- Rama `main` → producción, `develop` → previews.
- Build command (ya en `vercel.json`): `npm run typecheck && NODE_ENV=test npm test && npm run build`.
- Variables de entorno (ver lista al final).

**Dominio:** se conecta tras compra en NIC Chile (ver C).

---

### A2. Supabase (base de datos PostgreSQL)

**Para qué:** Postgres gestionado para todas las tablas de Prisma (usuarios, cursos, sesiones, inscripciones, pagos, diplomas, etc.).

**Cuenta:** ✅ creada con cuenta personal de Moises.

**Proyecto SES:** ✅ `cegaqfnbkbbkaydojdlr` en región `aws-1-us-east-1`. Plan Free (8 GB).

**Conexión:** ya configurada vía `DATABASE_URL` (Transaction pooler, puerto 6543) y `DIRECT_URL` (Session pooler, puerto 5432). Vars en `.env.local`.

**Migraciones aplicadas:**
- `init` — 12 tablas base (User, Account, Session, VerificationToken, PasswordResetToken, EmailVerificationToken, Course, CourseSession, Enrollment, Attendance, Payment, Diploma).
- `add_avatar_key` — campo `User.avatarKey`.
- `course_clavero_fields` — campos `claveroSkillCode`, `claveroSkillSuffix`, `prerequisiteSkillCodes`, `includedKit`.

**Lo único pendiente:** transferir el proyecto a la organización de la SpA cuando esté constituida (el proyecto se mueve sin recrear BD).

---

## B. Storage

### B1. Cloudflare R2 (object storage)

**Para qué:** archivos privados servidos vía URLs firmadas con expiración corta. Cuatro buckets:

| Bucket | Contenido | Var de entorno |
|---|---|---|
| `ses-avatars` | Fotos de perfil (cropper de 512×512) | `R2_BUCKET_NAME_AVATARS` |
| `ses-diplomas` | PDFs de diplomas con QR | `R2_BUCKET_NAME_DIPLOMAS` |
| `ses-course-materials` | Material descargable post-pago | `R2_BUCKET_NAME_MATERIALS` |
| `ses-payment-receipts` | Recibos de pago en PDF | `R2_BUCKET_NAME_RECEIPTS` |

**Cuenta:** ❌ pendiente. Crear en [dash.cloudflare.com](https://dash.cloudflare.com) — gratis, pide tarjeta solo como verificación de identidad.

**Coste:** $0/mes hasta 10 GB de storage + egress ilimitado (gran diferenciador frente a S3).

**Pasos para activar:**
1. Crear cuenta Cloudflare.
2. Sidebar → R2 → Enable R2.
3. Crear los 4 buckets con los nombres de la tabla.
4. R2 → Manage R2 API Tokens → Create token con permisos Object Read & Write.
5. Apuntar Account ID, Access Key ID, Secret Access Key.
6. Pegar en `.env.local` (y luego en Vercel) las 6 vars: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` + 3 `R2_BUCKET_NAME_*` (ya en `.env.local` pero apuntando a vacío).

**No requiere DNS de Cloudflare.** R2 funciona con solo credenciales.

**Lo que se desbloquea al activarlo:**
- Avatares con foto subida (Fase 2 extra ya implementada).
- Diplomas PDF en R2 (Fase 5).
- Material descargable de cursos (Fase 8, diferida).

---

## C. Dominio y Email

### C1. NIC Chile (dominio `.cl`)

**Para qué:** registro oficial del dominio `securitasetsalus.cl`. Solo NIC Chile puede registrar `.cl`.

**Estado:** ❌ pendiente compra.

**Coste:** ~CLP 9.890/año, ~CLP 18.500 por 2 años (recomendado).

**Pasos:**
1. Ir a [nic.cl](https://www.nic.cl).
2. Buscar `securitasetsalus.cl`.
3. Comprar 2 años con RUT personal de Moises (transferible a la SpA después).
4. En NIC Chile → Mis dominios → Modificar Datos Técnicos → añadir DNS records:
   - `A` apuntando a `76.76.21.21` (Vercel).
   - `CNAME www` apuntando a `cname.vercel-dns.com`.

**DNS:** se gestiona en NIC Chile mismo (no se transfiere a Cloudflare). Si en el futuro necesitamos features de Cloudflare DNS (Email Routing, etc.), se cambian los nameservers — los `.cl` se quedan registrados en NIC sí o sí.

### C2. Cloudflare Registrar (`.com` defensivo, opcional)

**Para qué:** registrar `securitasetsalus.com` solo como reserva de marca, no se conecta a nada.

**Estado:** ❌ pendiente, opcional.

**Coste:** ~$10/año (precio al coste, sin markup).

**Pasos:**
1. Crear cuenta Cloudflare (la misma que para R2).
2. Cloudflare → Registrar → buscar `securitasetsalus.com` → comprar.
3. No se configura DNS — solo se posee.

### C3. Resend (email transaccional)

**Para qué:** envío de emails desde la app — verificación de email tras registro, magic link, password reset, en el futuro confirmaciones de inscripción y diplomas emitidos.

**Estado:** ❌ pendiente. Mientras tanto, todos los emails se loguean en la consola del dev server gracias al graceful fallback en `lib/email/client.ts`.

**Coste:** $0/mes hasta 3.000 emails/mes (más que suficiente para el piloto).

**Pasos:**
1. Crear cuenta en [resend.com](https://resend.com).
2. Domains → Add Domain → `ses.agsint.cl` (o `securitasetsalus.cl` cuando lo tengas).
3. Resend te da 3 registros DNS a poner en NIC Chile (DKIM/SPF/DMARC).
4. Pegar en NIC Chile → confirmar verificación en Resend.
5. API Keys → crear API Key con permiso "Sending access".
6. Pegar en `.env.local` y Vercel:
   - `RESEND_API_KEY`
   - `EMAIL_FROM='SecuritasEtSalus <noreply@securitasetsalus.cl>'`

**Lo que se desbloquea:**
- Verificación de email de los registros (Fase 2, ahora cae en consola).
- Magic link login (Fase 2, ahora cae en consola).
- Password reset (Fase 2, ahora cae en consola).
- Todos los emails transaccionales de Fase 7.

---

## D. Pagos

### D1. Stripe

**Para qué:** cobrar inscripciones a cursos. Activación tras Fase 4.

**Estado:** ❌ pendiente. Hay graceful fallback en `lib/stripe.ts` — sin claves, los flujos de pago se desactivan en la UI sin reventar.

**Bloqueo principal:** Stripe live mode requiere **RUT empresarial chileno**. Se puede usar test mode con cuenta personal mientras tanto.

**Coste:** $0/mes + 3,5% + 30 CLP por transacción de tarjeta chilena.

**Pasos cuando llegue Fase 4:**
1. Constituir SpA chilena (trámite legal).
2. Crear cuenta Stripe en [dashboard.stripe.com/register](https://dashboard.stripe.com/register) con datos de la SpA.
3. Empezar en test mode (no requiere completar info bancaria).
4. Crear webhook con URL `https://securitasetsalus.cl/api/payments/webhook` (cuando esté en producción).
5. Pegar `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` en `.env.local` y Vercel.

**Diferencia vs Clavero:** SES no usa `STRIPE_*_PRICE_ID` — los precios son `price_data` dinámico por curso (ver `lib/stripe.ts`).

---

## E. Observabilidad

### E1. Sentry (errores y trazas)

**Para qué:** capturar errores no manejados en runtime (frontend + server + edge) y trazas de performance.

**Estado:** ❌ pendiente. El SDK está integrado vía `instrumentation.ts` + 3 `sentry.*.config.ts`, pero sin DSN no envía nada (queda en consola).

**Coste:** $0/mes hasta 5.000 errores/mes (más que suficiente para el piloto).

**Pasos:**
1. Crear cuenta en [sentry.io](https://sentry.io).
2. Crear organización (puede compartir con Clavero o ser separada).
3. Crear proyecto **Next.js** llamado `securitasetsalus`.
4. Sentry te da el DSN.
5. Pegar en `.env.local` y Vercel:
   - `NEXT_PUBLIC_SENTRY_DSN=<dsn>`
   - `SENTRY_DSN=<mismo dsn>`
6. Para subir source maps en build: crear API token en Sentry → Internal Integrations → pegar como `SENTRY_AUTH_TOKEN` en Vercel.

**Smoke test tras conectar:** lanzar un error inducido en producción (`throw new Error('test sentry')` en una page → push) y verificar que aparece en el dashboard de Sentry.

---

## Mapa completo de variables de entorno

| Variable | Servicio | Estado | Bloquea |
|---|---|---|---|
| `DATABASE_URL` | Supabase | ✅ cableada | — |
| `DIRECT_URL` | Supabase | ✅ cableada | — |
| `NEXTAUTH_SECRET` | NextAuth | ✅ generada | — |
| `NEXTAUTH_URL` | NextAuth | ✅ `localhost:3000` (vacío en Vercel) | — |
| `NEXT_PUBLIC_APP_URL` | App | 🟡 `ses.agsint.cl` (cambiar a `securitasetsalus.cl`) | dominio |
| `R2_ACCOUNT_ID` | Cloudflare R2 | ❌ vacío | avatares con foto |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 | ❌ vacío | idem |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 | ❌ vacío | idem |
| `R2_BUCKET_NAME_AVATARS` | Cloudflare R2 | ✅ `ses-avatars` | (necesita las 3 anteriores) |
| `R2_BUCKET_NAME_DIPLOMAS` | Cloudflare R2 | ✅ `ses-diplomas` | Fase 5 |
| `R2_BUCKET_NAME_MATERIALS` | Cloudflare R2 | ✅ `ses-course-materials` | Fase 8 |
| `R2_BUCKET_NAME_RECEIPTS` | Cloudflare R2 | ✅ `ses-payment-receipts` | Fase 4 |
| `RESEND_API_KEY` | Resend | ❌ vacío | emails reales (verificación, magic link, reset) |
| `EMAIL_FROM` | Resend | 🟡 `noreply@ses.agsint.cl` (cambiar al dominio definitivo) | idem |
| `CRON_SECRET` | Vercel Cron | ❌ vacío | crons de Fase 5+ |
| `STRIPE_SECRET_KEY` | Stripe | ❌ vacío | Fase 4 |
| `STRIPE_PUBLISHABLE_KEY` | Stripe | ❌ vacío | Fase 4 |
| `STRIPE_WEBHOOK_SECRET` | Stripe | ❌ vacío | Fase 4 |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry | ❌ vacío | observabilidad en prod |
| `SENTRY_DSN` | Sentry | ❌ vacío | idem (server-side) |
| `SENTRY_AUTH_TOKEN` | Sentry | ❌ vacío | source maps en builds de Vercel |

---

## Orden recomendado de activación

```
1. Comprar securitasetsalus.cl (NIC Chile)         🔴 esta semana
   └─▶ Define el dominio que usarán Resend, Vercel y Sentry

2. Crear cuenta Cloudflare + activar R2            🟠 esta semana
   └─▶ Activa avatares con foto

3. Crear cuenta Vercel + conectar repo SES         🟠 esta semana
   └─▶ Tener producción accesible

4. Apuntar securitasetsalus.cl a Vercel            🟠 esta semana
   └─▶ Tras (1) + (3)

5. Crear cuenta Resend + verificar dominio         🟡 cuando puedas
   └─▶ Activa emails reales (auth + confirmaciones)

6. Crear proyecto Sentry + pegar DSN               🟡 esta semana
   └─▶ Capturar errores en prod antes del piloto

7. Stripe (cuenta SES propia)                      🟢 cuando llegue Fase 4
   └─▶ Bloqueado por SpA constituida
```

## Cómo me lo pasas tú

Cuando montes una de estas cuentas, simplemente me dices:
- "Tengo R2 → me pasas las 5 vars, las pego en `.env.local` y verificamos."
- "Compré `securitasetsalus.cl` → te paso por screen-share el panel y configuramos DNS."
- "Resend listo → me pasas la API key y el dominio verificado."

No necesito tener acceso directo a las cuentas. Las credenciales viajan por el chat y las pego yo en los archivos correctos.
