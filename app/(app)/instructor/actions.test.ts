import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// `vi.hoisted` se ejecuta ANTES de los `vi.mock` y permite compartir
// mock fns tipadas. Sin esto, `vi.mocked(db)` no infiere los métodos
// nested de Prisma y TS no aprueba `.mockResolvedValue`.
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  courseSessionFindUnique: vi.fn(),
  courseFindUnique: vi.fn(),
  enrollmentFindMany: vi.fn(),
  attendanceUpsert: vi.fn(),
  evaluationUpsert: vi.fn(),
  enrollmentUpdate: vi.fn(),
  transaction: vi.fn(),
  issueDiplomasForCourse: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: mocks.auth,
}));

vi.mock('@/lib/db', () => ({
  db: {
    courseSession: { findUnique: mocks.courseSessionFindUnique },
    course: { findUnique: mocks.courseFindUnique },
    enrollment: { findMany: mocks.enrollmentFindMany },
    attendance: { upsert: mocks.attendanceUpsert },
    $transaction: mocks.transaction,
  },
}));

vi.mock('@/lib/diploma/issue', () => ({
  issueDiplomasForCourse: mocks.issueDiplomasForCourse,
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import {
  issueDiplomasAction,
  markAttendanceAction,
  saveEvaluationsAction,
} from './actions';

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

// ============================================================
// saveEvaluationsAction
// ============================================================

const courseFixture = {
  id: 'course-1',
  instructorId: 'instr-1',
  evaluatesAttitude: true,
  evaluationPassingGrade: 4.0,
  _count: { sessions: 4 },
};

/**
 * Helper: instala el mock de `$transaction` para que invoque el
 * callback con un `tx` falso compuesto por `evaluationUpsert` y
 * `enrollmentUpdate`. Así verificamos lo que pasa DENTRO de la
 * transacción, no solo que se llamó.
 */
function wireTransactionCallback() {
  mocks.transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
    return cb({
      evaluation: { upsert: mocks.evaluationUpsert },
      enrollment: { update: mocks.enrollmentUpdate },
    });
  });
}

const fullScoresEntry = {
  enrollmentId: 'e1',
  technicalScore: 6.0,
  knowledgeScore: 6.0,
  attitudeScore: 6.0,
  participationScore: 6.0,
  notes: null,
};

describe('saveEvaluationsAction', () => {
  describe('autorización', () => {
    it('rechaza con unauthorized si no hay sesión', async () => {
      mocks.auth.mockResolvedValue(null);

      const r = await saveEvaluationsAction({
        courseId: 'course-1',
        entries: [fullScoresEntry],
      });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe('unauthorized');
    });

    it('rechaza con course-not-found si el curso no existe', async () => {
      mocks.auth.mockResolvedValue(sessionUser);
      mocks.courseFindUnique.mockResolvedValue(null);

      const r = await saveEvaluationsAction({
        courseId: 'course-x',
        entries: [fullScoresEntry],
      });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe('course-not-found');
    });

    it('rechaza con forbidden si el caller no es el instructor del curso ni admin', async () => {
      mocks.auth.mockResolvedValue({
        user: { id: 'otro-instr', role: 'INSTRUCTOR' },
      });
      mocks.courseFindUnique.mockResolvedValue(courseFixture);

      const r = await saveEvaluationsAction({
        courseId: 'course-1',
        entries: [fullScoresEntry],
      });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe('forbidden');
    });

    it('admin puede guardar evaluaciones aunque no sea instructor del curso', async () => {
      mocks.auth.mockResolvedValue(adminUser);
      mocks.courseFindUnique.mockResolvedValue(courseFixture);
      mocks.enrollmentFindMany.mockResolvedValue([
        { id: 'e1', _count: { attendances: 4 } },
      ]);
      wireTransactionCallback();

      const r = await saveEvaluationsAction({
        courseId: 'course-1',
        entries: [fullScoresEntry],
      });

      expect(r.ok).toBe(true);
    });
  });

  describe('persistencia', () => {
    it('aprueba al alumno con notas perfectas + 100% asistencia (passed=true)', async () => {
      mocks.auth.mockResolvedValue(sessionUser);
      mocks.courseFindUnique.mockResolvedValue(courseFixture);
      mocks.enrollmentFindMany.mockResolvedValue([
        { id: 'e1', _count: { attendances: 4 } },
      ]);
      wireTransactionCallback();

      const r = await saveEvaluationsAction({
        courseId: 'course-1',
        entries: [fullScoresEntry],
      });

      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.savedCount).toBe(1);
        expect(r.passedCount).toBe(1);
      }

      // Evaluation upsert con finalGrade=6 y passed=true.
      expect(mocks.evaluationUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { enrollmentId: 'e1' },
          update: expect.objectContaining({ finalGrade: 6, passed: true }),
        }),
      );

      // Enrollment update con status COMPLETED y failedReason=null.
      expect(mocks.enrollmentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'e1' },
          data: expect.objectContaining({
            status: 'COMPLETED',
            finalGrade: 6,
            failedReason: null,
          }),
        }),
      );
    });

    it('reprueba con failedReason=evaluation cuando nota baja + asistencia OK', async () => {
      mocks.auth.mockResolvedValue(sessionUser);
      mocks.courseFindUnique.mockResolvedValue(courseFixture);
      mocks.enrollmentFindMany.mockResolvedValue([
        { id: 'e1', _count: { attendances: 4 } },
      ]);
      wireTransactionCallback();

      await saveEvaluationsAction({
        courseId: 'course-1',
        entries: [
          {
            ...fullScoresEntry,
            technicalScore: 3.0,
            knowledgeScore: 3.0,
            attitudeScore: 3.0,
            participationScore: 3.0,
          },
        ],
      });

      expect(mocks.enrollmentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
            failedReason: 'evaluation',
          }),
        }),
      );
    });

    it('decisión pendiente (passed=null) NO actualiza el Enrollment', async () => {
      mocks.auth.mockResolvedValue(sessionUser);
      mocks.courseFindUnique.mockResolvedValue(courseFixture);
      mocks.enrollmentFindMany.mockResolvedValue([
        { id: 'e1', _count: { attendances: 4 } },
      ]);
      wireTransactionCallback();

      // Falta una dimensión → passed=null.
      await saveEvaluationsAction({
        courseId: 'course-1',
        entries: [{ ...fullScoresEntry, attitudeScore: null }],
      });

      // Evaluation se persiste con passed=null.
      expect(mocks.evaluationUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ passed: null }),
        }),
      );

      // Pero el Enrollment NO se toca — el status original se mantiene.
      expect(mocks.enrollmentUpdate).not.toHaveBeenCalled();
    });

    it('si el curso NO evalúa actitud, ignora el attitudeScore del cliente y persiste null', async () => {
      mocks.auth.mockResolvedValue(sessionUser);
      mocks.courseFindUnique.mockResolvedValue({
        ...courseFixture,
        evaluatesAttitude: false,
      });
      mocks.enrollmentFindMany.mockResolvedValue([
        { id: 'e1', _count: { attendances: 4 } },
      ]);
      wireTransactionCallback();

      // Cliente envía attitudeScore=1.0 (envenenando el promedio si lo aceptáramos).
      await saveEvaluationsAction({
        courseId: 'course-1',
        entries: [{ ...fullScoresEntry, attitudeScore: 1.0 }],
      });

      // En la BD persistimos null + el promedio se calcula sin la actitud.
      expect(mocks.evaluationUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            attitudeScore: null,
            finalGrade: 6, // (6+6+6)/3 sin la actitud envenenada
            passed: true,
          }),
        }),
      );
    });

    it('descarta entries con enrollmentId que no pertenece al curso', async () => {
      mocks.auth.mockResolvedValue(sessionUser);
      mocks.courseFindUnique.mockResolvedValue(courseFixture);
      // Solo e1 es del curso. e-fake no aparece en validEnrollments.
      mocks.enrollmentFindMany.mockResolvedValue([
        { id: 'e1', _count: { attendances: 4 } },
      ]);
      wireTransactionCallback();

      const r = await saveEvaluationsAction({
        courseId: 'course-1',
        entries: [
          fullScoresEntry,
          { ...fullScoresEntry, enrollmentId: 'e-fake' },
        ],
      });

      expect(r.ok).toBe(true);
      if (r.ok) expect(r.savedCount).toBe(1);

      // Solo un upsert (el del e1), no dos.
      expect(mocks.evaluationUpsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('errores', () => {
    it('rechaza con invalid si el schema no encaja', async () => {
      mocks.auth.mockResolvedValue(sessionUser);

      const r = await saveEvaluationsAction({
        courseId: '', // courseId requerido
        entries: [fullScoresEntry],
      });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe('invalid');
      expect(mocks.courseFindUnique).not.toHaveBeenCalled();
    });

    it('devuelve unknown si la transacción Prisma falla', async () => {
      mocks.auth.mockResolvedValue(sessionUser);
      mocks.courseFindUnique.mockResolvedValue(courseFixture);
      mocks.enrollmentFindMany.mockResolvedValue([
        { id: 'e1', _count: { attendances: 4 } },
      ]);
      mocks.transaction.mockRejectedValue(new Error('DB out'));

      const r = await saveEvaluationsAction({
        courseId: 'course-1',
        entries: [fullScoresEntry],
      });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBe('unknown');
    });
  });
});

// ============================================================
// issueDiplomasAction
// ============================================================

describe('issueDiplomasAction', () => {
  const baseCourse = {
    id: 'course-1',
    instructorId: 'instr-1',
    title: 'Curso X',
  };

  it('rechaza con unauthorized si no hay sesión', async () => {
    mocks.auth.mockResolvedValue(null);

    const r = await issueDiplomasAction('course-1');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('unauthorized');
  });

  it('rechaza con course-not-found si el curso no existe', async () => {
    mocks.auth.mockResolvedValue(sessionUser);
    mocks.courseFindUnique.mockResolvedValue(null);

    const r = await issueDiplomasAction('course-x');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('course-not-found');
  });

  it('rechaza con forbidden si el caller no es instructor del curso ni admin', async () => {
    mocks.auth.mockResolvedValue({
      user: { id: 'otro', role: 'INSTRUCTOR' },
    });
    mocks.courseFindUnique.mockResolvedValue(baseCourse);

    const r = await issueDiplomasAction('course-1');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('forbidden');
    // No debe disparar la emisión.
    expect(mocks.issueDiplomasForCourse).not.toHaveBeenCalled();
  });

  it('happy path: pasa por issueDiplomasForCourse y devuelve el resumen', async () => {
    mocks.auth.mockResolvedValue(sessionUser);
    mocks.courseFindUnique.mockResolvedValue(baseCourse);
    mocks.issueDiplomasForCourse.mockResolvedValue({
      issued: 5,
      alreadyHad: 2,
      notEligible: 1,
      failed: 0,
    });

    const r = await issueDiplomasAction('course-1');

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.issued).toBe(5);
      expect(r.alreadyHad).toBe(2);
      expect(r.notEligible).toBe(1);
      // Mensaje legible compuesto por los counters.
      expect(r.message).toContain('5 emitidos');
      expect(r.message).toContain('2 ya tenían');
      expect(r.message).toContain('1 no apto');
    }

    expect(mocks.issueDiplomasForCourse).toHaveBeenCalledWith('course-1');
  });

  it('mensaje neutro cuando no había alumnos por procesar', async () => {
    mocks.auth.mockResolvedValue(sessionUser);
    mocks.courseFindUnique.mockResolvedValue(baseCourse);
    mocks.issueDiplomasForCourse.mockResolvedValue({
      issued: 0,
      alreadyHad: 0,
      notEligible: 0,
      failed: 0,
    });

    const r = await issueDiplomasAction('course-1');

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.message).toMatch(/no había alumnos/i);
  });

  it('captura error de issueDiplomasForCourse y devuelve unknown', async () => {
    mocks.auth.mockResolvedValue(sessionUser);
    mocks.courseFindUnique.mockResolvedValue(baseCourse);
    mocks.issueDiplomasForCourse.mockRejectedValue(new Error('R2 down'));

    const r = await issueDiplomasAction('course-1');

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('unknown');
  });
});
