import { db } from '@/lib/db';

/**
 * Detalle del curso para el instructor con stats de asistencia por sesión.
 *
 * Devuelve null si el instructor no es el asignado (y no es SUPER_ADMIN).
 * El llamante debe pasar `bypassOwnerCheck: true` para SUPER_ADMIN.
 */
export async function getCourseForInstructor(
  courseId: string,
  instructorId: string,
  options: { bypassOwnerCheck?: boolean } = {},
) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: { select: { id: true, name: true } },
      sessions: {
        orderBy: { sessionNumber: 'asc' },
        include: {
          _count: { select: { attendances: true } },
        },
      },
      _count: {
        select: {
          enrollments: { where: { status: { in: ['CONFIRMED', 'COMPLETED'] } } },
          diplomas: true,
        },
      },
    },
  });

  // Contadores adicionales para el bloque "Emisión de diplomas".
  // Hacemos consultas separadas porque Prisma no permite where condicional
  // nested dentro del mismo `_count` para múltiples filtros sobre la misma
  // relación.
  const [completedCount, passedCount] = await Promise.all([
    db.enrollment.count({
      where: { courseId, status: 'COMPLETED' },
    }),
    db.enrollment.count({
      where: {
        courseId,
        status: 'COMPLETED',
        OR: [
          { evaluation: { passed: true } },
          // Cursos sin evaluación no requieren passed=true.
          { course: { hasEvaluation: false } },
        ],
      },
    }),
  ]);

  if (!course) return null;
  if (!options.bypassOwnerCheck && course.instructorId !== instructorId) {
    return null;
  }
  return Object.assign(course, { completedCount, passedCount });
}

export type CourseForInstructor = NonNullable<
  Awaited<ReturnType<typeof getCourseForInstructor>>
>;

/**
 * Datos de una sesión específica para el pase de lista:
 * - sesión + curso (para mostrar contexto)
 * - lista de inscritos elegibles (ENROLLED o COMPLETED — los que han pagado)
 * - asistencia previa de cada uno en esta sesión (si la hay)
 *
 * Devuelve null si el instructor no es el asignado (y no es SUPER_ADMIN).
 */
export async function getSessionForAttendance(
  sessionId: string,
  instructorId: string,
  options: { bypassOwnerCheck?: boolean } = {},
) {
  const session = await db.courseSession.findUnique({
    where: { id: sessionId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          instructorId: true,
        },
      },
      attendances: {
        select: { enrollmentId: true, attended: true, markedAt: true },
      },
    },
  });

  if (!session) return null;
  if (!options.bypassOwnerCheck && session.course.instructorId !== instructorId) {
    return null;
  }

  const enrollments = await db.enrollment.findMany({
    where: {
      courseId: session.courseId,
      status: { in: ['CONFIRMED', 'COMPLETED'] },
    },
    orderBy: { user: { name: 'asc' } },
    include: {
      user: { select: { id: true, name: true, email: true, avatarKey: true } },
    },
  });

  // Mapa enrollmentId -> attendance previa.
  const attendanceMap = new Map(
    session.attendances.map((a) => [a.enrollmentId, a]),
  );

  const roster = enrollments.map((e) => ({
    enrollmentId: e.id,
    user: e.user,
    attendance: attendanceMap.get(e.id) ?? null,
  }));

  return { session, roster };
}

export type AttendanceRoster = NonNullable<
  Awaited<ReturnType<typeof getSessionForAttendance>>
>;
