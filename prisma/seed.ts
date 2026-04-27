import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

// Cargar variables (el CLI de Prisma no las expone solo por estar en .env.local).
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no está definida. Configúrala en .env.local antes de sembrar.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SUPER_ADMIN_EMAIL = process.env.SEED_SUPER_ADMIN_EMAIL?.toLowerCase();
const SUPER_ADMIN_PASSWORD = process.env.SEED_SUPER_ADMIN_PASSWORD;
const SUPER_ADMIN_NAME = process.env.SEED_SUPER_ADMIN_NAME ?? 'Super Administrador';
const SUPER_ADMIN_REGION = process.env.SEED_SUPER_ADMIN_REGION ?? 'CL';

async function main() {
  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
    console.error(
      '❌ Faltan variables SEED_SUPER_ADMIN_EMAIL y/o SEED_SUPER_ADMIN_PASSWORD.\n' +
        '   Añádelas a .env.local antes de ejecutar `npm run prisma:seed`.',
    );
    process.exit(1);
  }

  if (SUPER_ADMIN_PASSWORD.length < 12) {
    console.warn(
      '⚠️  SEED_SUPER_ADMIN_PASSWORD tiene menos de 12 caracteres. Se admite, pero no es recomendable para el administrador principal.',
    );
  }

  const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

  // upsert: si ya existe, solo actualizamos la contraseña y el rol (idempotente).
  const user = await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    update: {
      passwordHash,
      role: 'SUPER_ADMIN',
      name: SUPER_ADMIN_NAME,
      region: SUPER_ADMIN_REGION,
    },
    create: {
      email: SUPER_ADMIN_EMAIL,
      passwordHash,
      role: 'SUPER_ADMIN',
      name: SUPER_ADMIN_NAME,
      region: SUPER_ADMIN_REGION,
      emailVerifiedAt: new Date(), // Admin manual queda pre-verificado
    },
  });

  console.log(`✅ SUPER_ADMIN listo: ${user.email} (id=${user.id}, region=${user.region})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
