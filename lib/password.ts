import bcrypt from 'bcryptjs';

// 12 rondas: compromiso razonable entre seguridad y velocidad en servidor
// Node. Cada incremento de 1 duplica el coste.
const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
