// Inyectar envs requeridas por `lib/env.ts` ANTES de cualquier import
// de módulos que lo carguen transitivamente. Algunas tests cargan
// `lib/diploma/issue.ts` (vía las server actions) que tira de `env`,
// y sin esto el módulo lanza al validar.
process.env.NEXT_PUBLIC_APP_URL ??= 'https://test.example.com';

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
