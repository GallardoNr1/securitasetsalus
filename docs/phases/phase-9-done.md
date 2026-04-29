# Fase 9 — Tests E2E con Playwright (asistencia → eval → diploma → verify)

**Cierre:** 2026-04-29.
**Estado:** ✅ completada.

## Qué se construyó

Suite E2E completa con Playwright que cubre los flujos críticos de SES en producción:

- **`e2e/auth.spec.ts`** (8 tests) — login por rol, logout, credenciales inválidas, redirects de middleware.
- **`e2e/full-flow.spec.ts`** (8 tests, `describe.serial`) — flujo completo end-to-end del producto:
  1. Instructor pasa lista de la primera sesión.
  2. Instructor evalúa con notas ≥4.0 a los 4 alumnos.
  3. Instructor emite diplomas para los aptos.
  4. Alumno entra a `/my-diplomas` y ve el diploma vigente. Captura el código.
  5. Verifica el endpoint público `GET /api/diplomas/[code]/verify` (200 + shape correcta + CORS abierto).
  6. Verifica la página pública `/verify/[code]` sin login.
  7. Verifica que `/api/diplomas/CODIGO-INVENTADO/verify` devuelve 404.
  8. Verifica que un formato inválido (`/api/diplomas/foo-bar/verify`) devuelve 400.

**Total: 16/16 tests E2E pasan.** Más los 53 unit tests de Vitest = 69 tests automatizados en el repo.

## Cómo correrlos

Pre-requisito (una vez):
```bash
npm run prisma:seed:dev
```

Después:
```bash
npm run test:e2e          # corre toda la suite, dev server arranca solo
npm run test:e2e:ui       # modo interactivo para depurar
npm run test:e2e:report   # ver el HTML report del último run
```

Playwright reusa el dev server si ya está corriendo (`reuseExistingServer: !CI`). En CI lo levanta él mismo.

## Helpers

- **`e2e/helpers/auth.ts`** — `login(page, user)`, `logout(page)`, y constante `TEST_USERS` con las credenciales del seed-dev:
  - `superAdmin` (lee de `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` del `.env.local`).
  - `instructor` (`instructor.demo@securitasetsalus.cl` / `Instructor123!`).
  - `student1` (`alumno1.demo@securitasetsalus.cl` / `Alumno123!`).

## Decisiones tomadas

### Idempotencia: la suite es re-ejecutable

Cada test tolera ejecutarse contra una BD donde corridas previas ya dejaron asistencia, evaluaciones o diplomas. Mecanismos:

- **Asistencia**: el test pulsa "Limpiar" antes de "Marcar todos presentes" para garantizar que el form quede dirty (la pauta `dirty button` deshabilita el botón Guardar si no hay cambios).
- **Evaluación**: el test alterna entre `5.0` y `5.5` según el valor actual del input para forzar delta.
- **Diplomas**: el botón muestra "Emitir N diplomas" (si hay pendientes) o "Sin diplomas pendientes" (si todos ya están emitidos). El test pasa en ambos casos — la idempotencia ya está garantizada por `issueDiplomasForCourse` en server.

### Tests serializados con `describe.serial`

El flujo completo depende de estado compartido entre tests (el diploma emitido en el paso 3 se verifica en el paso 6). Playwright permite `test.describe.serial(...)` para ejecutar en orden estricto. La variable `capturedDiplomaCode` se rellena en el test 4 (alumno) y se reutiliza en 5/6.

### Login redirige por rol

Antes de Fase 9 el login siempre mandaba a `/dashboard` y dejaba que el middleware redirigiera al rol correcto. Eso funcionaba para INSTRUCTOR (no permitido en `/dashboard`) pero NO para SUPER_ADMIN (sí permitido), que aterrizaba en la vista de alumno.

Como parte de Fase 9 se cambió `loginAction` para devolver el rol del usuario y `LoginForm` para hacer `router.push` al panel correcto:

```ts
const dest =
  result.role === 'SUPER_ADMIN' ? '/admin'
  : result.role === 'INSTRUCTOR' ? '/instructor'
  : '/dashboard';
```

El rol se lee directamente de BD por email en lugar de `auth()` porque las cookies recién escritas por `signIn()` no están disponibles en el mismo request context.

### Tests E2E no entran en el pipeline de Vercel

`vercel.json` ejecuta `typecheck + unit tests` antes del build. Añadir E2E aquí multiplicaría el tiempo de deploy y requeriría una BD accesible desde el entorno de build de Vercel, complicación innecesaria.

E2E se ejecutan localmente antes de mergear cambios sensibles, o en un CI dedicado a futuro (GitHub Actions con servicio Postgres). Documentado en `package.json` con `"test:e2e"` claramente separado de `"test"`.

### Selectores: prefer `getByRole` con regex case-insensitive

Los selectores del helper de auth usan `input#email` y `input#password` directamente porque `getByLabel('Contraseña')` matchea ambiguamente con el botón "Mostrar contraseña" del componente PasswordInput. Para el resto de elementos, usamos `getByRole(...)` con regex flexibles para no romper si cambia el copy.

## Lo que NO está en Fase 9 (out of scope)

- **CI con GitHub Actions** — los tests están listos para correr en CI pero no hay workflow montado todavía. Cuando se monte, basta con `npm run test:e2e` tras `npm run prisma:seed:dev` contra una BD efímera.
- **Tests de los flujos de admin** (CRUD de cursos/usuarios) — el panel admin es muy denso y los flujos críticos ya están cubiertos por la suite. Si se añaden tests, irán en archivos `e2e/admin-*.spec.ts`.
- **Tests del flujo de magic link** — depende del estado del email entregado por Resend, lo que requiere mockear o consumir el log de Resend. Se pospone hasta que haya razón concreta.
- **Tests visuales / screenshot diffs** — `@playwright/test` los soporta pero añaden ruido por diferencias mínimas de antialiasing entre máquinas. Se evaluará si se necesita.

## Verificación

```
npm run typecheck     ✓ sin errores
npm run build         ✓ todas las rutas generadas
npm test              ✓ 53/53 unit tests
npm run test:e2e      ✓ 16/16 E2E tests
```

## Próximos pasos

| Bloque | Estado | Bloqueado por |
|---|---|---|
| Fase 4 — Stripe | ⏸️ pausado | SpA chilena |
| Fase 7 — Más emails transaccionales | 🟢 lista | — |
| CI con tests automáticos | 🟢 lista | — |

Y en Clavero, **el demolition (10b) ya está hecho** — siguiente parada Clavero es Fase 10c (cliente SES + verificador admin), que consume el endpoint público que dejamos en Fase 6 SES.
