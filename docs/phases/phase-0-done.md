# Fase 0 — Setup y configuración inicial

**Cierre:** 2026-04-28.
**Estado:** ✅ completada.

## Qué se construyó

### Stack técnico instalado
- Next.js 16.2 + React 19.2 + TypeScript 6 con App Router y Turbopack.
- Prisma 7.8 con `prisma.config.ts` (URL fuera del schema).
- NextAuth 5.0 beta (preparado, sin handlers — eso va en Fase 2).
- Stripe 22.1, Resend 6.12, AWS SDK S3 para R2.
- Sentry 10.50 con multi-runtime (client + server + edge + instrumentation).
- ESLint 9 (flat config), Prettier, EditorConfig.
- Vitest 4 + Playwright 1.59 + Testing Library.
- Sass 1.99 para SCSS Modules.

### Configs creadas
- `package.json` con scripts equivalentes a Clavero (dev, build, lint, typecheck, format, test, prisma:*).
- `next.config.ts` con security headers + `withSentryConfig`.
- `tsconfig.json` estricto (`noUncheckedIndexedAccess`, `noImplicitOverride`).
- `eslint.config.mjs` con plugin Next + TypeScript estricto.
- `.prettierrc.json`, `.prettierignore`, `.editorconfig` para formato consistente.
- `vercel.json` con `buildCommand` gateado por `typecheck + tests + build`.
- `vitest.config.ts` con scope de coverage adaptado a SES (sin `lib/queries`, `lib/email`, etc.).
- `playwright.config.ts` con workers=1 y timeout 60s.
- `prisma.config.ts` con DIRECT_URL para migraciones.
- `instrumentation.ts` para inicializar Sentry server/edge.
- `sentry.{client,server,edge}.config.ts`.

### Lib helpers copiados desde Clavero
- `lib/env.ts` — validación Zod de variables (adaptado: sin GOV_*, sin STRIPE_*_PRICE_ID, con buckets R2 separados).
- `lib/db.ts` — cliente Prisma con adapter Postgres y singleton global.
- `lib/regions.ts` — catálogo ISO 3166-2 LATAM completo (todos los países disponibles aunque SES arranque solo Chile).
- `lib/tokens.ts` — password reset + email verification con hash SHA-256.
- `lib/password.ts` — bcrypt 12 rondas.
- `lib/qr.ts` — wrapper de qrcode lib.

### Lib helpers adaptados a SES
- `lib/r2.ts` — re-escrito para soportar 3 buckets (diplomas, materials, receipts) con argumento explícito de bucket en cada operación.
- `lib/stripe.ts` — sin getCoursePriceId / getRenewalPriceId (SES usa `price_data` dinámico por curso).
- `lib/email/client.ts` — fallback "from" cambiado a SES.

### Design system aplicado
- `design-system/tokens/_colors.scss` con paleta extraída del logo:
  - Verdes del águila: `$color-primary-50` a `$color-primary-950` (color marca `#2c5f4a`).
  - Crema del sello: `$color-accent-50` a `$color-accent-900` (acento `#c9b87a`).
  - Neutros papel cálido + tinta verde-oscura.
  - Semánticos: success reusa el verde marca, warning naranja terroso, danger rojo apagado.
- `design-system/tokens/_typography.scss` con Fraunces (display) + Inter (body) + JetBrains Mono.
- `design-system/tokens/_spacing-shadows.scss` calcado de Clavero, con `$shadow-diploma` ajustado al crema y `$shadow-card-active` al verde marca.
- `design-system/base/_globals.scss` con reset moderno + estilos HTML.
- `design-system/index.scss` como punto de entrada único.
- 9 componentes SCSS copiados de Clavero (Button, Card, Badge, Input, Avatar, Tag, Table, Pagination, FilterBar) con `$color-gold-*` reemplazado por `$color-accent-*`.
- Variante `gold` del Button renombrada a `accent` (más coherente con la paleta SES).

### Componentes UI básicos
- `components/ui/Button.tsx` — variantes `primary | accent | secondary | ghost | danger | outline`.
- `components/ui/Container.tsx` — wrapper con max-width.
- `components/ui/Section.tsx` — sección semántica con padding configurable.

### Schema Prisma SES
- 9 modelos: `User`, `PasswordResetToken`, `EmailVerificationToken`, `Course`, `CourseSession`, `Enrollment`, `Attendance`, `Payment`, `Diploma`.
- 5 enums: `Role` (3 valores: SUPER_ADMIN, INSTRUCTOR, STUDENT), `CourseStatus`, `EnrollmentStatus`, `DiplomaStatus`, `PaymentStatus`.
- Course incluye los 3 flags clave: `hasEvaluation`, `senceEligible`, `eligibleForClaveroProfessionalCert`.
- Enrollment incluye datos SENCE: `senceUsed`, `employerRut`, `employerName`, `employerHrEmail`.
- Diploma sin `expiresAt` (decisión SES — no caducan).

### Página raíz
- `app/layout.tsx` con `next/font` cargando Fraunces, Inter y JetBrains Mono. Metadata SEO + OpenGraph + theme-color verde marca.
- `app/page.tsx` con hero centrado mostrando el logo del sello, título y bloque de estado.
- `app/page.module.scss` usando tokens del design system.
- Logos copiados a `public/brand/logo-mark.png` y `public/brand/logo-seal.png`.

### Seed
- `prisma/seed.ts` calcado de Clavero, con `emailVerifiedAt: new Date()` automático en el SUPER_ADMIN (admin manual queda pre-verificado).

### .env.example
Documentadas todas las variables agrupadas por fase:
- Fase 0: ninguna obligatoria.
- Fase 2 (auth): DATABASE_URL, NEXTAUTH_SECRET, RESEND_API_KEY, EMAIL_FROM.
- Fase 4 (pagos): STRIPE_*.
- Fase 5 (storage): R2_*.

## Verificación

```
$ npm run typecheck
✓ tsc --noEmit (sin errores)

$ npm run lint
✓ eslint . (sin errores)

$ npm test
✓ 38 tests pasados (regions, password, tokens)

$ npm run build
✓ Compiled successfully (12.5s)
✓ Generated static pages (3/3)
✓ Routes: / (static), /_not-found (static)
```

## Decisiones tomadas

- **Paleta extraída del logo** en lugar de placeholders genéricos. El verde institucional `#2c5f4a` deriva del cuerpo del águila; el crema `#c9b87a` del fondo del sello. Validados contraste WCAG AAA en los tokens principales.
- **Tipografía Fraunces + Inter** en lugar de Playfair (Clavero). Diferencia clara de marca sin cambiar la arquitectura del DS.
- **Variante `accent` del Button** (no `gold`). Mantiene la semántica pero usa los tokens correctos de la paleta SES.
- **3 buckets R2 desde el inicio** en lugar de 1. Es trabajo cosmético adicional pero deja todo limpio para las siguientes fases sin migración intermedia.
- **Stripe sin Price IDs hardcoded.** SES usa `price_data` dinámico por curso. Esto deja la multi-currency lista sin esfuerzo extra cuando llegue el momento.
- **Catálogo LATAM completo en `lib/regions.ts`** aunque SES arranque solo Chile. El campo `region` en BD ya está preparado; el formulario público filtra por `SUPPORTED_REGIONS`.
- **Sin `lib/auth.ts` en Fase 0.** NextAuth se cablea en Fase 2 con Credentials + Magic Link. Mantenerlo fuera mantiene la Fase 0 estrictamente como "el proyecto compila y se despliega".

## Lo que NO está en Fase 0 (intencional)

- NextAuth runtime (`lib/auth.ts`, handlers, middleware). → Fase 2.
- Modelos de email (templates React Email). → Fase 7.
- `lib/diplomas.ts`, `lib/payments.ts`, `lib/enrollments.ts`. → Fases 4-5.
- Rutas `/login`, `/register`, `/cursos`, `/admin`, `/instructor`. → Fases 1-3.
- Tests E2E. → Fase 9.

## Cómo probarlo localmente

```bash
git clone <repo>
cd SecuritasEtSalus
npm install
cp .env.example .env.local
npm run dev
# → http://localhost:3000 debería mostrar la página raíz con el logo del sello
```

Sin variables de entorno reales, la app arranca igualmente (`isStripeAvailable()`, `isR2Available()`, `isEmailAvailable()` devuelven `false` y los flujos quedan en graceful fallback).

## Deuda técnica

- Sentry imprime `DEPRECATION WARNING: disableLogger is deprecated` en cada build. Quitar cuando @sentry/nextjs publique la guía de migración a `webpack.treeshake.removeDebugLogging`. No bloqueante.
- Los 9 componentes SCSS del DS están copiados pero sus wrappers React (Card.tsx, Badge.tsx, Input.tsx, Avatar.tsx, Tag.tsx, Table.tsx, Pagination.tsx, FilterBar.tsx, PasswordInput.tsx) no se han copiado todavía. Se traen en Fase 1 cuando se necesiten para la landing y catálogo.
- Vectorización SVG de los logos pendiente — los PNG están en `public/brand/`. No bloqueante.
