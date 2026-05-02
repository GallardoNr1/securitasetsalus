import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// `vi.hoisted` se ejecuta ANTES de los `vi.mock` y permite compartir
// mock fns tipadas. Sin esto, `vi.mocked(db)` no infiere los métodos
// nested de Prisma y TS no aprueba `.mockResolvedValue`.
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  courseSessionFindUnique: vi.fn(),
  enrollmentFindMany: vi.fn(),
  attendanceUpsert: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}));

vi.mock('@/lib/db', () => ({
  db: {
    courseSession: { findUnique: mocks.courseSessionFindUnique },
    enrollment: { findMany: mocks.enrollmentFindMany },
    attendance: { upsert: mocks.attendanceUpsert },
    $transaction: mocks.transaction,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { markAttendanceAction } from './actions';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

const sessionUser = {
  user: { id: 'instr-1', role: 'INSTRUCTOR', email: 'i@ses.cl', name: 'Instructor' },
};

const adminUser = {
  user: { id: 'admin-1', role: 'SUPER_ADMIN', email: 'a@ses.cl', name: 'Admin' },
};

const courseSessionFixture = {
  id: 'sess-1',
  courseId: 'course-1',
  course: { instructorId: 'instr-1' },
};

describe('markAttendanceAction', () => {
  describe('autorización', () => {
    it('rechaza con unauthorized si no hay sesión', async () => {
      mocks.auth.mockResolvedValue(null);

      const r = await markAttendanceAction({
        sessionId: 'sess-1',
        entries: [{ enrollmentId: 'e1', attended: true }],
      });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe('unauthorized');
    });

    it('rechaza con forbidden si el user no es instructor del curso ni admin', async () => {
      mocks.auth.mockResolvedValue({
        user: { id: 'otro-user', role: 'INSTRUCTOR' },
      });
      mocks.courseSessionFindUnique.mockResolvedValue(courseSessionFixture);

      const r = await markAttendanceAction({
        sessionId: 'sess-1',
        entries: [{ enrollmentId: 'e1', attended: true }],
      });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe('forbidden');
    });

    it('admin SUPER_ADMIN puede pasar lista aunque no sea instructor del curso', async () => {
      mocks.auth.mockResolvedValue(adminUser);
      mocks.courseSessionFindUnique.mockResolvedValue(courseSessionFixture);
      mocks.enrollmentFindMany.mockResolvedValue([{ id: 'e1' }]);
      mocks.transaction.mockResolvedValue([]);

      const r = await markAttendanceAction({
        sessionId: 'sess-1',
        entries: [{ enrollmentId: 'e1', attended: true }],
      });

      expect(r.ok).toBe(true);
    });
  });

  describe('validación', () => {
    it('rechaza con session-not-found si la sesión del curso no existe', async () => {
      mocks.auth.mockResolvedValue(sessionUser);
      mocks.courseSessionFindUnique.mockResolvedValue(null);

      const r = await markAttendanceAction({
        sessionId: 'sess-x',
        entries: [{ enrollmentId: 'e1', attended: true }],
      });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe('session-not-found');
    });

    it('rechaza con invalid si el payload no encaja con el schema', async () => {
      mocks.auth.mockResolvedValue(sessionUser);

      const r = await markAttendanceAction({
        sessionId: '',
        entries: [],
      });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe('invalid');
      // No debe haber tocado la BD si la validación falló.
      expect(mocks.courseSessionFindUnique).not.toHaveBeenCalled();
    });
  });

  describe('happy path', () => {
    it('filtra enrollments inválidos y solo persiste los del curso', async () => {
      mocks.auth.mockResolvedValue(sessionUser);
      mocks.courseSessionFindUnique.mockResolvedValue(courseSessionFixture);
      // Solo e1 y e2 son del curso. e3 y e4 vienen del cliente pero no
      // son válidos (otro curso o status no aceptado).
      mocks.enrollmentFindMany.mockResolvedValue([{ id: 'e1' }, { id: 'e2' }]);
      mocks.transaction.mockResolvedValue([]);

      const r = await markAttendanceAction({
        sessionId: 'sess-1',
        entries: [
          { enrollmentId: 'e1', attended: true },
          { enrollmentId: 'e2', attended: false },
          { enrollmentId: 'e3', attended: true }, // ignorado
          { enrollmentId: 'e4', attended: true }, // ignorado
        ],
      });

      expect(r.ok).toBe(true);
      if (r.ok) expect(r.markedCount).toBe(2);

      // El query del filtro debe pedir solo enrollments del courseId con
      // status CONFIRMED o COMPLETED — defensa de integridad.
      expect(mocks.enrollmentFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ['e1', 'e2', 'e3', 'e4'] },
            courseId: 'course-1',
            status: { in: ['CONFIRMED', 'COMPLETED'] },
          }),
        }),
      );
    });

    it('devuelve error unknown si la transacción Prisma falla', async () => {
      mocks.auth.mockResolvedValue(sessionUser);
      mocks.courseSessionFindUnique.mockResolvedValue(courseSessionFixture);
      mocks.enrollmentFindMany.mockResolvedValue([{ id: 'e1' }]);
      mocks.transaction.mockRejectedValue(new Error('DB out'));

      const r = await markAttendanceAction({
        sessionId: 'sess-1',
        entries: [{ enrollmentId: 'e1', attended: true }],
      });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe('unknown');
    });
  });
});
