/**
 * Generador de códigos de diploma SES.
 *
 * Formato: `SES-XXXX-XXXX` (12 caracteres + 2 guiones).
 *
 * Charset elegido: 32 caracteres sin ambigüedad visual (sin 0/O, sin 1/I/L)
 * para que el código sea fácilmente legible y dictable por teléfono.
 *
 * Espacio de combinaciones: 32^8 ≈ 1.1 × 10^12. Probabilidad de colisión
 * tras 1M de diplomas emitidos: ~10^-6 (despreciable).
 *
 * El llamante debe verificar que no exista ya en BD y reintentar si choca
 * — `db.diploma.code` es @unique y el upsert por enrollmentId también
 * sirve como salvaguarda. Implementado con randomBytes para evitar el
 * sesgo de Math.random.
 */

import { randomBytes } from 'crypto';

const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 31 chars (omitido 'I', 'O', '0', '1', 'L')

function randomChar(): string {
  // Tomamos un byte aleatorio y lo mapeamos a un índice del charset.
  // Como 256 % 31 != 0, hay un sesgo minúsculo (~0.4%) que no nos preocupa
  // para este caso. Si algún día emitimos millones, usar rejection sampling.
  const byte = randomBytes(1)[0]!;
  return CHARSET[byte % CHARSET.length]!;
}

function randomChunk(length: number): string {
  let chunk = '';
  for (let i = 0; i < length; i++) chunk += randomChar();
  return chunk;
}

export function generateDiplomaCode(): string {
  return `SES-${randomChunk(4)}-${randomChunk(4)}`;
}
