'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { attendanceMarkSchema } from '@/lib/validations/attendance';

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

    revalidatePath(`/instructor/cursos/${courseSession.courseId}`);
    revalidatePath(`/instructor/cursos/${courseSession.courseId}/sesiones/${courseSession.id}/asistencia`);

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
