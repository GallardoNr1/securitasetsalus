# Servicios externos — SecuritasEtSalus

Inventario único de las cuentas, dominios y vars de entorno que usa SES en producción. Estado actualizado al 2026-04-29 tras Fase 3.5 (deploy y dominio).

> Para el detalle del proceso de configuración de cada servicio, ver `docs/phases/phase-3.5-deploy-and-domain-done.md`.

## Categorías

```
A. INFRAESTRUCTURA   → Vercel + Supabase
B. STORAGE           → Cloudflare R2
C. DOMINIO Y EMAIL   → NIC Chile + Cloudflare DNS + Email Routing + Resend
D. PAGOS             → Stripe
E. OBSERVABILIDAD    → Sentry
```

---

## A. Infraestructura

### A1. Vercel (hosting)

**Estado:** ✅ activo en `https://securitasetsalus.vercel.app`. Apex `securitasetsalus.cl` pendiente de añadir CNAMEs.

**Cuenta:** `gallardonr1s-projects` (cuenta personal del founder).

**Plan:** Hobby (gratis). Subir a Pro cuando haya tráfico real o necesitemos analytics avanzados.

**Configuración:**
- Repo conectado: `GallardoNr1/securitasetsalus`.
- Rama `main` → producción.
- Build command (en `vercel.json`): `npm run typecheck && NODE_ENV=test npm test && npm run build`.
- Variables de entorno: ver tabla al final.

**CLI enlazada:** sí. Comandos útiles:
```bash
npx vercel ls            # listar deploys
npx vercel logs <url>    # runtime logs en vivo
npx vercel inspect <url> # metadatos
```

---

### A2. Supabase (Postgres)

**Estado:** ✅ activo. Proyecto `tbuskfmnublyyvhhexmb` en `aws-1-us-east-1`.

**Cuenta:** asociada a `dev@securitasetsalus.cl`.

**Plan:** Free (8 GB).

**Conexión:** `DATABASE_URL` (pooled 6543) y `DIRECT_URL` (direct 5432).

**Migraciones aplicadas (3):**
- `init` — 12 tablas base.
- `add_avatar_key` — campo `User.avatarKey`.
- `course_clavero_fields` — flags SENCE + mapeo Clavero.

**Pendiente:** transferir el proyecto a la organización de la SpA cuando esté constituida.

---

## B. Storage

### B1. Cloudflare R2 (object storage)

**Estado:** ✅ activo. Smoke test end-to-end OK.

**Cuenta:** asociada al Cloudflare del founder. Account ID `26cb0ab5d3ee3bf800b5ca1cc199ecc7`.

**Plan:** Free (10 GB storage + egress ilimitado — el gran diferenciador frente a S3).

**Modelo de buckets:** **un único bucket `securitas-et-salus` con prefijos** (en lugar de cuatro buckets separados como se planteó inicialmente). Más simple, mismo modelo que Clavero. Detalle en `phase-3.5-deploy-and-domain-done.md` §8.

```
securitas-et-salus/
├── avatars/{userId}/{timestamp}.{ext}
├── diplomas/{userId}/{diplomaId}.pdf
├── materials/{courseId}/{filename}
└── receipts/{userId}/{paymentId}.pdf
```

Las 4 vars `R2_BUCKET_NAME_*` siguen existiendo pero apuntan al mismo bucket — preparado por si en el futuro se separan.

**Token API:** `securitasetsalus-prod` (Account Token, scope: bucket `securitas-et-salus`, permiso Object Read & Write, sin TTL).

**Smoke test:** `npx tsx --env-file=.env.local scripts/test-r2.ts`.

> **Atención:** el AWS SDK v3.1036.0 tiene un bug ESM/CJS con `@nodable/entities` — si tocas `lib/r2.ts` o `lib/r2-config.ts`, lee `phase-3.5-deploy-and-domain-done.md` §7 antes.

---

## C. Dominio y Email

### C1. NIC Chile (registro `.cl`)

**Estado:** ✅ comprado. Dominio `securitasetsalus.cl` registrado a nombre del founder.

**Renovación:** anual.

**DNS:** **delegado a Cloudflare**. Nameservers configurados en NIC: `meera.ns.cloudflare.com` + `joel.ns.cloudflare.com`.

> Recordatorio: `.cl` no es transferible a otros registradores. NIC siempre mantiene el registro, pero el DNS sí se delega.

### C2. Cloudflare DNS

**Estado:** ✅ zona `securitasetsalus.cl` activa.

**Registros gestionados:**
- 3× MX `route1/2/3.mx.cloudflare.net` (Email Routing).
- 1× TXT SPF para Email Routing en `@`.
- 3× registros DNS de Resend (DKIM/SPF/DMARC en subdominio `send`).
- ⏳ pendientes: 2× CNAME apuntando a Vercel (`@` y `www` → `cname.vercel-dns.com`, DNS only).

### C3. Cloudflare Email Routing

**Estado:** ✅ activo.

**Direcciones:**
- `dev@securitasetsalus.cl` → Gmail personal del founder (verified destination).
- Catch-all `*@securitasetsalus.cl` → mismo Gmail.

**Activity log:** Cloudflare → Email Routing → Activity log (cada email entrante con OK/error).

### C4. Resend (envío)

**Estado:** ✅ activo. Dominio verificado.

**Cuenta:** asociada a `dev@securitasetsalus.cl`.

**Plan:** Free (3.000 emails/mes).

**Región:** `us-east-1` (mismo continente que Supabase y Vercel).

**API key activa:** `securitasetsalus-prod` con permission Sending access.

**Variables:**
```
RESEND_API_KEY=re_...
EMAIL_FROM=SecuritasEtSalus <noreply@securitasetsalus.cl>
```

> `noreply@securitasetsalus.cl` no necesita ser un buzón real. El dominio verificado autoriza el envío. Las respuestas a `noreply@` caen en el catch-all → Gmail.

---

## D. Pagos

### D1. Stripe

**Estado:** ❌ pendiente. Bloqueado por SpA chilena (RUT empresarial requerido para live mode).

**Plan:** $0/mes + 3,5% + 30 CLP por transacción de tarjeta chilena.

**Mientras tanto:** graceful fallback en `lib/stripe.ts` — sin claves, los flujos de pago se desactivan en la UI sin reventar.

**Pasos cuando llegue Fase 4:**
1. Constituir SpA chilena.
2. Crear cuenta Stripe con datos de la SpA.
3. Empezar en test mode (no requiere completar info bancaria).
4. Crear webhook con URL `https://securitasetsalus.cl/api/payments/webhook`.
5. Pegar `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.

**Diferencia vs Clavero:** SES no usa `STRIPE_*_PRICE_ID` — los precios son `price_data` dinámico por curso.

---

## E. Observabilidad

### E1. Sentry

**Estado:** ⏳ SDK integrado y configurado pero sin DSN. Crear proyecto cuando convenga.

**Plan:** Free (5.000 errores/mes).

**Pasos:**
1. Crear cuenta en sentry.io con `dev@securitasetsalus.cl`.
2. Crear proyecto Next.js llamado `securitasetsalus`.
3. Copiar el DSN.
4. Pegar en Vercel:
   - `NEXT_PUBLIC_SENTRY_DSN=<dsn>`
5. (Opcional) Auth token para source maps en build:
   - `SENTRY_AUTH_TOKEN=<token>`

**Smoke test tras conectar:** lanzar un error inducido en producción (`throw new Error('test sentry')` en una page → push) y verificar que aparece en el dashboard.

---

## Mapa completo de variables de entorno

| Variable | Servicio | Estado | Notas |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | App | ✅ `https://securitasetsalus.cl` | |
| `DATABASE_URL` | Supabase | ✅ pooled 6543 | proyecto `tbuskfmnublyyvhhexmb` |
| `DIRECT_URL` | Supabase | ✅ direct 5432 | idem |
| `AUTH_SECRET` | Auth.js v5 | ✅ generado | **NO usar `NEXTAUTH_SECRET` — Auth.js v5 no la lee** |
| `AUTH_URL` | Auth.js v5 | 🟡 solo en local (`localhost:3000`) | en Vercel se calcula automáticamente |
| `RESEND_API_KEY` | Resend | ✅ activa | |
| `EMAIL_FROM` | Resend | ✅ `noreply@securitasetsalus.cl` | |
| `R2_ACCOUNT_ID` | Cloudflare R2 | ✅ `26cb0ab5...` | |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 | ✅ activa | |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 | ✅ activa | |
| `R2_BUCKET_NAME_AVATARS` | Cloudflare R2 | ✅ `securitas-et-salus` | bucket único, prefijo separa |
| `R2_BUCKET_NAME_DIPLOMAS` | Cloudflare R2 | ✅ `securitas-et-salus` | idem |
| `R2_BUCKET_NAME_MATERIALS` | Cloudflare R2 | ✅ `securitas-et-salus` | idem |
| `R2_BUCKET_NAME_RECEIPTS` | Cloudflare R2 | ✅ `securitas-et-salus` | idem |
| `R2_PUBLIC_URL` | Cloudflare R2 | ❌ vacío | solo si activamos bucket público |
| `STRIPE_SECRET_KEY` | Stripe | ❌ vacío | Fase 4, bloqueado por SpA |
| `STRIPE_PUBLISHABLE_KEY` | Stripe | ❌ vacío | idem |
| `STRIPE_WEBHOOK_SECRET` | Stripe | ❌ vacío | idem |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry | ❌ vacío | crear proyecto |
| `SENTRY_AUTH_TOKEN` | Sentry | ❌ vacío | opcional, source maps |
| `CRON_SECRET` | Vercel Cron | ❌ vacío | Fase 7+ |

> Variables que **NO** deben estar en Vercel: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `AUTH_URL`. Auth.js v5 las ignora o se autocalculan.

---

## Cómo me lo pasas tú

Cuando montes una cuenta nueva o renueves credenciales:
- "Tengo Sentry → te paso el DSN, lo pego en Vercel + .env.local."
- "Vino la SpA → te paso las claves Stripe."
- "Hay que rotar el token R2 → genero uno nuevo y te lo paso."

No necesito acceso directo a las cuentas. Las credenciales viajan por el chat y las pego en los archivos correctos + Vercel.
