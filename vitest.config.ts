import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Vitest config para tests unitarios y de componentes React.
 * Heredada de Clavero — mismas reglas de scope de coverage.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'e2e', 'dist', '.claude/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: ['lib/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
        // Cubierto por E2E (Playwright), no por unit tests:
        'app/**/page.tsx',
        'app/**/layout.tsx',
        'app/**/loading.tsx',
        'app/**/not-found.tsx',
        'app/**/error.tsx',
        'app/**/route.ts',
        'app/**/actions.ts',
        'app/**/*.tsx',
        'app/icon.tsx',
        'app/apple-icon.tsx',
        'app/sitemap.ts',
        'app/robots.ts',
        // Componentes "feature" compuestos: viven dentro de pages y se
        // cubren por E2E. El design system primitivo (components/ui/*)
        // sí entra en cobertura unitaria.
        'components/features/**',
        // Wrappers de Prisma:
        'lib/queries/**',
        // Clientes externos / config / IO puro:
        'lib/email/**',
        'lib/pdf/**',
        'lib/r2.ts',
        'lib/stripe.ts',
        'lib/auth.ts',
        'lib/env.ts',
        'lib/qr.ts',
        'app/**/page.module.scss',
      ],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
});
