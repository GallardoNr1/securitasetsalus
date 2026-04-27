// Script puntual para convertir el fondo blanco de los logos PNG a transparente.
// Se ejecuta una vez (después de añadir un logo nuevo). No es parte del runtime.
//
// Estrategia: flood-fill desde las 4 esquinas hacia adentro. Solo se vuelve
// transparente el blanco CONECTADO al borde de la imagen; cualquier blanco
// aislado dentro del diseño (p. ej. los polluelos del águila) se conserva.
//
// Uso: node scripts/make-logo-transparent.mjs

import sharp from 'sharp';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const FILES = [
  'public/brand/logo-mark.png',
  'public/brand/logo-seal.png',
  'docs/brand-assets/logo-mark.png',
  'docs/brand-assets/logo-seal.png',
];

// Umbral: cualquier pixel con los 3 canales por encima de 235 se considera
// "candidato a fondo". Solo los conectados al borde se vuelven transparentes.
const WHITE_THRESHOLD = 235;

function isWhitish(data, idx) {
  return (
    data[idx] >= WHITE_THRESHOLD &&
    data[idx + 1] >= WHITE_THRESHOLD &&
    data[idx + 2] >= WHITE_THRESHOLD
  );
}

async function makeTransparent(inputPath) {
  const absInput = path.resolve(inputPath);
  await fs.access(absInput);

  const image = sharp(absInput).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  if (channels !== 4) {
    throw new Error(`Esperaba 4 canales tras ensureAlpha(), obtuve ${channels}`);
  }

  const out = Buffer.from(data);
  const visited = new Uint8Array(width * height);

  // BFS iterativa desde cada píxel del borde que sea blanquecino.
  const queue = [];
  function enqueue(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const pos = y * width + x;
    if (visited[pos]) return;
    const idx = pos * 4;
    if (!isWhitish(out, idx)) return;
    visited[pos] = 1;
    queue.push(pos);
  }

  // Sembrado: todos los píxeles del marco
  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  let transparentified = 0;
  while (queue.length > 0) {
    const pos = queue.shift();
    const x = pos % width;
    const y = Math.floor(pos / width);
    const idx = pos * 4;
    out[idx + 3] = 0; // alpha = 0
    transparentified++;

    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  await sharp(out, { raw: { width, height, channels: 4 } }).png().toFile(absInput);

  const total = width * height;
  const pct = ((transparentified / total) * 100).toFixed(1);
  console.log(`✓ ${inputPath} — ${transparentified}/${total} px transparentes (${pct}%)`);
}

for (const file of FILES) {
  try {
    await makeTransparent(file);
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
  }
}
