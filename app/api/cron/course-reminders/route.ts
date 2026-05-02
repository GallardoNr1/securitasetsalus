import { NextResponse } from 'next/server';
import pLimit from 'p-limit';
import { db } from '@/lib/db';
import { sendCourseReminderEmail } from '@/lib/email/send';
import { logger } from '@/lib/logger';

/**
 * Cron horario que envía el email "Tu curso empieza en 48h" a todos
 * los inscritos confirmados de cualquier primera sesión cuyo `startsAt`
 * cae en la ventana [now+46h, now+50h] y todavía no tiene
 * `reminderSentAt` rellenado.
 *
 * Por qué esa ventana y no exactamente 48h: el cron corre cada hora,
 * así que con un margen ±2h capturamos cada sesión exactamente una
 * vez, evitando perder cobertura si algún tick se retrasa por la
 * latencia del scheduler de Vercel. El flag `reminderSentAt` previene
 * dobles envíos cuando dos ticks consecutivos cubren la misma sesión.
 *
 * Solo enviamos a la primera sesión del curso (sessionNumber=1) — al
 * resto el alumno ya está inscrito y físicamente presente.
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    logger.warn('cron course-reminders: CRON_SECRET no configurado, abortando');
    return new NextResponse('cron not configured', { status: 503 });
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${expected}`) {
    return new NextResponse('unauthorized', { status: 401 });
  }

  const now = Date.now();
  const windowStart = new Date(now + 46 * 60 * 60 * 1000);
  const windowEnd = new Date(now + 50 * 60 * 60 * 1000);

  try {
    const sessions = await db.courseSession.findMany({
      where: {
        sessionNumber: 1,
        reminderSentAt: null,
        startsAt: { gte: windowStart, lt: windowEnd },
      },
      select: {
        id: true,
        startsAt: true,
        course: {
          select: {
            id: true,
            title: true,
            venueName: true,
            venueAddress: true,
            enrollments: {
              where: { status: 'CONFIRMED' },
              select: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
    });

    if (sessions.length === 0) {
      return NextResponse.json({ sessions: 0, emails: 0 });
    }

    const limit = pLimit(5);
    let emailCount = 0;
    const errors: string[] = [];

    for (const sess of sessions) {
      const enrollments = sess.course.enrollments;
      if (enrollments.length > 0) {
        await Promise.all(
          enrollments.map((e) =>
            limit(async () => {
              try {
                await sendCourseReminderEmail({
                  to: e.user.email,
                  name: e.user.name,
                  courseTitle: sess.course.title,
                  startsAt: sess.startsAt,
                  venueName: sess.course.venueName,
                  venueAddress: sess.course.venueAddress,
                });
                emailCount++;
              } catch (err) {
                logger.error('course-reminder: email falló (best-effort)', err, {
                  tags: { feature: 'cron', job: 'course-reminders' },
                  email: e.user.email,
                  sessionId: sess.id,
                });
                errors.push(e.user.email);
              }
            }),
          ),
        );
      }
      // Marcamos la sesión como notificada AUNQUE algún email falle —
      // si reintentamos, podríamos spam-ear a quienes sí recibieron. Los
      // errores quedan en Sentry para retrigger manual.
      await db.courseSession.update({
        where: { id: sess.id },
        data: { reminderSentAt: new Date() },
      });
    }

    logger.info('course-reminders sent', {
      sessions: sessions.length,
      emails: emailCount,
      errors: errors.length,
    });
    return NextResponse.json({
      sessions: sessions.length,
      emails: emailCount,
      errors: errors.length,
    });
  } catch (err) {
    logger.error('cron course-reminders failed', err, {
      tags: { feature: 'cron', job: 'course-reminders' },
    });
    return new NextResponse('cron error', { status: 500 });
  }
}
