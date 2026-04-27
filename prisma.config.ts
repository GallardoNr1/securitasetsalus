import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Cargar .env.local primero (convención de Next.js) y luego .env como fallback.
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

// Placeholder tolerado en build: `prisma generate` no conecta a la BD, solo
// necesita una URL válida sintácticamente.
const PLACEHOLDER = 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

// Las migraciones requieren una conexión directa (puerto 5432) o session-pooler.
// En runtime (lib/db.ts) sí usamos la DATABASE_URL con pooling.
const MIGRATION_URL = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? PLACEHOLDER;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: MIGRATION_URL,
  },
});
