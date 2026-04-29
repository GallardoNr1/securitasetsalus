/**
 * Limpia todos los diplomas emitidos: borra los registros de BD y los
 * PDFs en R2. Útil en desarrollo para regenerar diplomas tras retocar
 * el layout del PDF o cambiar el algoritmo de emisión.
 *
 * NO borra Enrollments ni Evaluations — los alumnos siguen en COMPLETED
 * y al pulsar "Emitir diplomas" otra vez se regeneran limpios.
 *
 * Ejecutar: `npm run clean:diplomas`
 *
 * Pide confirmación interactiva si hay diplomas en producción real
 * (DATABASE_URL apuntando a Supabase). Para forzar sin prompt: añadir
 * `--force` como argumento.
 */

import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// IMPORTANTE: cargar env ANTES de importar lib/r2, porque r2-config lee
// process.env al evaluarse y si llega vacío deja todos los buckets como
// "no configurados" (e.g. saltaba el borrado de PDFs).
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const { deleteObject, isBucketConfigured } = await import('../lib/r2');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no está definida.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const force = process.argv.includes('--force');

  const diplomas = await prisma.diploma.findMany({
    select: { id: true, code: true, pdfKey: true, user: { select: { email: true } } },
  });

  if (diplomas.length === 0) {
    console.log('✅ No hay diplomas que borrar.');
    return;
  }

  console.log(`Encontrados ${diplomas.length} diplomas:`);
  for (const d of diplomas) {
    console.log(`  - ${d.code} (${d.user.email}) ${d.pdfKey ? '→ con PDF en R2' : '(sin PDF)'}`);
  }

  if (!force) {
    console.log('\n⚠️  Vas a borrar TODOS los diplomas listados arriba.');
    console.log('   Si seguro, vuelve a correr con --force:');
    console.log('     npm run clean:diplomas -- --force');
    return;
  }

  // 1. Borrar PDFs de R2 (best-effort: si alguno falla, seguimos).
  if (isBucketConfigured('diplomas')) {
    let r2Deleted = 0;
    for (const d of diplomas) {
      if (!d.pdfKey) continue;
      try {
        await deleteObject('diplomas', d.pdfKey);
        r2Deleted++;
      } catch (err) {
        console.warn(`  ⚠️  No pude borrar ${d.pdfKey} de R2:`, err);
      }
    }
    console.log(`✅ Borrados ${r2Deleted} PDFs de R2.`);
  } else {
    console.log('ℹ️  R2 no configurado, saltando borrado de PDFs.');
  }

  // 2. Borrar registros de BD.
  const result = await prisma.diploma.deleteMany();
  console.log(`✅ Borrados ${result.count} registros de Diploma en BD.`);

  console.log('\n🎉 Limpieza completa. Vuelve a /instructor/cursos/[id] y pulsa "Emitir diplomas".');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
