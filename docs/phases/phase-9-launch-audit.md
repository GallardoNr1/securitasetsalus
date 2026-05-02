# Fase 9 — Auditoría de seguridad + lanzamiento (parcial)

**Fecha:** 2026-05-02.
**Estado:** ✅ auditoría de código + remediación lista. Lighthouse y
Stripe live siguen pendientes (uno requiere browser, el otro factura
chilena de la SpA).

## Qué se auditó y remediado

### 1. Rate limiting (era CRITICAL en `docs/rules.md` §security)

**Antes:** solo `/api/diplomas/[code]/verify` tenía rate limit (item 1
del backlog de Sonar, cerrado en `df968c4`). El resto de endpoints
sensibles iban a pelo.

**Ahora:** 5 buckets en [`lib/ratelimit.ts`](../../lib/ratelimit.ts),
todos sobre Upstash Redis con graceful degradation a no-op si las
envs faltan:

| Bucket | Cuota | Clave | Cableado en |
|---|---|---|---|
| verify | 30 / min | IP | `/api/diplomas/[code]/verify` |
| login | 5 / min | IP+email | `loginAction`, `magicLinkAction` |
| signup | 3 / hora | IP | `registerAction` |
| pwreset | 3 / hora | email | `forgotPasswordAction` |
| enroll | 5 / hora | userId | `enrollAction` |

Todos los excedidos:
- responden con `error: 'rate-limited'` en la action result,
- loggean a Sentry vía `logger.warn` con tags por feature,
- devuelven mensaje claro al usuario sin filtrar info sensible.

### 2. Content Security Policy (era pendiente, "se afinará cuando…")

**Antes:** sin CSP. El comentario en `next.config.ts` decía "la CSP
definitiva se afinará cuando añadamos scripts de terceros".

**Ahora:** CSP estricta con orígenes whitelisted explícitos:
- `script-src`: self + Stripe.js (`unsafe-inline` + `unsafe-eval`
  necesarios para Next 16 hydration / dev — la trade-off de hacer
  nonce dinámico no compensa para SES).
- `connect-src`: Supabase + Resend + Stripe + Upstash + Sentry.
- `frame-src`: solo Stripe Checkout.
- `frame-ancestors: 'none'` + `X-Frame-Options: DENY` para clickjack.
- `form-action`: self + checkout.stripe.com (donde redirige el form
  de inscripción).
- `object-src: 'none'` + `upgrade-insecure-requests`.

Headers adicionales nuevos:
- `Cross-Origin-Opener-Policy: same-origin` — aísla la ventana de
  Stripe Checkout abierto en pestaña, previene `window.opener`.
- `X-DNS-Prefetch-Control: off` — minimiza fingerprinting al evitar
  prefetch automático de dominios mencionados en la página.
- `Permissions-Policy` ahora incluye `payment=(self)` (era requerido
  para que Stripe.js pueda lanzar Apple Pay / Google Pay).

### 3. Headers de SEO / OpenGraph / structured data

**Antes:**
- `app/layout.tsx` con OG y Twitter pero **sin imágenes**.
- Sin JSON-LD structured data.
- `sitemap.ts` y `robots.ts` con fallback hardcoded a
  `https://ses.agsint.cl` (dominio antiguo).

**Ahora:**
- OG y Twitter llevan `images: [{url, width, height, alt}]` apuntando
  a `/brand/logo-seal.png` (1200×1200, ya existe).
- `<script type="application/ld+json">` en `<body>` con
  `EducationalOrganization` schema: nombre, logo, descripción,
  contacto, dirección país. Esto ayuda a Google a entender que SES es
  una organización educativa en Chile.
- `metadata.icons` añadidos (favicon + apple-touch-icon).
- `sitemap.ts` y `robots.ts` ahora usan `env.NEXT_PUBLIC_APP_URL` (que
  es obligatoria en `lib/env.ts` desde la fase de calidad). Si la env
  falta, el módulo falla al arrancar — preferible al dominio incorrecto
  silencioso.
- Sitemap ahora incluye `/contact`, `/legal/terms`, `/legal/privacy`.

### 4. Limpieza de logs

**Antes:** algunos `console.X` quedaban sueltos en código de runtime.

**Ahora:**
- `lib/stripe.ts:parseWebhookEvent` migrado a `logger.error`.
- `app/sitemap.ts` migrado a `logger.warn`.
- Único `console.error` que queda en código de runtime:
  `lib/env.ts` (boot-time, antes de que `logger` exista — necesario
  porque el logger lee env vars).
- `app/(app)/profile/AvatarUploader.tsx` también tiene un
  `console.error` pero es **client component** — los logs de browser
  son legítimos para diagnóstico del usuario; ahí no aplica el wrapper.

### 5. Bug del `account-suspended` en login

**Antes:** la `AccountSuspendedError` de NextAuth se lanzaba
correctamente (Fase admin), pero el `loginAction` solo distinguía
`email-not-verified`. Un usuario suspendido veía "email o contraseña
incorrectos" — confuso.

**Ahora:** `loginAction` lee el `code` de `err.cause.err` y mapea
`account-suspended` a un mensaje específico. Tipo del result
ampliado.

## Lo que NO he tocado y por qué

### Lighthouse real (browser-driven)

No tengo browser en este entorno. Te dejo el checklist concreto para
cuando lo lances tú:

#### Performance (objetivo ≥85)
- [ ] Verifica que `/`, `/courses`, `/courses/[slug]`, `/verify` van a
  90+. Las páginas `(app)/*` no cuentan (son auth-only).
- [ ] Si Performance baja de 80, revisa con DevTools:
  - **CLS**: imágenes sin `width`/`height` explícitas (ya están
    todas con `next/image` pero confirma).
  - **LCP**: el sello del hero. Si tarda, considerar `priority` (ya
    está en `app/(public)/page.tsx`).
  - **TBT**: revisar Sentry / scripts terceros. La CSP nueva ya
    minimiza esto.

#### Accessibility (objetivo ≥95)
- [ ] Contraste — todos los tokens del design system se diseñaron
  con WCAG AA. Confirmar con Lighthouse.
- [ ] Labels en inputs — todos los `<Input>` van con `<Label>` del DS.
- [ ] Focus states — todos los componentes UI tienen `:focus`
  visible. Probar con Tab.
- [ ] `aria-label` en botones icon-only — verifica `IconButton`,
  toggles del header móvil.

#### SEO (objetivo 100)
- [ ] Después de este commit debe dar **100** — están todos los
  elementos: meta title/description/OG/Twitter/icons, robots, sitemap,
  JSON-LD. Solo falta verificar.
- [ ] Lighthouse a veces se queja de "links don't have descriptive
  text" — los iconos-only del header están con `aria-label`, debería
  pasar.

#### Best Practices (objetivo 100)
- [ ] Confirmar que la CSP no está bloqueando recursos legítimos en
  prod. Vercel Analytics / si añades Plausible: añadir su dominio a
  `connect-src` en `next.config.ts`.

### Stripe live

Bloqueado por la factura chilena de tu hermano (memoria
`project_billing_status.md`). Cuando llegue:
1. Crear cuenta Stripe live verificada con el RUT de la SpA.
2. Reemplazar `STRIPE_SECRET_KEY` (`sk_test_*` → `sk_live_*`) y
   `STRIPE_PUBLISHABLE_KEY` en Vercel.
3. Crear webhook en Stripe Dashboard → copiar el `whsec_*` a
   `STRIPE_WEBHOOK_SECRET`.
4. Hacer un pago real con €1 contra `4242…` para confirmar que el
   flujo end-to-end funciona en live.

El código no cambia.

### Resend dominio

Para que los emails dejen de loggearse en `logger.debug` y empiecen a
salir reales:
1. Verificar `securitasetsalus.cl` en Resend (DKIM + SPF + DMARC).
2. Cambiar `EMAIL_FROM` a `noreply@securitasetsalus.cl` en Vercel.
3. Probar con un registro real → verificar que llega.

### Tests E2E del flujo Stripe

Los unit tests cubren la lógica (refunds + webhook idempotency). Para
E2E real con Playwright + Stripe CLI hay que orquestar el listener
dentro del harness — aún no lo tengo. Es deuda anotada.

## Variables de entorno actualizadas

`.env.example` ya estaba actualizado en fases anteriores. Nuevas no.

## Testing

Suite completa:
- 129 unit tests pasan.
- Lint pasa (warning preexistente en `verify/page.tsx` no relacionado).
- Typecheck pasa.

## Checklist de cierre — Fase 9 producción-ready

- [x] Rate limiting en endpoints públicos sensibles (auth + enroll +
      verify).
- [x] CSP estricta con orígenes whitelisted.
- [x] OG / Twitter / JSON-LD structured data.
- [x] Sitemap completo + robots correcto.
- [x] Headers de seguridad (HSTS, COOP, X-Frame, Permissions-Policy,
      etc.).
- [x] Logs sin filtración de PII (`logger` con env guard).
- [x] Cobertura de tests crítica (refunds, eligibility, verify
      endpoint, server actions clave) — 129 unit + 16 E2E.
- [x] Errors van a Sentry.
- [ ] Lighthouse audit ≥85/95/100/100 — pendiente run en browser.
- [ ] Stripe live activado — pendiente factura SpA chilena.
- [ ] Resend dominio verificado — pendiente DNS.
- [ ] Documentación operativa para admin — pendiente cuando se cierre
      todo lo anterior.
