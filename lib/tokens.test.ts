import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mockeamos `lib/db` antes de importar `lib/tokens` — el módulo bajo test
// hace `import { db } from '@/lib/db'` y necesitamos interceptar esa
// dependencia para no tocar Postgres real.
//
// La estrategia: cada test sustituye `db.passwordResetToken.*` con vi.fn()
// que devuelve lo que necesita la rama bajo test. Eso aísla la lógica de
// tokens de la persistencia.
const fakeDb = {
  passwordResetToken: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  emailVerificationToken: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  user: {
    update: vi.fn(),
  },
  $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
};

vi.mock('@/lib/db', () => ({ db: fakeDb }));

// Importamos DESPUÉS del mock para que `tokens.ts` use el fake.
const tokens = await import('./tokens');

beforeEach(() => {
  vi.clearAllMocks();
});

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('createPasswordResetToken', () => {
  it('genera token hex de 64 caracteres', async () => {
    fakeDb.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
    fakeDb.passwordResetToken.create.mockResolvedValue({});

    const { rawToken } = await tokens.createPasswordResetToken('user-1');
    expect(rawToken).toMatch(/^[0-9a-f]{64}$/);
  });

  it('expira a 60 minutos vista', async () => {
    fakeDb.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
    fakeDb.passwordResetToken.create.mockResolvedValue({});

    const before = Date.now();
    const { expiresAt } = await tokens.createPasswordResetToken('user-1');
    const after = Date.now();

    const sixtyMin = 60 * 60 * 1000;
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + sixtyMin - 100);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + sixtyMin + 100);
  });

  it('invalida tokens previos del mismo usuario', async () => {
    fakeDb.passwordResetToken.updateMany.mockResolvedValue({ count: 2 });
    fakeDb.passwordResetToken.create.mockResolvedValue({});

    await tokens.createPasswordResetToken('user-1');

    expect(fakeDb.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', consumedAt: null },
      data: { consumedAt: expect.any(Date) },
    });
  });

  it('guarda el HASH del token, nunca el valor en claro', async () => {
    fakeDb.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
    fakeDb.passwordResetToken.create.mockResolvedValue({});

    const { rawToken } = await tokens.createPasswordResetToken('user-1');

    const createCall = fakeDb.passwordResetToken.create.mock.calls[0]?.[0] as {
      data: { tokenHash: string };
    };
    expect(createCall.data.tokenHash).toBe(sha256(rawToken));
    expect(createCall.data.tokenHash).not.toContain(rawToken);
  });
});

describe('consumePasswordResetToken', () => {
  it('token inexistente → invalid', async () => {
    fakeDb.passwordResetToken.findUnique.mockResolvedValue(null);
    const result = await tokens.consumePasswordResetToken('not-a-real-token');
    expect(result).toEqual({ ok: false, reason: 'invalid' });
  });

  it('token ya consumido → used', async () => {
    fakeDb.passwordResetToken.findUnique.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      tokenHash: sha256('raw'),
      expiresAt: new Date(Date.now() + 1000),
      consumedAt: new Date(),
      createdAt: new Date(),
    });
    const result = await tokens.consumePasswordResetToken('raw');
    expect(result).toEqual({ ok: false, reason: 'used' });
  });

  it('token expirado → expired', async () => {
    fakeDb.passwordResetToken.findUnique.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      tokenHash: sha256('raw'),
      expiresAt: new Date(Date.now() - 1000),
      consumedAt: null,
      createdAt: new Date(),
    });
    const result = await tokens.consumePasswordResetToken('raw');
    expect(result).toEqual({ ok: false, reason: 'expired' });
  });

  it('token válido → marca consumedAt y devuelve userId', async () => {
    fakeDb.passwordResetToken.findUnique.mockResolvedValue({
      id: 't1',
      userId: 'user-42',
      tokenHash: sha256('raw'),
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      createdAt: new Date(),
    });
    fakeDb.passwordResetToken.update.mockResolvedValue({});

    const result = await tokens.consumePasswordResetToken('raw');
    expect(result).toEqual({ ok: true, userId: 'user-42' });
    expect(fakeDb.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { consumedAt: expect.any(Date) },
    });
  });
});

describe('inspectPasswordResetToken', () => {
  it('token inexistente → invalid (no consume)', async () => {
    fakeDb.passwordResetToken.findUnique.mockResolvedValue(null);
    const result = await tokens.inspectPasswordResetToken('x');
    expect(result).toEqual({ valid: false, reason: 'invalid' });
    expect(fakeDb.passwordResetToken.update).not.toHaveBeenCalled();
  });

  it('token válido → valid (sin consumir)', async () => {
    fakeDb.passwordResetToken.findUnique.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      tokenHash: sha256('raw'),
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      createdAt: new Date(),
    });
    const result = await tokens.inspectPasswordResetToken('raw');
    expect(result).toEqual({ valid: true });
    expect(fakeDb.passwordResetToken.update).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------
// Email verification tokens
// ---------------------------------------------------------------------

describe('createEmailVerificationToken', () => {
  it('genera token hex de 64 caracteres', async () => {
    fakeDb.emailVerificationToken.updateMany.mockResolvedValue({ count: 0 });
    fakeDb.emailVerificationToken.create.mockResolvedValue({});

    const { rawToken } = await tokens.createEmailVerificationToken('user-1');
    expect(rawToken).toMatch(/^[0-9a-f]{64}$/);
  });

  it('expira a 24 horas vista', async () => {
    fakeDb.emailVerificationToken.updateMany.mockResolvedValue({ count: 0 });
    fakeDb.emailVerificationToken.create.mockResolvedValue({});

    const before = Date.now();
    const { expiresAt } = await tokens.createEmailVerificationToken('user-1');
    const after = Date.now();

    const dayMs = 24 * 60 * 60 * 1000;
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(before + dayMs - 100);
    expect(expiresAt.getTime()).toBeLessThanOrEqual(after + dayMs + 100);
  });

  it('invalida tokens previos del mismo user antes de crear el nuevo', async () => {
    fakeDb.emailVerificationToken.updateMany.mockResolvedValue({ count: 1 });
    fakeDb.emailVerificationToken.create.mockResolvedValue({});

    await tokens.createEmailVerificationToken('user-42');

    expect(fakeDb.emailVerificationToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-42', consumedAt: null },
      data: { consumedAt: expect.any(Date) },
    });
  });

  it('persiste hash SHA-256, nunca el token raw', async () => {
    fakeDb.emailVerificationToken.updateMany.mockResolvedValue({ count: 0 });
    fakeDb.emailVerificationToken.create.mockResolvedValue({});

    const { rawToken } = await tokens.createEmailVerificationToken('u1');
    const createCall = fakeDb.emailVerificationToken.create.mock.calls[0]?.[0] as {
      data: { tokenHash: string };
    };
    expect(createCall.data.tokenHash).toBe(sha256(rawToken));
    expect(createCall.data.tokenHash).not.toContain(rawToken);
  });
});

describe('consumeEmailVerificationToken', () => {
  it('token inexistente → invalid', async () => {
    fakeDb.emailVerificationToken.findUnique.mockResolvedValue(null);
    expect(await tokens.consumeEmailVerificationToken('xxx')).toEqual({
      ok: false,
      reason: 'invalid',
    });
  });

  it('token ya consumido → used', async () => {
    fakeDb.emailVerificationToken.findUnique.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      tokenHash: sha256('raw'),
      expiresAt: new Date(Date.now() + 1000),
      consumedAt: new Date(),
      user: { id: 'u1', emailVerifiedAt: null },
    });
    expect(await tokens.consumeEmailVerificationToken('raw')).toEqual({
      ok: false,
      reason: 'used',
    });
  });

  it('token expirado → expired', async () => {
    fakeDb.emailVerificationToken.findUnique.mockResolvedValue({
      id: 't1',
      userId: 'u1',
      tokenHash: sha256('raw'),
      expiresAt: new Date(Date.now() - 1000),
      consumedAt: null,
      user: { id: 'u1', emailVerifiedAt: null },
    });
    expect(await tokens.consumeEmailVerificationToken('raw')).toEqual({
      ok: false,
      reason: 'expired',
    });
  });

  it('token válido + user no verificado → marca emailVerifiedAt + alreadyVerified=false', async () => {
    fakeDb.emailVerificationToken.findUnique.mockResolvedValue({
      id: 't1',
      userId: 'user-99',
      tokenHash: sha256('raw'),
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      user: { id: 'user-99', emailVerifiedAt: null },
    });
    fakeDb.emailVerificationToken.update.mockResolvedValue({});
    fakeDb.user.update.mockResolvedValue({});

    const result = await tokens.consumeEmailVerificationToken('raw');

    expect(result).toEqual({ ok: true, userId: 'user-99', alreadyVerified: false });
    // Comprueba que llamó a user.update con emailVerifiedAt setado
    expect(fakeDb.user.update).toHaveBeenCalledWith({
      where: { id: 'user-99' },
      data: { emailVerifiedAt: expect.any(Date) },
    });
  });

  it('token válido + user YA verificado → idempotente, alreadyVerified=true, NO toca emailVerifiedAt', async () => {
    const originalVerification = new Date('2026-01-01T00:00:00Z');
    fakeDb.emailVerificationToken.findUnique.mockResolvedValue({
      id: 't1',
      userId: 'user-99',
      tokenHash: sha256('raw'),
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      user: { id: 'user-99', emailVerifiedAt: originalVerification },
    });
    fakeDb.emailVerificationToken.update.mockResolvedValue({});

    const result = await tokens.consumeEmailVerificationToken('raw');

    expect(result).toEqual({ ok: true, userId: 'user-99', alreadyVerified: true });
    // Crítico: NO toca emailVerifiedAt — preserva la fecha original (auditoría)
    expect(fakeDb.user.update).not.toHaveBeenCalled();
    // Pero SÍ marca el token como consumido (no se puede reutilizar)
    expect(fakeDb.emailVerificationToken.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { consumedAt: expect.any(Date) },
    });
  });
});
