import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  userCount: vi.fn(),
  sessionDeleteMany: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}));

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
      count: mocks.userCount,
    },
    session: { deleteMany: mocks.sessionDeleteMany },
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

import { reactivateUserAction, suspendUserAction } from './actions';

const adminSession = {
  user: { id: 'admin-1', role: 'SUPER_ADMIN', email: 'a@ses.cl', name: 'Admin' },
};

const studentSession = {
  user: { id: 'student-1', role: 'STUDENT', email: 's@ses.cl', name: 'Student' },
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('suspendUserAction', () => {
  describe('autorización', () => {
    it('rechaza con unauthorized si no hay sesión', async () => {
      mocks.auth.mockResolvedValue(null);

      const r = await suspendUserAction('user-2', null);

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe('unauthorized');
    });

    it('rechaza con unauthorized si el caller no es SUPER_ADMIN', async () => {
      mocks.auth.mockResolvedValue(studentSession);

      const r = await suspendUserAction('user-2', null);

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe('unauthorized');
      // No debe siquiera mirar la BD si no está autorizado.
      expect(mocks.userFindUnique).not.toHaveBeenCalled();
    });
  });

  describe('safeguards', () => {
    it('rechaza con error self si el admin intenta suspenderse a sí mismo', async () => {
      mocks.auth.mockResolvedValue(adminSession);

      const r = await suspendUserAction('admin-1', 'me suspendo');

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe('self');
      expect(mocks.userUpdate).not.toHaveBeenCalled();
    });

    it('rechaza con not-found si el targeted user no existe', async () => {
      mocks.auth.mockResolvedValue(adminSession);
      mocks.userFindUnique.mockResolvedValue(null);

      const r = await suspendUserAction('user-x', null);

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe('not-found');
    });

    it('rechaza con last-admin si suspender dejaría 0 admins activos', async () => {
      mocks.auth.mockResolvedValue(adminSession);
      mocks.userFindUnique.mockResolvedValue({
        id: 'other-admin',
        role: 'SUPER_ADMIN',
        suspendedAt: null,
      });
      mocks.userCount.mockResolvedValue(1); // solo queda 1 admin activo

      const r = await suspendUserAction('other-admin', null);

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe('last-admin');
      expect(mocks.userUpdate).not.toHaveBeenCalled();
    });

    it('permite suspender un admin si hay 2+ admins activos', async () => {
      mocks.auth.mockResolvedValue(adminSession);
      mocks.userFindUnique.mockResolvedValue({
        id: 'other-admin',
        role: 'SUPER_ADMIN',
        suspendedAt: null,
      });
      mocks.userCount.mockResolvedValue(2);
      mocks.userUpdate.mockResolvedValue({});
      mocks.sessionDeleteMany.mockResolvedValue({ count: 1 });

      const r = await suspendUserAction('other-admin', null);

      expect(r.ok).toBe(true);
    });
  });

  describe('happy path', () => {
    it('suspende un STUDENT con motivo, marca suspendedAt y borra sesiones', async () => {
      mocks.auth.mockResolvedValue(adminSession);
      mocks.userFindUnique.mockResolvedValue({
        id: 'user-2',
        role: 'STUDENT',
        suspendedAt: null,
      });
      mocks.userUpdate.mockResolvedValue({});
      mocks.sessionDeleteMany.mockResolvedValue({ count: 3 });

      const r = await suspendUserAction('user-2', 'incumplimiento del código de conducta');

      expect(r.ok).toBe(true);

      // Update con suspendedAt y reason.
      expect(mocks.userUpdate).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: {
          suspendedAt: expect.any(Date),
          suspendedReason: 'incumplimiento del código de conducta',
        },
      });

      // Sesiones borradas para invalidar JWT/cookies del adapter.
      expect(mocks.sessionDeleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-2' },
      });

      // No verifica admin count en STUDENT — solo cuando target es SUPER_ADMIN.
      expect(mocks.userCount).not.toHaveBeenCalled();
    });

    it('motivo se trimea y trunca a 500 chars; vacío → null', async () => {
      mocks.auth.mockResolvedValue(adminSession);
      mocks.userFindUnique.mockResolvedValue({
        id: 'user-2',
        role: 'STUDENT',
        suspendedAt: null,
      });
      mocks.userUpdate.mockResolvedValue({});
      mocks.sessionDeleteMany.mockResolvedValue({ count: 0 });

      // Motivo solo whitespace → null
      await suspendUserAction('user-2', '   ');
      expect(mocks.userUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ suspendedReason: null }),
        }),
      );

      // Motivo > 500 chars → truncado
      const longReason = 'X'.repeat(800);
      await suspendUserAction('user-2', longReason);
      const lastCall = mocks.userUpdate.mock.calls.at(-1)?.[0];
      expect(lastCall?.data.suspendedReason).toHaveLength(500);
    });
  });
});

describe('reactivateUserAction', () => {
  it('rechaza con unauthorized si no es SUPER_ADMIN', async () => {
    mocks.auth.mockResolvedValue(studentSession);

    const r = await reactivateUserAction('user-2');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('unauthorized');
  });

  it('rechaza con not-found si el user no existe', async () => {
    mocks.auth.mockResolvedValue(adminSession);
    mocks.userFindUnique.mockResolvedValue(null);

    const r = await reactivateUserAction('user-x');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('not-found');
  });

  it('reactiva: pone suspendedAt y suspendedReason a null', async () => {
    mocks.auth.mockResolvedValue(adminSession);
    mocks.userFindUnique.mockResolvedValue({ id: 'user-2' });
    mocks.userUpdate.mockResolvedValue({});

    const r = await reactivateUserAction('user-2');

    expect(r.ok).toBe(true);
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-2' },
      data: { suspendedAt: null, suspendedReason: null },
    });
  });
});
