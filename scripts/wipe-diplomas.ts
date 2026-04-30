import 'dotenv/config';
import { db } from '../lib/db';

/**
 * Borra todas las filas de `Diploma` para que el flujo de emisión las
 * vuelva a generar — útil cuando se rediseña el PDF y queremos verlo
 * con datos reales.
 *
 * Los enrollments asociados quedan en `COMPLETED` (que es la condición
 * que mira `issueDiplomasForCourse`), así que el instructor solo tiene
 * que volver a tocar el botón "Emitir diplomas" desde
 * `/instructor/courses/[id]`.
 *
 * NOTA: los PDFs viejos quedan huérfanos en R2. Para dev no importa;
 * en prod no se debería ejecutar nunca esto.
 *
 * Uso: npx tsx scripts/wipe-diplomas.ts
 */
async function main() {
  const before = await db.diploma.count();
  console.log(`📜 Diplomas actuales en DB: ${before}`);

  if (before === 0) {
    console.log('✅ No hay nada que borrar.');
    return;
  }

  const sample = await db.diploma.findMany({
    take: 5,
    orderBy: { issuedAt: 'desc' },
    select: {
      code: true,
      status: true,
      pdfKey: true,
      user: { select: { name: true } },
      course: { select: { title: true } },
    },
  });

  console.log('\n🔍 Muestra (hasta 5):');
  for (const d of sample) {
    console.log(`   - ${d.code} · ${d.user.name} · ${d.course.title} · ${d.status} · pdf=${d.pdfKey ?? '∅'}`);
  }

  const deleted = await db.diploma.deleteMany({});
  console.log(`\n🗑  Borradas ${deleted.count} filas.`);
  console.log(
    '\n👉 Re-emisión: entra a /instructor/courses/[id] como instructor del curso y pulsa "Emitir diplomas" — `issueDiplomasForCourse` regenerará los PDFs con el diseño nuevo.',
  );
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
