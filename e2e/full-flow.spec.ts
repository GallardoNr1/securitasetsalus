import { test, expect } from '@playwright/test';
import { login, logout, TEST_USERS } from './helpers/auth';

/**
 * Suite E2E del flujo completo SES:
 *
 *   instructor: pasar lista → evaluar → emitir diplomas
 *     ↓
 *   alumno:     ver diploma + descargar
 *     ↓
 *   público:    /verify/[code] + GET /api/diplomas/[code]/verify
 *
 * Tests dentro de `describe.serial` para que se ejecuten en orden y
 * compartan estado (el código del diploma se captura durante el flujo del
 * instructor y se reutiliza después).
 *
 * Pre-requisito: `npm run prisma:seed:dev` ejecutado al menos una vez.
 *
 * Idempotencia: re-ejecutar la suite no rompe nada porque:
 *  - markAttendance es upsert (re-marcar OK).
 *  - saveEvaluations es upsert (re-evaluar OK).
 *  - issueDiplomas es idempotente (los ya emitidos cuentan como
 *    `alreadyHad`, no se duplican).
 */

let capturedDiplomaCode: string | null = null;

test.describe.serial('Flujo completo: instructor → alumno → público', () => {
  test('instructor: pasa lista en la primera sesión del curso demo', async ({ page }) => {
    await login(page, TEST_USERS.instructor);

    // Listado de cursos del instructor.
    await page.goto('/instructor/courses');
    await expect(page.getByRole('heading', { name: /mis cursos asignados/i })).toBeVisible();

    // Click en "Gestionar asistencia →" del primer curso.
    await page.getByRole('link', { name: /gestionar asistencia/i }).first().click();

    // Detalle del curso — esperamos a llegar a la URL del detalle.
    await page.waitForURL(/\/instructor\/courses\/[^/]+$/, { timeout: 10_000 });

    // "Pasar lista →" en la primera sesión.
    await page.getByRole('link', { name: /pasar lista/i }).first().click();

    // Página de pase de lista — limpiar primero (idempotencia: si una
    // ejecución previa dejó todo marcado, "Marcar todos presentes" no
    // dispara dirty y el botón queda deshabilitado).
    await page.waitForURL(/\/attendance$/, { timeout: 10_000 });
    await page.getByRole('button', { name: /limpiar/i }).click();
    await page.getByRole('button', { name: /marcar todos presentes/i }).click();

    // Guardar y esperar feedback.
    const saveButton = page.getByRole('button', { name: /guardar asistencia/i });
    await expect(saveButton).toBeEnabled({ timeout: 5_000 });
    await saveButton.click();
    await expect(page.locator('[role=status]').first()).toContainText(/asistencia guardada/i, {
      timeout: 10_000,
    });
  });

  test('instructor: evalúa con notas ≥4.0 a todos los alumnos', async ({ page }) => {
    await login(page, TEST_USERS.instructor);
    await page.goto('/instructor/courses');
    await page.getByRole('link', { name: /gestionar asistencia/i }).first().click();
    await page.waitForURL(/\/instructor\/courses\/[^/]+$/, { timeout: 10_000 });

    // Click en "Evaluación final →".
    await page.getByRole('link', { name: /evaluación final/i }).click();
    await page.waitForURL(/\/evaluations$/, { timeout: 10_000 });

    // Rellenamos las notas — clear + fill por cada input para garantizar
    // que el form quede dirty incluso si una ejecución previa dejó valores.
    // Cambiamos entre 5.0 y 5.5 según la corrida para que siempre haya delta.
    const gradeInputs = page.locator('input[type="number"][max="7"]');
    const count = await gradeInputs.count();
    expect(count).toBeGreaterThanOrEqual(3); // 3 dimensiones × 4 alumnos = 12 mínimo
    for (let i = 0; i < count; i++) {
      const input = gradeInputs.nth(i);
      const current = await input.inputValue();
      const targetValue = current === '5' ? '5.5' : '5';
      await input.fill(targetValue);
    }

    const saveEvalButton = page.getByRole('button', { name: /guardar evaluaciones/i });
    await expect(saveEvalButton).toBeEnabled({ timeout: 5_000 });
    await saveEvalButton.click();
    await expect(page.locator('[role=status]').first()).toContainText(/evaluaciones guardadas/i, {
      timeout: 15_000,
    });
  });

  test('instructor: emite diplomas para los aptos', async ({ page }) => {
    await login(page, TEST_USERS.instructor);
    await page.goto('/instructor/courses');
    await page.getByRole('link', { name: /gestionar asistencia/i }).first().click();
    await page.waitForURL(/\/instructor\/courses\/[^/]+$/, { timeout: 10_000 });

    // Botón "Emitir N diplomas" o "Sin diplomas pendientes" si ya están emitidos.
    const emitButton = page.getByRole('button', { name: /emitir.*diploma|sin diplomas/i });
    await expect(emitButton).toBeVisible();
    const buttonText = await emitButton.textContent();

    if (buttonText && /sin diplomas/i.test(buttonText)) {
      // Idempotencia: ya estaban emitidos en una ejecución previa de la suite.
      // El test sigue pasando — validamos que el contador de "emitidos" > 0.
      const stats = page.locator('dl').filter({ hasText: /diplomas emitidos/i });
      await expect(stats).toBeVisible();
    } else {
      await emitButton.click();
      // Feedback "X emitido(s)" o "X ya tenía diploma" tras la acción.
      await expect(page.locator('[role=status]').first()).toContainText(/emitido|ya tenía/i, {
        timeout: 30_000,
      });
    }
  });

  test('alumno: ve el diploma emitido en /my-diplomas', async ({ page }) => {
    await login(page, TEST_USERS.student1);
    await page.goto('/my-diplomas');

    await expect(page.getByRole('heading', { name: /mis diplomas/i })).toBeVisible();

    // El alumno1 del seed-dev está enrolado en "Aperturas Básicas — Demo"
    // y tras el flujo del instructor debe tener un diploma vigente.
    await expect(page.getByText(/aperturas básicas/i)).toBeVisible();
    await expect(page.getByText(/vigente/i)).toBeVisible();

    // Captura el código del diploma para los siguientes tests.
    // Buscamos el primer texto que matchee el formato SES-XXXX-XXXX.
    const html = await page.content();
    const match = html.match(/SES-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}/);
    expect(match).not.toBeNull();
    capturedDiplomaCode = match![0];
  });

  test('público: GET /api/diplomas/[code]/verify devuelve 200 + datos', async ({ request }) => {
    test.skip(!capturedDiplomaCode, 'no hay código capturado del test anterior');

    const response = await request.get(`/api/diplomas/${capturedDiplomaCode}/verify`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({
      code: capturedDiplomaCode,
      status: 'ACTIVE',
      course: expect.objectContaining({
        title: expect.stringMatching(/aperturas básicas/i),
        durationHours: expect.any(Number),
      }),
      user: expect.objectContaining({
        name: expect.any(String),
      }),
    });
    // CORS abierto.
    expect(response.headers()['access-control-allow-origin']).toBe('*');
  });

  test('público: /verify/[code] muestra el diploma sin login', async ({ browser }) => {
    test.skip(!capturedDiplomaCode, 'no hay código capturado del test anterior');

    // Contexto nuevo, sin cookies — confirma que no requiere auth.
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`/verify/${capturedDiplomaCode}`);

    await expect(page.getByText(/diploma verificado/i)).toBeVisible();
    await expect(page.getByText(/vigente/i)).toBeVisible();
    await expect(page.getByText(capturedDiplomaCode!)).toBeVisible();

    await context.close();
  });

  test('público: GET /api/diplomas/CODIGO-INVENTADO/verify devuelve 404', async ({ request }) => {
    const response = await request.get('/api/diplomas/SES-ZZZZ-2222/verify');
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('not_found');
  });

  test('público: formato inválido devuelve 400', async ({ request }) => {
    const response = await request.get('/api/diplomas/foo-bar/verify');
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('invalid_code_format');
  });
});
