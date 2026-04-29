# Despliegue y dominio — SecuritasEtSalus

Documentación operativa sobre dónde vive SES en producción, cómo está configurado el dominio y qué variables de entorno necesita cada servicio.

> Para el chronicle del primer deploy y los gotchas que aparecieron por el camino, ver `docs/phases/phase-3.5-deploy-and-domain-done.md`.

## URL de producción

**Dominio definitivo:** `https://securitasetsalus.cl` (registrado en NIC Chile, DNS delegado a Cloudflare).

**URL temporal de Vercel siempre activa:** `https://securitasetsalus.vercel.app`.

**Estado al 2026-04-29:** la URL `vercel.app` funciona. El apex `securitasetsalus.cl` espera a que se añadan los CNAMEs en Cloudflare apuntando a `cname.vercel-dns.com`.

---

## Arquitectura de hosting

```
┌─────────────┐         ┌──────────────┐        ┌─────────────┐
│   Browser   │───DNS──▶│  Cloudflare  │───────▶│   Vercel    │
│             │         │ (DNS + Email)│  CNAME │  (Next.js)  │
└─────────────┘         └──────────────┘        └─────────────┘
                                                       │
                             ┌─────────────────────────┼─────────────────┬───────────┐
                             │                         │                 │           │
                             ▼                         ▼                 ▼           ▼
                      ┌──────────────┐          ┌────────────┐    ┌────────────┐ ┌────────┐
                      │  Supabase    │          │ Cloudflare │    │  Resend    │ │ Stripe │
                      │ (Postgres)   │          │     R2     │    │            │ │ (later)│
                      └──────────────┘          └────────────┘    └────────────┘ └────────┘
```

### Responsabilidades por capa

| Servicio | Qué hace |
|---|---|
| **NIC Chile** | Registro `.cl`. DNS delegado a Cloudflare (nameservers `meera.ns.cloudflare.com` + `joel.ns.cloudflare.com`). |
| **Cloudflare DNS** | Gestión de registros del dominio. CNAMEs apuntan al sitio de Vercel. |
| **Cloudflare Email Routing** | Forward de `dev@securitasetsalus.cl` y catch-all → Gmail personal. |
| **Vercel** | Ejecuta Next.js, API routes, middleware. Emite SSL. Despliegue continuo desde GitHub. |
| **Supabase** | Postgres SES (proyecto `tbuskfmnublyyvhhexmb`). |
| **Cloudflare R2** | Un bucket único `securitas-et-salus` con prefijos `avatars/`, `diplomas/`, `materials/`, `receipts/`. |
| **Resend** | Envío transaccional de emails. Dominio verificado en Resend. |
| **Stripe** | **Cuenta propia de SES** (Fase 4, bloqueada por SpA chilena). |
| **Sentry** | SDK integrado, DSN pendiente. |

---

## Cómo conectar el dominio (procedimiento)

### En Cloudflare → DNS

| Type | Name | Content | Proxy status | TTL |
|---|---|---|---|---|
| `CNAME` | `@` | `cname.vercel-dns.com` | **DNS only** (gris) | Auto |
| `CNAME` | `www` | `cname.vercel-dns.com` | **DNS only** (gris) | Auto |

> **Importante:** la nube tiene que estar gris (DNS only), no naranja (proxied). Si está proxied, Vercel no puede emitir el certificado SSL.

> Cloudflare permite CNAME en `@` apex gracias a CNAME flattening — sin necesidad de hardcodear IPs de Vercel.

### En Vercel → Settings → Domains

1. Añadir `securitasetsalus.cl` → Add.
2. Añadir `www.securitasetsalus.cl` → Add.
3. Vercel detecta los CNAMEs en 1-3 min y emite el SSL (Let's Encrypt) automáticamente.
4. Marcar `securitasetsalus.cl` como Primary.

---

## Variables de entorno en Vercel

Para producción funcional, estas vars deben estar en Vercel (Settings → Environment Variables, en Production + Preview + Development).

> Para la lista completa con estado y notas, ver `docs/external-services.md`. Aquí solo los gotchas más comunes.

### Obligatorias para que la app levante

| Variable | Notas |
|---|---|
| `DATABASE_URL` | Supabase pooled (puerto 6543) |
| `DIRECT_URL` | Supabase direct (puerto 5432) |
| `AUTH_SECRET` | **Auth.js v5 lee `AUTH_SECRET`, NO `NEXTAUTH_SECRET`** |
| `NEXT_PUBLIC_APP_URL` | URL pública del sitio |
| `EMAIL_FROM` | Lo lee el provider Resend al inicializar |

### Storage (R2)

Las 6 vars de R2 (3 credenciales + 3 nombres de bucket que apuntan al mismo `securitas-et-salus`) son **obligatorias** porque el código lee `BUCKET_ENV_VARS` al cargar `lib/r2-config.ts`. Sin las 4 `R2_BUCKET_NAME_*`, `isBucketConfigured(...)` devuelve `false` y los avatares no se cargan.

### Pagos (Stripe)

`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`. Vacíos hasta Fase 4 — la app levanta igual gracias a `lib/stripe.ts` (graceful fallback).

(No hay `STRIPE_*_PRICE_ID` en SES — los precios son dinámicos por curso.)

### Variables que **NO** deben estar en Vercel

- `NEXTAUTH_SECRET` — Auth.js v5 ya no la lee. Borrar si existe.
- `NEXTAUTH_URL` / `AUTH_URL` — Vercel calcula la URL sola con `x-forwarded-host`. Si la pones apuntando a `localhost`, rompes los redirects post-login.

---

## Deploy continuo

| Rama | Despliegue |
|---|---|
| `main` | Producción (URL definitiva) |
| Cualquier otra | Preview URL única por commit |

Workflow típico:
1. Trabajas en `develop` (o feature branch).
2. Push → Vercel genera preview URL.
3. Pruebas en esa preview.
4. Merge a `main` → producción despliega sola.
5. Verificas en `securitasetsalus.cl`.

**Build gateado por tests:** el `buildCommand` de `vercel.json` ejecuta `typecheck + unit tests` con `NODE_ENV=test` antes de buildear. Si fallan, el deploy se aborta. Mismo patrón que Clavero.

---

## Vercel CLI

Repo enlazado tras `npx vercel link`. Útil para:

```bash
npx vercel ls                      # listar deploys recientes
npx vercel logs <url>              # runtime logs en vivo
npx vercel inspect <url>           # metadatos del deploy
npx vercel env pull .env.local     # bajar todas las env vars de Vercel a local (si conviene)
```

---

## Bug del AWS SDK — leer antes de tocar `lib/r2*.ts`

El SDK `@aws-sdk/client-s3@3.1036.0` arrastra `@nodable/entities@2.1.0` (ESM-only) que su propio `xml-builder` importa con `require()`. En el runtime serverless de Vercel eso lanza `ERR_REQUIRE_ESM` y mata cualquier ruta que cargue el SDK.

**Mitigación:** los helpers de configuración de R2 viven en `lib/r2-config.ts` (sin imports del SDK). `AppHeader.tsx` y `app/(app)/profile/page.tsx` solo importan de ahí. `lib/r2.ts` (con SDK) solo se carga en route handlers y server actions específicos del avatar.

> **Si "limpias" `lib/r2-config.ts` pensando que es código duplicado, vuelves a romper /admin en producción.** El propio archivo tiene un comentario explicativo. Detalle completo en `docs/phases/phase-3.5-deploy-and-domain-done.md` §7.

---

## Monitorización y logs

### En Vercel
- Dashboard → deploy → **Logs** en vivo.
- Runtime Logs → output de funciones serverless.
- Build Logs → output de `next build`.
- CLI: `npx vercel logs <url>` para streaming.

### En Supabase
- Logs sidebar → API / Auth / Database logs.
- Connection pool utilization.

### En Cloudflare R2
- Metrics → requests, bandwidth, storage.
- Plan free: 10 GB storage + egress ilimitado.

### En Cloudflare Email Routing
- Activity log → cada email entrante con OK/error.

### En Resend
- Logs → cada email enviado con código de respuesta.

### En Sentry (cuando esté activo)
- Issues → errores agrupados.
- Performance → trazas.

### En Stripe (cuando esté activo)
- Dashboard → Payments + Events.
- Logs de webhook con código de respuesta.

---

## Troubleshooting rápido

| Síntoma | Causa probable | Fix |
|---|---|---|
| `/admin` da 500 al desplegar | Falta `AUTH_SECRET` (no `NEXTAUTH_SECRET`) | Renombrar var en Vercel + redeploy |
| `/admin` da 500 con `ERR_REQUIRE_ESM` | Algún archivo importa `@/lib/r2` cuando debería usar `@/lib/r2-config` | Cambiar el import |
| `Build error: table public.X does not exist` | Vercel apunta a Supabase distinto del que tiene migraciones | Actualizar `DATABASE_URL` y `DIRECT_URL` en Vercel |
| Dominio no responde | DNS aún propagando o nube en Cloudflare está naranja | Esperar / cambiar a DNS only |
| 404 de Vercel | Dominio no asociado al proyecto | Settings → Domains → Add |
| Error SSL | Certificado emitiéndose | Esperar 2 min, recargar |
| Magic link no llega | RESEND_API_KEY falta o dominio no verificado en Resend | Logs de Resend |
| Avatar no carga | Las 4 `R2_BUCKET_NAME_*` no están en Vercel | Añadirlas (todas a `securitas-et-salus`) |
| QR de diploma apunta a localhost | `NEXT_PUBLIC_APP_URL` desactualizada | Actualizar y redeploy sin cache |

---

## Referencias cruzadas

- [docs/phases/phase-3.5-deploy-and-domain-done.md](phases/phase-3.5-deploy-and-domain-done.md) — chronicle del despliegue.
- [docs/external-services.md](external-services.md) — inventario de cuentas y env vars.
- [docs/infrastructure.md](infrastructure.md) — plan de infraestructura.
- [docs/integration-clavero.md](integration-clavero.md) — contrato con Clavero.
- [.env.example](../.env.example) — variables de entorno documentadas.
