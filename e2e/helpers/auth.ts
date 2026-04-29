import type { Page } from '@playwright/test';

/**
 * Credenciales de los usuarios sembrados por `npm run prisma:seed:dev`.
 *
 * Antes de correr la suite E2E se asume que ese seed se ejecutó al menos
 * una vez contra la BD local — los tests no resetean datos por sí mismos.
 */
export const TEST_USERS = {
  superAdmin: {
    email: process.env.SEED_SUPER_ADMIN_EMAIL ?? 'dev@securitasetsalus.cl',
    password: process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'Su121012se!',
  },
  instructor: {
    email: 'instructor.demo@securitasetsalus.cl',
    password: 'Instructor123!',
  },
  student1: {
    email: 'alumno1.demo@securitasetsalus.cl',
    password: 'Alumno123!',
  },
} as const;

/**
 * Hace login con credenciales y espera a que la redirección termine en la
 * URL esperada (depende del rol).
 */
export async function login(
  page: Page,
  user: { email: string; password: string },
): Promise<void> {
  await page.goto('/login');
  // Selectores por id en lugar de label porque "Contraseña" matchea
  // también el botón "Mostrar contraseña" del PasswordInput.
  await page.locator('input#email').fill(user.email);
  await page.locator('input#password').fill(user.password);
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  // Espera a que el cookie de sesión esté escrito y haya redirección.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
    timeout: 15_000,
  });
}

/**
 * Cierra sesión usando el dropdown del avatar.
 *
 * El logoutAction redirige a `/` (landing pública), no a `/login`. Tras
 * la redirección la sesión está cerrada y volver a `/admin` u otras
 * rutas protegidas debería redirigir a `/login`.
 */
export async function logout(page: Page): Promise<void> {
  await page.getByRole('button', { name: /abrir menú de usuario/i }).click();
  await page.getByRole('menuitem', { name: /cerrar sesión/i }).click();
  await page.waitForURL((url) => url.pathname === '/' || url.pathname.startsWith('/login'), {
    timeout: 10_000,
  });
}
