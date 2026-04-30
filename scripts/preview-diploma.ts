import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { renderDiplomaPdf } from '../lib/diploma/pdf';

/**
 * Genera un PDF de muestra del diploma con datos ficticios y lo escribe
 * en `tmp/diploma-sample.pdf`. Útil para previsualizar el diseño sin
 * tener que tocar la DB.
 *
 * Uso: npx tsx scripts/preview-diploma.ts
 */
async function main() {
  const outDir = path.join(process.cwd(), 'tmp');
  const outPath = path.join(outDir, 'diploma-sample.pdf');

  // Aseguramos que tmp/ existe.
  try {
    const fs = await import('node:fs/promises');
    await fs.mkdir(outDir, { recursive: true });
  } catch {
    /* noop */
  }

  console.log('🎨 Renderizando diploma de prueba…');
  const buffer = await renderDiplomaPdf({
    studentName: 'Carla Pérez González',
    courseTitle: 'Aperturas Básicas — Cilindros Estándar',
    durationHours: 24,
    finalGrade: 6.4,
    issuedAt: new Date('2026-04-30T12:00:00-04:00'),
    code: 'SES-7YZS-ESUB',
    verifyUrl: 'https://securitasetsalus.cl/verify/SES-7YZS-ESUB',
    instructorName: 'Andrés Soto Vergara',
    venueName: 'Santiago — Providencia',
  });

  writeFileSync(outPath, buffer);
  console.log(`✅ Escrito: ${outPath}`);
  console.log(`   Tamaño: ${(buffer.length / 1024).toFixed(1)} kB`);
  console.log(`\n👉 Abre el PDF: start "${outPath}"`);
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
