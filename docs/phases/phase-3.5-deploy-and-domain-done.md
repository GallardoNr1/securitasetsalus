# Fase 3.5 — Deploy, dominio y servicios externos (puente Fase 3 → Fase 4)

**Cierre:** 2026-04-29.
**Estado:** ✅ completada.

## Por qué es una fase 3.5 y no parte de Fase 4

Fase 4 son **pagos con Stripe** y depende de la SpA chilena (RUT empresarial). Mientras eso no llega, no podemos avanzar funcionalmente — pero sí podemos sacar SES de localhost y dejar la infraestructura lista. Esta "media fase" hace exactamente eso: sin código nuevo de producto, todo es plumbing de servicios externos.

Lo que aporta:
- Sitio público accesible en https://securitasetsalus.vercel.app y, en breve, en https://securitasetsalus.cl.
- Cuentas reales y activas en Cloudflare, Resend, R2 y Supabase nuevo.
- Magic link de Auth.js funcionando en producción (Resend operativo).
- Avatares operativos end-to-end (R2 operativo).
- Dos gotchas resueltos que dejaron a la app sin levantar (`AUTH_SECRET` y bug del AWS SDK) — ambos documentados aquí para que no vuelvan a costar 3 vueltas.

---

## 1. Compra del dominio y delegación a Cloudflare

### 1.1 NIC Chile

- **Dominio:** `securitasetsalus.cl`
- **Registrador:** NIC Chile (único registrador autorizado para `.cl`).
- **Dueño actual:** RUT personal del founder. Se transfiere a la SpA cuando esté constituida (sin cambio de DNS).
- **Renovación:** anual.

### 1.2 Delegación a Cloudflare

`.cl` no es transferible a otros registradores (NIC Chile mantiene el registro), pero **sí se puede delegar el DNS a Cloudflare** cambiando los nameservers en el panel NIC. Beneficio: tener Email Routing, analytics, CDN gratis.

**Pasos ejecutados:**
1. Crear zona `securitasetsalus.cl` en Cloudflare → Add a site → Free plan.
2. Cloudflare asigna un par de nameservers — en este proyecto: `meera.ns.cloudflare.com` + `joel.ns.cloudflare.com`.
3. NIC Chile → Mis dominios → securitasetsalus.cl → cambiar nameservers a esos dos.
4. Esperar propagación (en este proyecto fue <8 h, NIC suele tardar más que `.com`).
5. Verificar:
   ```bash
   nslookup -type=NS securitasetsalus.cl 8.8.8.8
   # → meera.ns.cloudflare.com + joel.ns.cloudflare.com
   ```

> **Gotcha:** durante varias horas el router casero seguía dando "Non-existent domain" porque tenía caché DNS propia. Consultar siempre contra `8.8.8.8` o `1.1.1.1` para diagnosticar propagación real.

### 1.3 Apuntar el dominio a Vercel

En Cloudflare DNS:

| Type | Name | Content | Proxy |
|---|---|---|---|
| `CNAME` | `@` | `cname.vercel-dns.com` | DNS only (gris) |
| `CNAME` | `www` | `cname.vercel-dns.com` | DNS only (gris) |

> **Importante:** la nube tiene que estar gris (DNS only), no naranja. Si está proxied, Vercel no puede emitir el certificado SSL.

> Cloudflare permite CNAME en `@` apex gracias a CNAME flattening — sin necesidad de hardcodear IPs.

---

## 2. Cloudflare Email Routing (`dev@securitasetsalus.cl` → Gmail)

Para recibir correos transaccionales de servicios (Resend, Sentry, R2 verifications, etc.) sin montar un servidor de correo. Free.

**Pasos ejecutados:**
1. Cloudflare → zona `securitasetsalus.cl` → Email → Email Routing → Get started.
2. Cloudflare añade automáticamente 3 MX (`route1/2/3.mx.cloudflare.net`) + un TXT SPF.
3. Destination addresses → añadir Gmail personal del founder → verificar enlace que llega al Gmail.
4. Routing rules → custom address `dev` → forward to Gmail.
5. Catch-all activado para que cualquier `*@securitasetsalus.cl` caiga en Gmail (útil cuando un servicio nos hace registrar `noreply@`, `admin@`, etc.).

**Resultado:** registramos cuentas externas con `dev@securitasetsalus.cl` y nos llega todo a Gmail.

---

## 3. Resend (envío de correos transaccionales)

### 3.1 Cuenta + dominio verificado

- Cuenta creada con `dev@securitasetsalus.cl`.
- Dominio `securitasetsalus.cl` verificado en Resend (región us-east-1, mismo continente que Supabase y Vercel).
- DNS records añadidos en Cloudflare (DKIM + SPF + DMARC en subdominio `send` para no chocar con el SPF de Email Routing en `@`).

### 3.2 API key

- Nombre: `securitasetsalus-prod`.
- Permission: Sending access.
- Domain: `securitasetsalus.cl`.

### 3.3 Variables

```
RESEND_API_KEY=re_...
EMAIL_FROM=SecuritasEtSalus <noreply@securitasetsalus.cl>
```

> **Nota:** `noreply@securitasetsalus.cl` no necesita ser un buzón real. El `From:` es solo texto. Lo que importa es que el dominio esté verificado en Resend (DKIM/SPF/DMARC) — eso autoriza el envío. Si alguien responde, va al catch-all de Cloudflare → Gmail.

---

## 4. Migración a nuevo proyecto Supabase

A mitad de Fase 3 se cambió de cuenta Supabase (de cuenta personal antigua a cuenta nueva con `dev@securitasetsalus.cl`). Esto requirió:

1. Crear proyecto Supabase nuevo en `aws-1-us-east-1`. ID: `tbuskfmnublyyvhhexmb` (sustituye al `odgushibbmhrpblifcfn` anterior, que ya no existe).
2. Actualizar `DATABASE_URL` y `DIRECT_URL` en `.env.local`.
3. Aplicar migraciones acumuladas:
   ```bash
   npx prisma generate
   npx prisma migrate deploy   # 3 migraciones: init, add_avatar_key, course_clavero_fields
   ```
4. Re-ejecutar seed: `npm run prisma:seed` → super admin `dev@securitasetsalus.cl`.

> **Aviso:** `prisma migrate deploy` aplica las migraciones existentes en orden. Es lo correcto para producción y para una BD vacía nueva. **No usar** `migrate dev` porque crea migraciones nuevas si detecta drift.

---

## 5. Despliegue en Vercel

### 5.1 Repo en GitHub

- Repo público en `GallardoNr1/securitasetsalus`.
- Rama `main` → producción.
- Build command (en `vercel.json`): `npm run typecheck && NODE_ENV=test npm test && npm run build`.

### 5.2 Conexión Vercel ↔ GitHub

- Proyecto `gallardonr1s-projects/securitasetsalus`.
- Cada push a `main` dispara un deploy.
- URL temporal: `https://securitasetsalus.vercel.app`.

### 5.3 Vercel CLI configurado

Tras `npx vercel link` el repo queda enlazado al proyecto. Útil para:
- `npx vercel ls` — listar deploys.
- `npx vercel logs <url>` — ver runtime logs en tiempo real.
- `npx vercel inspect <url>` — metadatos del deploy.

`.vercel/` ya en `.gitignore`.

---

## 6. Gotcha 1 — `NEXTAUTH_SECRET` no existe en Auth.js v5

### Síntoma

`/admin` devolvía 500 en producción. Cualquier ruta que llamara a `auth()` reventaba al intentar firmar/leer JWT.

### Causa raíz

Auth.js v5 (NextAuth v5) **renombró la variable**: lee `AUTH_SECRET`, no `NEXTAUTH_SECRET`. Lo confirma el código del paquete:

```js
// node_modules/@auth/core/lib/utils/env.js
const secret = envObject.AUTH_SECRET;
```

En desarrollo (`NODE_ENV !== 'production'`) Auth.js tolera la falta de secret y firma con un valor inseguro de fallback. En producción **lanza** y deja toda la aplicación en 500.

### Solución

Renombrar la variable en `.env.local`, `.env.example` y en Vercel:

```diff
- NEXTAUTH_SECRET=...
+ AUTH_SECRET=...
- NEXTAUTH_URL=...
+ AUTH_URL=... (opcional, en Vercel no se pone — se calcula)
```

**Documentado en `.env.example` con un comentario explícito** para que nadie vuelva a poner `NEXTAUTH_SECRET`.

---

## 7. Gotcha 2 — Bug ESM/CJS en AWS SDK 3.1036.0

### Síntoma

Tras arreglar el AUTH_SECRET, `/admin` seguía dando 500 con un nuevo error en runtime logs:

```
Failed to load external module @aws-sdk/client-s3:
Error [ERR_REQUIRE_ESM]: require() of ES Module
/var/task/node_modules/@nodable/entities/src/index.js
from /var/task/node_modules/@aws-sdk/xml-builder/dist-cjs/xml-parser.js not supported.
```

### Causa raíz

Cadena transitiva del SDK:
- `@aws-sdk/client-s3@3.1036.0` arrastra `@aws-sdk/xml-builder@3.972.20`.
- `@aws-sdk/xml-builder@3.972.20` declara dependencia de `@nodable/entities@2.1.0`.
- `@nodable/entities@2.1.0` es **ESM-only** (`"type": "module"` sin export CJS).
- `@aws-sdk/xml-builder` lo importa con `require()` desde su build CJS.
- En el runtime serverless de Vercel (Node 20), eso lanza `ERR_REQUIRE_ESM` y mata cualquier ruta que cargue el SDK.

**Por qué afectaba a `/admin`**: el `AppHeader.tsx` (en el layout del grupo `(app)`) importaba `isBucketConfigured` desde `@/lib/r2` para decidir si pedir el `avatarKey` del usuario. `lib/r2.ts` importaba `@aws-sdk/client-s3` → el SDK se cargaba en el bundle de TODAS las rutas del grupo (`/admin`, `/profile`, `/instructor`, `/dashboard`, ...).

### Solución

Separar la **configuración** (que solo lee env vars) de las **operaciones** (que usan el SDK):

- `lib/r2-config.ts` — `isR2Available`, `isBucketConfigured`, `bucketName`. **Sin imports del SDK.**
- `lib/r2.ts` — re-exporta los helpers de config + operaciones reales (`uploadBuffer`, `getSignedDownloadUrl`, `deleteObject`, `r2Keys`).

`AppHeader.tsx` y `app/(app)/profile/page.tsx` importan ahora desde `lib/r2-config`. El SDK solo se carga en:
- `app/(app)/profile/actions.ts` (server action, solo se ejecuta al subir avatar).
- `app/api/users/[id]/avatar/route.ts` (route handler aislado).

Ninguno de los dos afecta al render server-side de páginas.

### Por qué no se actualiza el SDK

La 3.1036.0 fue la última que probé. Bajar a una rama 3.700.x sin la dependencia rota es un fix válido pero arriesga otros breaking changes. Como el split funciona y el SDK solo se carga al subir avatar/diploma, dejamos el pin actual hasta que haya patch oficial.

> **Si en el futuro alguien "limpia" `lib/r2-config.ts` pensando que es duplicado, vuelve a romper /admin.** Hay un comentario explícito en el archivo explicando por qué existe.

---

## 8. R2 — un único bucket con prefijos

### Decisión vs el plan inicial

El plan original (en `docs/external-services.md`) era 4 buckets separados: `ses-avatars`, `ses-diplomas`, `ses-course-materials`, `ses-payment-receipts`.

**Decisión final:** un único bucket `securitas-et-salus` con prefijos:

```
securitas-et-salus/
├── avatars/{userId}/{timestamp}.{ext}
├── diplomas/{userId}/{diplomaId}.pdf
├── materials/{courseId}/{filename}
└── receipts/{userId}/{paymentId}.pdf
```

### Por qué

- Más simple de operar (un solo token API, un solo bucket en la UI).
- Cuenta como un solo bucket en el plan free de Cloudflare R2 (límite de 10 buckets).
- Mismo modelo que usa el repo hermano Clavero (`clavero-diplomas`).
- Las 4 vars `R2_BUCKET_NAME_*` siguen existiendo pero apuntan deliberadamente al mismo bucket. Permite separar buckets en el futuro sin tocar código si se justifica.

### Smoke test

Script `scripts/test-r2.ts` ejecutado en local: subió un archivo, firmó URL, descargó vía HTTPS, verificó contenido y borró. ✅ End-to-end OK.

---

## 9. Estado final de variables de entorno

### Configuradas y activas (Production en Vercel + `.env.local`)

```
NEXT_PUBLIC_APP_URL=https://securitasetsalus.cl
DATABASE_URL=postgresql://postgres.tbuskfmnublyyvhhexmb:...:6543/postgres
DIRECT_URL=postgresql://postgres.tbuskfmnublyyvhhexmb:...:5432/postgres
AUTH_SECRET=<32 bytes base64>
RESEND_API_KEY=re_...
EMAIL_FROM=SecuritasEtSalus <noreply@securitasetsalus.cl>
R2_ACCOUNT_ID=26cb0ab5d3ee3bf800b5ca1cc199ecc7
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME_AVATARS=securitas-et-salus
R2_BUCKET_NAME_DIPLOMAS=securitas-et-salus
R2_BUCKET_NAME_MATERIALS=securitas-et-salus
R2_BUCKET_NAME_RECEIPTS=securitas-et-salus
```

### Pendientes (vacías por ahora)

- `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_AUTH_TOKEN` — pendiente crear proyecto Sentry.
- `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY` + `STRIPE_WEBHOOK_SECRET` — Fase 4, bloqueado por SpA.
- `R2_PUBLIC_URL` — solo si activamos un bucket público.
- `CRON_SECRET` — Fase 7+.

### NO usar

- `NEXTAUTH_SECRET` (renombrado a `AUTH_SECRET`).
- `NEXTAUTH_URL` (renombrado a `AUTH_URL`, y en Vercel no se pone).

---

## 10. Lo que queda por delante

| Bloque | Estado | Bloqueado por |
|---|---|---|
| Sentry DSN + auth token | ⏳ pendiente | crear proyecto Sentry (15 min) |
| Apex `securitasetsalus.cl` activo (CNAMEs en Cloudflare) | ⏳ pendiente | acción manual |
| Fase 4 — pagos Stripe | ⏸️ esperando | SpA chilena |
| Fase 5 — asistencia + G19 + diplomas | 🟢 lista para arrancar | — (R2 operativo) |
| Fase 6 — verify público + integración Clavero | 🟢 lista para arrancar | — |
| Fase 7 — emails transaccionales | 🟢 lista para arrancar | — (Resend operativo) |

---

## 11. Cómo desplegar desde cero (runbook)

Para alguien que clona el repo y quiere replicar entorno:

```bash
git clone https://github.com/GallardoNr1/securitasetsalus.git
cd securitasetsalus
cp .env.example .env.local
# Rellenar .env.local con credenciales reales (ver sección 9)
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

Para producción nueva en Vercel:
1. `npx vercel link` apuntando al proyecto.
2. Pegar las vars de la sección 9 en Settings → Environment Variables (Production + Preview + Development).
3. `git push` → deploy automático.
4. En Cloudflare DNS, añadir CNAMEs `@` y `www` a `cname.vercel-dns.com` (DNS only).
5. En Vercel → Settings → Domains, añadir `securitasetsalus.cl` y `www.securitasetsalus.cl`.

---

## Verificación

```
✅ https://securitasetsalus.vercel.app/        → 200 (landing carga)
✅ https://securitasetsalus.vercel.app/login   → 200 (form visible)
✅ https://securitasetsalus.vercel.app/admin   → 307 (redirect a /login)
✅ Login local con dev@securitasetsalus.cl / Su121012se! entra a /admin
✅ Smoke test R2 end-to-end OK (scripts/test-r2.ts)
✅ Magic link Resend OK (entrega a Gmail)
```
