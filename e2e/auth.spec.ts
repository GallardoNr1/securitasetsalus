import { test, expect } from '@playwright/test';
import { login, logout, TEST_USERS } from './helpers/auth';

test.describe('Autenticación y redirección por rol', () => {
  test('SUPER_ADMIN aterriza en /admin tras login', async ({ page }) => {
    await login(page, TEST_USERS.superAdmin);
    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/hola/i);
  });

  test('INSTRUCTOR aterriza en /instructor tras login', async ({ page }) => {
    await login(page, TEST_USERS.instructor);
    await expect(page).toHaveURL(/\/instructor\/?$/);
  });

  test('STUDENT aterriza en /dashboard tras login', async ({ page }) => {
    await login(page, TEST_USERS.student1);
    await expect(page).toHaveURL(/\/dashboard\/?$/);
  });

  test('logout cierra sesión y rutas protegidas redirigen a /login', async ({ page }) => {
    await login(page, TEST_USERS.instructor);
    await logout(page);
    // logoutAction lleva a `/` (landing). Verificamos que la sesión está
    // cerrada accediendo a una ruta protegida — debería rebotar a /login.
    await page.goto('/instructor');
    await expect(page).toHaveURL(/\/login/);
  });

  test('credenciales inválidas muestran error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input#email').fill('inexistente@example.com');
    await page.locator('input#password').fill('contraseñaErroneaMuyLarga123!');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    // El loginAction devuelve mensaje "Email o contraseña incorrectos" que
    // se renderiza en un banner. Esperamos a que aparezca.
    await expect(
      page.getByText(/incorrect|inválid|no pudimos|credenc/i),
    ).toBeVisible({ timeout: 10_000 });
    // El URL no cambia.
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Acceso por rol a rutas protegidas', () => {
  test('alumno no puede acceder a /admin', async ({ page }) => {
    await login(page, TEST_USERS.student1);
    await page.goto('/admin');
    // El middleware redirige a su dashboard.
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('instructor no puede acceder a /admin', async ({ page }) => {
    await login(page, TEST_USERS.instructor);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/instructor/);
  });

  test('sin sesión, /admin redirige a /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });
});
