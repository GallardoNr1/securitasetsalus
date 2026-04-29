'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { attendanceMarkSchema } from '@/lib/validations/attendance';
import { evaluationBatchSchema } from '@/lib/validations/evaluation';
import { issueDiplomasForCourse } from '@/lib/diploma/issue';

const ATTENDANCE_THRESHOLD = 0.75; // 75% de asistencia mínima — requisito SENCE.

export type MarkAttendanceResult =
  | { ok: true; message: string; markedCount: number }
  | {
      ok: false;
      error: 'unauthorized' | 'forbidden' | 'invalid' | 'session-not-found' | 'unknown';
      message: string;
    };

/**
 * Pase de lista de una sesión.
 *
 * Acepta el roster completo y hace upsert por (enrollmentId, sessionId):
 * - Si ya existía la attendance, actualiza `attended` + `markedById` + `markedAt`.
 * - Si no existía, crea una nueva.
 *
 * Solo el instructor del curso (o un SUPER_ADMIN) puede pasar lista.
 * Solo se aceptan enrollments del curso al que pertenece la sesión y con
 * status ENROLLED o COMPLETED — el resto se silencian (no es error, pero
 * tampoco se persisten para evitar inconsistencias).
 */
export async function markAttendanceAction(input: {
  sessionId: string;
  entries: Array<{ enrollmentId: string; attended: boolean }>;
}): Promise<MarkAttendanceResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: 'unauthorized', message: 'No estás autenticado.' };
  }

  const parsed = attendanceMarkSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalid',
      message: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
    };
  }

  const courseSession = await db.courseSession.findUnique({
    where: { id: parsed.data.sessionId },
    select: {
      id: true,
      courseId: true,
      course: { select: { instructorId: true } },
    },
  });
  if (!courseSession) {
    return {
      ok: false,
      error: 'session-not-found',
      message: 'No encontramos la sesión.',
    };
  }

  const isOwner = courseSession.course.instructorId === session.user.id;
  const isAdmin = session.user.role === 'SUPER_ADMIN';
  if (!isOwner && !isAdmin) {
    return {
      ok: false,
      error: 'forbidden',
      message: 'No eres instructor de este curso.',
    };
  }

  // Solo aceptamos entries cuyos enrollments pertenecen a este curso y están
  // ENROLLED o COMPLETED. Esto evita que alguien manipule el form para marcar
  // asistencia de alumnos de otros cursos o aún no pagados.
  const enrollmentIds = parsed.data.entries.map((e) => e.enrollmentId);
  const validEnrollments = await db.enrollment.findMany({
    where: {
      id: { in: enrollmentIds },
      courseId: courseSession.courseId,
      status: { in: ['CONFIRMED', 'COMPLETED'] },
    },
    select: { id: true },
  });
  const validIds = new Set(validEnrollments.map((e) => e.id));
  const acceptedEntries = parsed.data.entries.filter((e) => validIds.has(e.enrollmentId));

  try {
    await db.$transaction(
      acceptedEntries.map((entry) =>
        db.attendance.upsert({
          where: {
            enrollmentId_sessionId: {
              enrollmentId: entry.enrollmentId,
              sessionId: courseSession.id,
            },
          },
          update: {
            attended: entry.attended,
            markedById: session.user.id,
            markedAt: new Date(),
          },
          create: {
            enrollmentId: entry.enrollmentId,
            sessionId: courseSession.id,
            attended: entry.attended,
            markedById: session.user.id,
          },
        }),
      ),
    );

    revalidatePath(`/instructor/courses/${courseSession.courseId}`);
    revalidatePath(`/instructor/courses/${courseSession.courseId}/sessions/${courseSession.id}/attendance`);

    return {
      ok: true,
      message: `Asistencia guardada (${acceptedEntries.length} alumno${acceptedEntries.length === 1 ? '' : 's'}).`,
      markedCount: acceptedEntries.length,
    };
  } catch (err) {
    console.error('[attendance mark]', err);
    return {
      ok: false,
      error: 'unknown',
      message: 'No se pudo guardar la asistencia. Intenta de nuevo.',
    };
  }
}

// ---------- Evaluación final (Fase 5b) ----------

export type SaveEvaluationsResult =
  | { ok: true; message: string; savedCount: number; passedCount: number }
  | {
      ok: false;
      error: 'unauthorized' | 'forbidden' | 'invalid' | 'course-not-found' | 'unknown';
      message: string;
    };

/**
 * Guarda las evaluaciones finales del curso.
 *
 * Por cada entry calcula:
 *  - finalGrade = promedio de las dimensiones rellenadas (1-7).
 *    Si el curso tiene `evaluatesAttitude: false`, ignora attitudeScore
 *    aunque venga relleno (defensa adicional contra forms manipulados).
 *  - passed = (finalGrade >= course.evaluationPassingGrade) Y
 *             (asistencia del alumno >= 75% de las sesiones del curso).
 *
 * Si el alumno aún no tiene ninguna nota rellena, se persiste la
 * Evaluation pero con finalGrade=null y passed=null — útil para guardar
 * borradores parciales sin "fallar" al alumno.
 *
 * Además actualiza Enrollment.finalGrade y Enrollment.status (COMPLETED/
 * FAILED) cuando passed se puede calcular definitivamente.
 */
export async function saveEvaluationsAction(input: {
  courseId: string;
  entries: Array<{
    enrollmentId: string;
    technicalScore: number | null;
    knowledgeScore: number | null;
    attitudeScore: number | null;
    participationScore: number | null;
    notes: string | null;
  }>;
}): Promise<SaveEvaluationsResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: 'unauthorized', message: 'No estás autenticado.' };
  }

  const parsed = evaluationBatchSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalid',
      message: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
    };
  }

  const course = await db.course.findUnique({
    where: { id: parsed.data.courseId },
    select: {
      id: true,
      instructorId: true,
      evaluatesAttitude: true,
      evaluationPassingGrade: true,
      _count: { select: { sessions: true } },
    },
  });
  if (!course) {
    return {
      ok: false,
      error: 'course-not-found',
      message: 'No encontramos el curso.',
    };
  }

  const isOwner = course.instructorId === session.user.id;
  const isAdmin = session.user.role === 'SUPER_ADMIN';
  if (!isOwner && !isAdmin) {
    return {
      ok: false,
      error: 'forbidden',
      message: 'No eres instructor de este curso.',
    };
  }

  // Filtrar enrollments válidos del curso (defensa contra IDs falsos).
  const enrollmentIds = parsed.data.entries.map((e) => e.enrollmentId);
  const validEnrollments = await db.enrollment.findMany({
    where: {
      id: { in: enrollmentIds },
      courseId: course.id,
      status: { in: ['CONFIRMED', 'COMPLETED', 'FAILED'] },
    },
    include: {
      _count: { select: { attendances: { where: { attended: true } } } },
    },
  });
  const enrollmentMap = new Map(validEnrollments.map((e) => [e.id, e]));

  const totalSessions = course._count.sessions;
  let passedCount = 0;

  try {
    await db.$transaction(async (tx) => {
      for (const entry of parsed.data.entries) {
        const enrollment = enrollmentMap.get(entry.enrollmentId);
        if (!enrollment) continue;

        // Calcular finalGrade promediando solo las dimensiones rellenadas
        // y activas para este curso.
        const dimensions: Array<number | null> = [
          entry.technicalScore,
          entry.knowledgeScore,
          course.evaluatesAttitude ? entry.attitudeScore : null,
          entry.participationScore,
        ];
        const filledDimensions = dimensions.filter((d): d is number => d !== null);

        const finalGrade =
          filledDimensions.length === 0
            ? null
            : Number(
                (
                  filledDimensions.reduce((sum, n) => sum + n, 0) / filledDimensions.length
                ).toFixed(2),
              );

        // passed solo se decide cuando todas las dimensiones activas están
        // rellenadas (decisión definitiva del instructor) Y la asistencia
        // alcanza el umbral SENCE.
        const requiredDimensions = course.evaluatesAttitude ? 4 : 3;
        const allFilled = filledDimensions.length === requiredDimensions;
        const attendanceRatio =
          totalSessions === 0 ? 1 : enrollment._count.attendances / totalSessions;
        const meetsAttendance = attendanceRatio >= ATTENDANCE_THRESHOLD;

        const passed: boolean | null =
          finalGrade === null || !allFilled
            ? null
            : finalGrade >= course.evaluationPassingGrade && meetsAttendance;

        if (passed === true) passedCount++;

        // Determinar failedReason si suspendió.
        let failedReason: string | null = null;
        if (passed === false) {
          const lowGrade = finalGrade !== null && finalGrade < course.evaluationPassingGrade;
          if (lowGrade && !meetsAttendance) failedReason = 'both';
          else if (lowGrade) failedReason = 'evaluation';
          else failedReason = 'attendance';
        }

        await tx.evaluation.upsert({
          where: { enrollmentId: entry.enrollmentId },
          update: {
            technicalScore: entry.technicalScore,
            knowledgeScore: entry.knowledgeScore,
            // Si la actitud está desactivada en el curso, persistimos null
            // ignorando lo que mande el cliente.
            attitudeScore: course.evaluatesAttitude ? entry.attitudeScore : null,
            participationScore: entry.participationScore,
            notes: entry.notes,
            finalGrade,
            passed,
            evaluatedById: session.user.id,
            evaluatedAt: new Date(),
          },
          create: {
            enrollmentId: entry.enrollmentId,
            technicalScore: entry.technicalScore,
            knowledgeScore: entry.knowledgeScore,
            attitudeScore: course.evaluatesAttitude ? entry.attitudeScore : null,
            participationScore: entry.participationScore,
            notes: entry.notes,
            finalGrade,
            passed,
            evaluatedById: session.user.id,
          },
        });

        // Actualizamos Enrollment solo cuando hay decisión definitiva
        // (passed != null). Si passed=null, dejamos el status tal cual.
        if (passed !== null) {
          await tx.enrollment.update({
            where: { id: entry.enrollmentId },
            data: {
              finalGrade,
              status: passed ? 'COMPLETED' : 'FAILED',
              failedReason: failedReason,
            },
          });
        }
      }
    });

    revalidatePath(`/instructor/courses/${course.id}`);
    revalidatePath(`/instructor/courses/${course.id}/evaluations`);

    return {
      ok: true,
      message: `Evaluaciones guardadas (${enrollmentMap.size} alumno${enrollmentMap.size === 1 ? '' : 's'}).`,
      savedCount: enrollmentMap.size,
      passedCount,
    };
  } catch (err) {
    console.error('[evaluations save]', err);
    return {
      ok: false,
      error: 'unknown',
      message: 'No se pudieron guardar las evaluaciones. Intenta de nuevo.',
    };
  }
}

// ---------- Emisión de diplomas (Fase 5c) ----------

export type IssueDiplomasResult =
  | {
      ok: true;
      message: string;
      issued: number;
      alreadyHad: number;
      notEligible: number;
      failed: number;
    }
  | {
      ok: false;
      error: 'unauthorized' | 'forbidden' | 'course-not-found' | 'unknown';
      message: string;
    };

/**
 * Emite los diplomas de todos los alumnos del curso que están en COMPLETED
 * y aprobaron la evaluación final. Idempotente: los que ya tengan diploma
 * se cuentan en `alreadyHad`, no se duplica nada.
 *
 * Solo el instructor del curso o un SUPER_ADMIN pueden disparar la emisión.
 */
export async function issueDiplomasAction(courseId: string): Promise<IssueDiplomasResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: 'unauthorized', message: 'No estás autenticado.' };
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, instructorId: true, title: true },
  });
  if (!course) {
    return {
      ok: false,
      error: 'course-not-found',
      message: 'No encontramos el curso.',
    };
  }

  const isOwner = course.instructorId === session.user.id;
  const isAdmin = session.user.role === 'SUPER_ADMIN';
  if (!isOwner && !isAdmin) {
    return { ok: false, error: 'forbidden', message: 'No eres instructor de este curso.' };
  }

  try {
    const result = await issueDiplomasForCourse(course.id);

    revalidatePath(`/instructor/courses/${course.id}`);
    revalidatePath('/my-courses');

    const parts: string[] = [];
    if (result.issued > 0) parts.push(`${result.issued} emitido${result.issued === 1 ? '' : 's'}`);
    if (result.alreadyHad > 0) parts.push(`${result.alreadyHad} ya tenía${result.alreadyHad === 1 ? '' : 'n'} diploma`);
    if (result.notEligible > 0) parts.push(`${result.notEligible} no apto${result.notEligible === 1 ? '' : 's'}`);
    if (result.failed > 0) parts.push(`${result.failed} fallaron`);

    return {
      ok: true,
      message: parts.length === 0 ? 'No había alumnos por procesar.' : parts.join(' · '),
      ...result,
    };
  } catch (err) {
    console.error('[diplomas issue]', err);
    return {
      ok: false,
      error: 'unknown',
      message: 'No se pudieron emitir los diplomas. Intenta de nuevo.',
    };
  }
}
