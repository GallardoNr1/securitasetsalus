'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendCancelationRefundEmail } from '@/lib/email/send';
import { logger } from '@/lib/logger';
import { computeRefundAmount } from '@/lib/payments/refunds';
import { getStripe, isStripeAvailable } from '@/lib/stripe';
import { cancelEnrollmentSchema } from '@/lib/validations/enrollments';

/**
 * El alumno cancela su propia inscripción. Si tiene Payment COMPLETED
 * asociado, calculamos el reembolso según la política escalonada
 * (`computeRefundAmount`) y disparamos un Stripe refund.
 *
 * Side effects en orden:
 *  1. Update Enrollment → CANCELLED + cancelledAt + cancelReason.
 *  2. Si hay Payment COMPLETED y refundAmount > 0 → Stripe refund.
 *  3. Update Payment → REFUNDED_FULL/PARTIAL + refundedAt + refundedAmount.
 *  4. Email CancelationRefund con monto reembolsado.
 *
 * El cupo del curso se libera automáticamente: las queries que cuentan
 * cupos solo miran enrollments con status activo (PENDING_PAYMENT,
 * PENDING_SENCE_APPROVAL, CONFIRMED, COMPLETED).
 *
 * NO se permite cancelar:
 *  - Si el curso ya empezó (la primera sesión es en el pasado).
 *  - Si la inscripción ya está CANCELLED, COMPLETED o FAILED.
 */

export type CancelEnrollmentResult =
  | {
      ok: true;
      message: string;
      refunded: { amount: number; currency: string; tier: string } | null;
    }
  | {
      ok: false;
      error:
        | 'unauthorized'
        | 'invalid'
        | 'not-found'
        | 'wrong-status'
        | 'course-already-started'
        | 'unknown';
      message: string;
    };

export async function cancelEnrollmentAction(
  input: { enrollmentId: string; reason?: string },
): Promise<CancelEnrollmentResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: 'unauthorized', message: 'No estás autenticado.' };
  }

  const parsed = cancelEnrollmentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalid',
      message: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
    };
  }

  const enrollment = await db.enrollment.findUnique({
    where: { id: parsed.data.enrollmentId },
    select: {
      id: true,
      userId: true,
      status: true,
      user: { select: { name: true, email: true } },
      course: {
        select: {
          id: true,
          title: true,
          currency: true,
          sessions: { orderBy: { sessionNumber: 'asc' }, take: 1, select: { startsAt: true } },
        },
      },
      payments: {
        where: { status: 'COMPLETED' },
        select: { id: true, amount: true, currency: true, stripePaymentId: true },
        take: 1,
      },
    },
  });

  if (!enrollment) {
    return { ok: false, error: 'not-found', message: 'Inscripción no encontrada.' };
  }
  if (enrollment.userId !== session.user.id && session.user.role !== 'SUPER_ADMIN') {
    return { ok: false, error: 'unauthorized', message: 'No es tu inscripción.' };
  }
  if (
    enrollment.status === 'CANCELLED' ||
    enrollment.status === 'COMPLETED' ||
    enrollment.status === 'FAILED'
  ) {
    return {
      ok: false,
      error: 'wrong-status',
      message: 'Esta inscripción ya no se puede cancelar (estado terminal).',
    };
  }

  const firstSession = enrollment.course.sessions[0];
  if (firstSession && firstSession.startsAt.getTime() <= Date.now()) {
    return {
      ok: false,
      error: 'course-already-started',
      message:
        'El curso ya empezó. No se puede cancelar — contacta a soporte si necesitas excepción.',
    };
  }

  const payment = enrollment.payments[0] ?? null;
  const refund =
    payment && firstSession
      ? computeRefundAmount({
          paidAmount: payment.amount,
          courseStartsAt: firstSession.startsAt,
          requestedAt: new Date(),
        })
      : null;

  try {
    // 1. Stripe refund (si aplica). Lo hacemos ANTES del update de BD
    //    para no marcar la inscripción cancelada si Stripe falla.
    //    `stripePaymentId` guarda el Checkout Session ID — recuperamos
    //    la session para sacar su `payment_intent` y refundear contra él.
    let stripeRefundId: string | null = null;
    if (payment && refund && refund.refundAmount > 0 && isStripeAvailable()) {
      const stripe = getStripe();
      const checkoutSession = await stripe.checkout.sessions.retrieve(payment.stripePaymentId);
      const paymentIntentId =
        typeof checkoutSession.payment_intent === 'string'
          ? checkoutSession.payment_intent
          : checkoutSession.payment_intent?.id;
      if (!paymentIntentId) {
        throw new Error('No se pudo resolver payment_intent para el refund.');
      }
      const stripeRefund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: refund.refundAmount,
      });
      stripeRefundId = stripeRefund.id;
    }

    // 2. Update DB.
    await db.$transaction(async (tx) => {
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: parsed.data.reason ?? null,
        },
      });
      if (payment && refund && refund.refundAmount > 0) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: refund.percentage === 100 ? 'REFUNDED_FULL' : 'REFUNDED_PARTIAL',
            refundedAt: new Date(),
            refundedAmount: refund.refundAmount,
          },
        });
      }
    });

    // 3. Email best-effort.
    if (refund) {
      await sendCancelationRefundEmail({
        to: enrollment.user.email,
        name: enrollment.user.name,
        courseTitle: enrollment.course.title,
        refundAmount: refund.refundAmount,
        currency: payment?.currency ?? enrollment.course.currency,
        tier: refund.tier,
        percentage: refund.percentage,
      }).catch((err) => {
        logger.error('cancel: refund email failed (best-effort)', err, {
          tags: { feature: 'enrollment', action: 'cancel-email' },
          enrollmentId: enrollment.id,
        });
      });
    }

    revalidatePath('/billing');
    revalidatePath('/my-courses');
    revalidatePath('/admin/payments');

    if (stripeRefundId) {
      logger.info('refund processed', {
        enrollmentId: enrollment.id,
        stripeRefundId,
        amount: refund?.refundAmount,
      });
    }

    return {
      ok: true,
      message: 'Inscripción cancelada.',
      refunded: refund && refund.refundAmount > 0
        ? {
            amount: refund.refundAmount,
            currency: payment?.currency ?? enrollment.course.currency,
            tier: refund.tier,
          }
        : null,
    };
  } catch (err) {
    logger.error('cancel enrollment failed', err, {
      tags: { feature: 'enrollment', action: 'cancel' },
      enrollmentId: enrollment.id,
      userId: session.user.id,
    });
    return {
      ok: false,
      error: 'unknown',
      message: 'No se pudo cancelar la inscripción. Intenta de nuevo o contacta a soporte.',
    };
  }
}
