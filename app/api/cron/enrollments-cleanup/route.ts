import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Cron diario que limpia inscripciones huérfanas: cualquier Enrollment
 * que lleve > 24 h en `PENDING_PAYMENT` se marca como CANCELLED para
 * liberar el cupo. Cubre los casos donde el alumno abandonó el flujo de
 * Stripe Checkout sin completar el pago.
 *
 * Ejecución:
 *  - Vercel Cron lo invoca con cabecera `Authorization: Bearer <CRON_SECRET>`.
 *  - Configuración en `vercel.json` (a añadir cuando se despliegue).
 *  - En local se puede invocar a mano:
 *    `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/enrollments-cleanup`
 *
 * Devuelve `{ cleaned: N }` con el conteo de filas afectadas.
 */
export async function GET(req: Request) {
  // Auth del cron — Vercel inyecta este bearer con el secret de la env.
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    logger.warn('cron enrollments-cleanup: CRON_SECRET no configurado, abortando');
    return new NextResponse('cron not configured', { status: 503 });
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${expected}`) {
    return new NextResponse('unauthorized', { status: 401 });
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const result = await db.enrollment.updateMany({
      where: {
        status: 'PENDING_PAYMENT',
        enrolledAt: { lt: cutoff },
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: 'Pago no completado en 24h (cleanup automático)',
      },
    });

    logger.info('cron enrollments-cleanup: filas afectadas', { count: result.count });
    return NextResponse.json({ cleaned: result.count });
  } catch (err) {
    logger.error('cron enrollments-cleanup failed', err, {
      tags: { feature: 'cron', job: 'enrollments-cleanup' },
    });
    return new NextResponse('cleanup error', { status: 500 });
  }
}
