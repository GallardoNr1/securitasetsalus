# Fase 2 — Autenticación y roles

**Cierre:** 2026-04-28.
**Estado:** ✅ completada (a ciegas, sin BD ni Resend reales — el código compila y los tests pasan, queda pendiente cablear `.env.local` con credenciales reales para probar end-to-end).

## Qué se construyó

### NextAuth v5 con Credentials + Magic Link
- `auth.config.ts` (Edge-compatible) con reglas de acceso por rol:
  - `/admin` → `SUPER_ADMIN`
  - `/instructor` → `INSTRUCTOR | SUPER_ADMIN`
  - `/dashboard`, `/mis-cursos`, `/mis-diplomas`, `/billing` → `STUDENT | SUPER_ADMIN`
  - `/profile` → cualquier autenticado
  - Resto: público
- `lib/auth.ts` (runtime Node) con dos providers:
  - **Credentials**: email + password con bcrypt 12 rondas. Bloquea login para `STUDENT` con email no verificado (lanza `EmailNotVerifiedError`).
  - **Resend (Magic Link)**: pide solo email, manda link mágico con plantilla SES branded a través de la API de Resend (vía custom `sendVerificationRequest`).
- `proxy.ts` (Next 16) que enchufa `NextAuth(authConfig).auth` como middleware Edge.
- `types/next-auth.d.ts` augmenta `User`, `Session` y `JWT` con `role` + `region`.
- `app/api/auth/[...nextauth]/route.ts` exporta los handlers GET/POST.

### Modelos Prisma extra
Añadidos al schema para soportar `@auth/prisma-adapter`:
- `Account` (futuro OAuth — no se usa en Fase 2 pero deja la puerta abierta).
- `Session`.
- `VerificationToken` (Magic Link guarda aquí su token efímero).

### Validaciones (`lib/validations/auth.ts`)
- `loginSchema`, `magicLinkSchema`, `registerSchema`, `profileUpdateSchema`, `passwordChangeSchema`, `forgotPasswordSchema`, `resetPasswordSchema`.
- Validación de RUT chileno con regex: acepta con o sin puntos (`12.345.678-9` o `12345678-9`).
- Versión simplificada respecto a Clavero — el alumno SES no tiene perfil profesional público (ni businessName, ni serviceCities, ni addressLine).

### Plantillas de email (`lib/email/templates/`)
- `BaseLayout.tsx` con branding SES (verde `#2c5f4a` + crema `#c9b87a`, Fraunces para el header).
- `WelcomeEmail.tsx` — bienvenida tras verificar email.
- `EmailVerificationEmail.tsx` — token de verificación post-registro.
- `PasswordResetEmail.tsx` — token de reset.
- `MagicLinkEmail.tsx` — para el provider Resend de NextAuth (con `renderMagicLinkEmail` async helper para que `lib/auth.ts` consuma el HTML sin importar `render` directo).
- Todas las plantillas con función `*EmailText` paralela para fallback de clientes que bloquean HTML.

### Helpers (`lib/email/send.ts`)
- `sendWelcomeEmail(to, name)`.
- `sendEmailVerificationEmail({ to, name, token, expiresInHours })`.
- `sendPasswordResetEmail({ to, name, token, expiresInMinutes })`.
- Todas con graceful fallback: si `RESEND_API_KEY` no está, loguea y devuelve éxito silencioso.

### Grupo `(auth)` — flujos públicos de autenticación
- `layout.tsx` con header propio (logo + wordmark) y footer compartido del sitio.
- **`/login`**: formulario con dos modos (password + magic link), gestión de errores granular (`email-not-verified` con CTA de reenvío).
- **`/register`**: formulario completo con 7 campos (name, email, region, phone, rut, password, confirm + acceptTerms). Crea `User` con `role: STUDENT`, genera token de verificación, envía email, redirige a `/verify-email/sent?email=...`.
- **`/forgot-password`**: pide email; siempre responde "si la cuenta existe te enviamos enlace" (no leak de cuentas).
- **`/reset-password/[token]`**: server component que primero inspecciona el token (`inspectPasswordResetToken`), si es válido renderiza el formulario; si no, muestra el motivo (invalid/used/expired).
- **`/verify-email/sent`**: pantalla "revisa tu correo" con CTA reenviar.
- **`/verify-email/[token]`**: consume token, marca `User.emailVerifiedAt`, manda email de bienvenida si era una verificación nueva, muestra confirmación.

### Grupo `(app)` — áreas autenticadas
- `layout.tsx` con `AppHeader` (sticky con datos del usuario + botón logout) y body con `min-height: calc(100vh - 64px)` para que el footer no flote.
- **`/dashboard`** (STUDENT): saludo personalizado + 3 cards stub (Mis cursos, Mis diplomas, Pagos) con etiqueta de fase futura.
- **`/instructor`** (INSTRUCTOR): saludo + 3 cards stub (Cursos asignados, Asistencia, Evaluaciones).
- **`/admin`** (SUPER_ADMIN): saludo + 4 cards stub (Cursos, Usuarios, Inscripciones y pagos, Diplomas).
- **`/profile`** (cualquier autenticado): formulario editable con dos secciones — datos personales (name, region, subdivision, phone, rut) y cambio de contraseña con validación de la actual.

### Componentes nuevos
- `components/features/AppHeader.tsx` — header con avatar/nombre, link a perfil y formulario de logout.
- `components/features/DashboardStub.tsx` — componente reutilizable para los 3 dashboards (greeting + grid de cards con etiqueta de fase).
- `components/ui/Input.tsx`, `PasswordInput.tsx` — copiados desde Clavero. `ErrorMessage` ahora acepta children opcional (devuelve null si está vacío) para usar como espacio reservado.

## Verificación

```
$ npm run typecheck     ✓ tsc --noEmit (sin errores)
$ npm run lint          ✓ eslint . (sin errores)
$ npm test              ✓ 45 tests pasados (38 lib + 7 PasswordInput)
$ npm run build         ✓ 22 rutas (estáticas + dinámicas)
```

Build genera correctamente todas las rutas:
- Estáticas: `/`, `/cursos`, `/cursos/[slug]` × 4 (SSG), `/login`, `/register`, `/forgot-password`, `/legal/*`, `/verify`, `/icon`, `/sitemap.xml`, `/robots.txt`.
- Dinámicas (server-rendered): `/admin`, `/dashboard`, `/instructor`, `/profile`, `/reset-password/[token]`, `/verify-email/[token]`, `/verify-email/sent`, `/verify/[code]`, `/api/auth/[...nextauth]`.
- Middleware: el proxy edge corre en cada request no estática para validar rol.

## Decisiones tomadas

- **Magic Link desde Fase 2** (no diferido). Reduce fricción para alumnos puntuales que se inscriben a un solo curso y no quieren recordar contraseña. La cuenta de Resend la pasa el cofundador cuando esté lista.
- **Email verificado obligatorio solo para STUDENT**. Los `SUPER_ADMIN` e `INSTRUCTOR` los crea el admin manualmente desde Fase 3 con `emailVerifiedAt: new Date()` automático — su identidad se asume garantizada por el proceso de creación.
- **No revelar si una cuenta existe** en `/forgot-password` y `/verify-email/sent` (resend). Estándar de seguridad para evitar enumeración de cuentas. El precio: peor UX si el usuario se equivoca de email — vale la pena.
- **Profile sin businessName / serviceCities / addressLine**. SES es escuela; el alumno no tiene perfil público profesional. Esos campos pertenecen al cerrajero certificado de Clavero.
- **DashboardStub compartido para los 3 roles**. Componente único con etiquetas de fase. Cuando se cablee cada función real (Fase 3+), se reemplaza la versión por rol pero la del resto sigue siendo stub. Evita duplicación de markup mientras la app no tiene contenido funcional aún.
- **`type Route = string` en `auth.config.ts`**. Next genera `Route` solo después del primer build, lo que rompía el typecheck en limpio. Aliasarlo a `string` en este archivo edge no introduce riesgo (no usamos las rutas como `<Link>`, solo como string para `Response.redirect`).

## Lo que NO está en Fase 2 (intencional)

- **Cron jobs / scheduled tasks** — apuntados para Fases 5+ (recordatorios de curso, verificación de tokens caducados).
- **Tests E2E con Playwright del flujo completo** — los tests E2E llegan en Fase 9 cuando haya BD real.
- **Tests unitarios de las server actions** — requieren mockear NextAuth + Prisma + email; mejor cubrirlos por E2E con BD real.
- **2FA / TOTP** — fuera de scope MVP.
- **Cuentas OAuth (Google, Microsoft)** — el modelo `Account` está preparado pero ningún provider está activo. Se añaden si lo pide algún cliente corporativo grande.
- **Cambio de email** — el `/profile` deshabilita el campo email. Si un alumno necesita cambiarlo, lo gestiona el admin con auditoría manual.

## Cosas pendientes para activar en producción

Cuando me pases las cuentas reales, la activación es mecánica:

### Lo que falta de tu lado
- [ ] Crear proyecto Supabase de SES (region us-east-1).
- [ ] Generar `DATABASE_URL` (pooled, puerto 6543) y `DIRECT_URL` (puerto 5432).
- [ ] Crear cuenta Resend de SES (puede compartir cuenta con Clavero, o cuenta separada — preferible separada).
- [ ] Verificar dominio `ses.agsint.cl` en Resend (DKIM + SPF + DMARC).
- [ ] Generar `RESEND_API_KEY` específica para producción SES.
- [ ] Generar `NEXTAUTH_SECRET` localmente (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`).

### Lo que hago yo cuando me pases lo de arriba
- [ ] Pegar las vars en `.env.local` (local) y en Vercel (producción).
- [ ] Correr la primera migración: `npm run prisma:migrate`.
- [ ] Correr `npm run prisma:seed` con `SEED_SUPER_ADMIN_EMAIL` y `SEED_SUPER_ADMIN_PASSWORD` para crear el admin inicial.
- [ ] Smoke test end-to-end: registro → email verificación → login → dashboard.
- [ ] Verificar que Sentry captura un error inducido (smoke test).

## Deuda técnica

- **Magic Link en lib/auth.ts hace `fetch` directo a la API de Resend** en lugar de usar el cliente SDK. Razón: el SDK pesa y NextAuth ya tiene su provider Resend que acepta esta config. La diferencia es trivial pero podríamos refactorizar a usar `lib/email/client.ts` cuando consolidemos templates en Fase 7.
- **El check de "tipo de error" en login/actions.ts** lee `err.cause?.err.code` con un `as { code?: string }` cast. NextAuth v5 beta no expone tipos limpios para `AuthError.cause`. Cuando v5 estable salga, revisarlo.
- **`type Route = string` en auth.config.ts**. Idealmente importaríamos `Route` de `next` cuando exista en `.next/types/`. Mejorable cuando hagamos un script post-install que ya genere typed routes.
- **El componente AppHeader usa `auth()` directamente** — es server component, está bien, pero significa que cada request al área autenticada hace una validación de sesión adicional al middleware. En la práctica el JWT ya está en cookie y `auth()` solo lo decodifica, no hay extra DB round-trip.

## Cómo probarlo localmente

Sin Supabase ni Resend reales, los flujos compilan pero no funcionan completos:

```bash
npm run dev
# → http://localhost:3000/login (formulario renderiza, submit falla por BD)
# → http://localhost:3000/register (idem)
```

Cuando estén las vars:

```bash
cp .env.example .env.local
# rellenar DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, RESEND_API_KEY, EMAIL_FROM,
# SEED_SUPER_ADMIN_EMAIL, SEED_SUPER_ADMIN_PASSWORD

npm run prisma:migrate
npm run prisma:seed
npm run dev

# Smoke test:
# 1. http://localhost:3000/register → crea cuenta
# 2. Revisa email (o consola si RESEND_API_KEY vacía) → click en link de verificación
# 3. http://localhost:3000/login → entra
# 4. Acabas en /dashboard
# 5. /profile → edita name, guarda → recarga, persiste
# 6. /admin (con la cuenta del seed) → ve el panel admin
```
