import { db } from '@/lib/db';

/**
 * Roster de alumnos del curso para la pantalla de evaluación final.
 *
 * Por cada alumno devolvemos:
 *  - datos básicos (id, nombre, email, avatar)
 *  - sus notas previas si ya hay Evaluation
 *  - estadísticas de asistencia para que el instructor sepa quién cumple
 *    el mínimo de 75% antes de poner la nota final
 *
 * Solo el instructor del curso o un SUPER_ADMIN obtienen datos.
 */
export async function getCourseForEvaluation(
  courseId: string,
  instructorId: string,
  options: { bypassOwnerCheck?: boolean } = {},
) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      status: true,
      instructorId: true,
      hasEvaluation: true,
      evaluatesAttitude: true,
      evaluationPassingGrade: true,
      _count: { select: { sessions: true } },
    },
  });

  if (!course) return null;
  if (!options.bypassOwnerCheck && course.instructorId !== instructorId) {
    return null;
  }

  const enrollments = await db.enrollment.findMany({
    where: {
      courseId,
      status: { in: ['CONFIRMED', 'COMPLETED', 'FAILED'] },
    },
    orderBy: { user: { name: 'asc' } },
    include: {
      user: { select: { id: true, name: true, email: true, avatarKey: true } },
      evaluation: {
        select: {
          technicalScore: true,
          knowledgeScore: true,
          attitudeScore: true,
          participationScore: true,
          finalGrade: true,
          passed: true,
          notes: true,
          updatedAt: true,
        },
      },
      _count: { select: { attendances: { where: { attended: true } } } },
    },
  });

  const totalSessions = course._count.sessions;
  const roster = enrollments.map((e) => ({
    enrollmentId: e.id,
    user: e.user,
    status: e.status,
    attendedSessions: e._count.attendances,
    attendanceRatio: totalSessions === 0 ? 0 : e._count.attendances / totalSessions,
    evaluation: e.evaluation,
  }));

  return { course, roster, totalSessions };
}

export type EvaluationRoster = NonNullable<
  Awaited<ReturnType<typeof getCourseForEvaluation>>
>;
