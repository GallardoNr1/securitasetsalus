# Despliegue y dominio — SecuritasEtSalus

Documentación operativa sobre dónde vive SES en producción, cómo está configurado el dominio y qué variables de entorno necesita cada servicio.

## URL de producción

**Producción inicial:** `https://ses.agsint.cl` (subdominio bajo el dominio que ya gestiona el founder en cPanel).

**Migración prevista al dominio definitivo:** cuando la SpA chilena esté formalmente constituida y se compre uno de:
- `securitasetsalus.cl` (preferente — refuerza identidad legal chilena, ~CLP 12.000/año).
- `securitas-et-salus.com` (alternativa internacional si SES escala fuera de Chile pronto).

La migración es de ~15 min siguiendo el procedimiento de la sección "Migrar a dominio definitivo" más abajo.

**Fallback de Vercel siempre activo:** `<project-name>.vercel.app`.

---

## Arquitectura de hosting

```
┌─────────────┐         ┌──────────────┐        ┌─────────────┐
│   Browser   │───DNS──▶│  ecohosting  │───────▶│   Vercel    │
│             │         │ (cPanel DNS) │  CNAME │  (Next.js)  │
└─────────────┘         └──────────────┘        └─────────────┘
                                                       │
                             ┌─────────────────────────┼─────────────────┬───────────┐
                             │                         │                 │           │
                             ▼                         ▼                 ▼           ▼
                      ┌──────────────┐          ┌────────────┐    ┌────────────┐ ┌────────┐
                      │  Supabase    │          │ Cloudflare │    │  Resend    │ │ Stripe │
                      │ (Postgres SES)│          │     R2     │    │            │ │        │
                      └──────────────┘          └────────────┘    └────────────┘ └────────┘
```

### Responsabilidades por capa

| Servicio | Qué hace |
|---|---|
| **ecohosting.cl** | DNS del subdominio `ses.agsint.cl` (mismo proveedor que Clavero). |
| **Vercel** | Ejecuta Next.js, API routes, middleware. Emite SSL. Despliegue continuo desde GitHub. |
| **Supabase (proyecto SES)** | Postgres separado del de Clavero. |
| **Cloudflare R2** | Diplomas, materiales de curso, recibos. Cuenta R2 puede compartirse con Clavero, pero buckets separados. |
| **Stripe** | **Cuenta propia de SES**, separada de la de Clavero. Se crea con datos de la SpA chilena nueva. |
| **Resend** | Cuenta y dominio verificado propio para SES (DKIM/SPF/DMARC del dominio SES). |
| **Sentry** | Proyecto separado del de Clavero. |

---

## Cómo configurar el subdominio (mientras sea temporal)

### Registro DNS (en cPanel de ecohosting → Zone Editor de `agsint.cl`)

```
Tipo:  CNAME
Nombre: ses
Valor:  cname.vercel-dns.com
TTL:   300 (5 minutos)
```

### Dominio asociado en Vercel

Settings → Domains → `ses.agsint.cl` añadido al proyecto Vercel de SES.

Vercel detecta el CNAME y emite automáticamente certificado SSL (Let's Encrypt). Propagación 5 min – 2 h.

---

## Variables de entorno en Vercel

Para producción funcional, estas vars deben estar en Vercel (Settings → Environment Variables, en Production + Preview):

### Obligatorias

| Variable | Valor | De dónde sale |
|---|---|---|
| `DATABASE_URL` | Pooled connection Supabase (puerto 6543) | Supabase → Settings → Database → Connection pooling |
| `DIRECT_URL` | Direct connection Supabase (puerto 5432) | Supabase → igual, modo "Session" |
| `NEXTAUTH_SECRET` | 32 bytes random base64 | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXT_PUBLIC_APP_URL` | URL pública (ej. `https://ses.agsint.cl`) | Cambia al migrar dominio |

### Storage (R2)

| Variable | Notas |
|---|---|
| `R2_ACCOUNT_ID` | Cuenta R2 (puede ser la misma que Clavero) |
| `R2_ACCESS_KEY_ID` | API token con permisos sobre los buckets de SES |
| `R2_SECRET_ACCESS_KEY` | idem |
| `R2_BUCKET_NAME_DIPLOMAS` | `ses-diplomas` |
| `R2_BUCKET_NAME_MATERIALS` | `ses-course-materials` |
| `R2_BUCKET_NAME_RECEIPTS` | `ses-payment-receipts` |

### Pagos (Stripe)

| Variable | Notas |
|---|---|
| `STRIPE_SECRET_KEY` | sk_test_... o sk_live_... |
| `STRIPE_PUBLISHABLE_KEY` | pk_test_... o pk_live_... |
| `STRIPE_WEBHOOK_SECRET` | whsec_... — atado al endpoint configurado |

(No hay `STRIPE_*_PRICE_ID` en SES — los precios son dinámicos por curso.)

### Email (Resend)

| Variable | Notas |
|---|---|
| `RESEND_API_KEY` | re_... |
| `EMAIL_FROM` | `noreply@<dominio-ses>` con DKIM/SPF/DMARC verificados |

### Observabilidad (Sentry)

| Variable | Notas |
|---|---|
| `SENTRY_DSN` | Server-side DSN |
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side DSN |

---

## Deploy continuo

| Rama | Despliegue |
|---|---|
| `main` | Producción (URL definitiva) |
| `develop` | Preview URL única por commit |
| `feature/*` | Preview individual |

Workflow típico (mismo que Clavero):
1. Trabajas en `develop`.
2. Push → Vercel genera preview URL.
3. Pruebas en esa preview.
4. Merge `develop → main` → producción despliega sola.
5. Verificas en el dominio de producción.

**Build gateado por tests:** el `buildCommand` de `vercel.json` ejecuta `typecheck + unit tests` con `NODE_ENV=test` antes de buildear. Si fallan, el deploy se aborta. Mismo patrón que Clavero.

---

## Migrar a dominio definitivo

Cuando se compre el dominio definitivo (`securitasetsalus.cl` u otro), el cambio es mecánico (15 min):

1. **DNS** del nuevo dominio:
   ```
   Tipo:  CNAME
   Nombre: www (o @ con ALIAS/ANAME si lo soporta el registrador)
   Valor:  cname.vercel-dns.com
   TTL:   300
   ```
   Si el registrador no soporta CNAME en root, usar A record `76.76.21.21` (Vercel).

2. **Añadir dominio en Vercel** → Settings → Domains → Add.
3. **Marcar como primario** → ⋯ → Set as Primary.
4. **Actualizar `NEXT_PUBLIC_APP_URL`** a la nueva URL.
5. **Redeploy sin cache** → Deployments → último → Redeploy (desmarcar "Use existing Build Cache").
6. **Dejar redirect desde el subdominio antiguo** para que los QR de diplomas viejos sigan resolviendo.

### Diplomas pre-existentes

Los QR de diplomas emitidos antes del cambio apuntan al dominio antiguo. Estrategia recomendada (igual que Clavero):
- **A)** Dejar el dominio antiguo activo con redirect automático (los QR viejos siguen funcionando sin tocar nada).
- **B)** Regenerar PDFs con `UPDATE "Diploma" SET "pdfKey" = NULL;` — el siguiente acceso regenera el PDF con el nuevo dominio.

---

## Monitorización y logs

### En Vercel
- Dashboard → deploy → **Logs** en vivo.
- Runtime Logs → output de las funciones serverless.
- Build Logs → output de `next build`.

### En Supabase
- **Logs** sidebar → API / Auth / Database logs.
- Connection pool utilization.

### En Cloudflare R2
- Metrics → requests, bandwidth, storage.
- Plan free: 10 GB/mes + egress ilimitado.

### En Sentry
- Issues → errores agrupados.
- Performance → trazas.

### En Stripe
- Dashboard → Payments + Events.
- Logs de webhook con código de respuesta.

---

## Troubleshooting rápido

| Síntoma | Causa probable | Fix |
|---|---|---|
| Dominio no responde | DNS aún no propagó | Esperar o verificar con dnschecker.org |
| 404 de Vercel | Dominio no asociado al proyecto | Settings → Domains → Add |
| Error SSL | Certificado emitiéndose | Esperar 2 min, recargar |
| Webhook Stripe falla | `STRIPE_WEBHOOK_SECRET` incorrecto o endpoint URL distinto | Comparar valor en Stripe dashboard vs Vercel env vars |
| Emails caen en spam | DMARC/DKIM/SPF no configurados | Verificar dominio en Resend dashboard |
| PDFs lentos | R2 vars mal configuradas | Validar `R2_*` en env + redeploy sin cache |
| QR apuntan al dominio viejo | `NEXT_PUBLIC_APP_URL` desactualizada o build cacheado | Actualizar + redeploy sin cache |

---

## Referencias cruzadas

- [docs/infrastructure.md](infrastructure.md) — plan de infraestructura.
- [docs/integration-clavero.md](integration-clavero.md) — contrato con Clavero.
- [.env.example](../.env.example) — variables de entorno documentadas.
