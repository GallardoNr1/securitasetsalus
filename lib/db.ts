import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7: el cliente necesita un driver adapter en runtime.
// @prisma/adapter-pg envuelve `pg` y traduce el protocolo wire de Postgres.
// Placeholder sintáctico para entornos sin BD: el adapter se instancia pero
// fallará solo cuando se haga una consulta real.
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
