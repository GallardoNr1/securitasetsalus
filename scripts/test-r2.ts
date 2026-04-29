import 'dotenv/config';
import { uploadBuffer, getSignedDownloadUrl, deleteObject, r2Keys } from '../lib/r2';

async function main() {
  const testKey = `_smoke-test/${Date.now()}.txt`;
  const body = Buffer.from(`Hola desde SES — ${new Date().toISOString()}`);

  console.log('🚀 Subiendo archivo de prueba...');
  await uploadBuffer('avatars', testKey, body, 'text/plain');
  console.log(`✅ Subido: ${testKey}`);

  console.log('🔐 Firmando URL...');
  const url = await getSignedDownloadUrl('avatars', testKey, { expiresInSeconds: 60 });
  console.log(`✅ URL firmada (60s): ${url}`);

  console.log('📥 Descargando...');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Descarga falló: HTTP ${res.status}`);
  const text = await res.text();
  console.log(`✅ Contenido: "${text}"`);

  console.log('🗑  Limpiando...');
  await deleteObject('avatars', testKey);
  console.log('✅ Borrado.');

  console.log('\n🎉 R2 operativo end-to-end.');
}

main().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
