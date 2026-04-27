import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('hashPassword + verifyPassword', () => {
  it('hash devuelve un string distinto al plain', async () => {
    const hash = await hashPassword('mi-pass-1234');
    expect(hash).not.toBe('mi-pass-1234');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifyPassword acepta el plain correcto', async () => {
    const hash = await hashPassword('correcto-1234');
    await expect(verifyPassword('correcto-1234', hash)).resolves.toBe(true);
  });

  it('verifyPassword rechaza un plain incorrecto', async () => {
    const hash = await hashPassword('correcto-1234');
    await expect(verifyPassword('incorrecto', hash)).resolves.toBe(false);
  });

  it('dos hashes del mismo plain son distintos (salt aleatorio)', async () => {
    const a = await hashPassword('mismo-pass');
    const b = await hashPassword('mismo-pass');
    expect(a).not.toBe(b);
    // Pero ambos verifican con el plain original
    await expect(verifyPassword('mismo-pass', a)).resolves.toBe(true);
    await expect(verifyPassword('mismo-pass', b)).resolves.toBe(true);
  });
});
