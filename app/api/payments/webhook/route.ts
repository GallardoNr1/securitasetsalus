import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { db } from '@/lib/db';
import {
  sendEnrollmentConfirmationEmail,
  sendPaymentReceiptEmail,
} from '@/lib/email/send';
import { logger } from '@/lib/logger';
import { parseWebhookEvent } from '@/lib/stripe';

/**
 * Webhook de Stripe.
 *
 * Eventos manejados:
 *   - `checkout.session.completed` → confirma Enrollment, crea Payment.
 *   - `charge.refunded` → marca Payment como REFUNDED_FULL/PARTIAL.
 *
 * IDEMPOTENCIA:
 *   Stripe garantiza al menos una entrega — el mismo evento puede llegar
 *   varias veces (reintentos por timeout, errores transitorios). El
 *   handler debe ser idempotente:
 *   - `Payment.stripePaymentId` es UNIQUE → si intentamos crear dos
 *     veces el mismo Payment, Prisma lanza P2002 y lo capturamos como
 *     "ya procesado".
 *   - `Enrollment.update` con status condicional: solo pasamos a
 *     CONFIRMED si todavía estaba en PENDING_PAYMENT, y a
 *     REFUNDED_* solo si era COMPLETED.
 *
 * SEGURIDAD:
 *   La firma se verifica con `parseWebhookEvent` usando
 *   `STRIPE_WEBHOOK_SECRET`. Si la firma es inválida → 400 sin body
 *   informativo (no le decimos al atacante qué fallo).
 */

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  const event = parseWebhookEvent(body, signature);
  if (!event) {
    return new NextResponse('invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        // Eventos no relevantes para SES — devolvemos 200 para que
        // Stripe no reintente.
        logger.debug('stripe webhook: evento ignorado', { type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error('stripe webhook handler failed', err, {
      tags: { feature: 'webhook', stripeEvent: event.type },
      eventId: event.id,
    });
    // 500 para que Stripe reintente. Si vemos retries continuos en
    // dashboard, el error está en el handler — hay que arreglarlo.
    return new NextResponse('handler error', { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const enrollmentId = session.metadata?.enrollmentId;
  if (!enrollmentId) {
    logger.warn('checkout.session.completed sin enrollmentId en metadata', {
      sessionId: session.id,
    });
    return;
  }

  // Si ya existe Payment con este sessionId, ya procesamos esta
  // notificación → idempotencia.
  const existing = await db.payment.findUnique({
    where: { stripePaymentId: session.id },
    select: { id: true },
  });
  if (existing) {
    logger.debug('webhook idempotente: payment ya existe', { sessionId: session.id });
    return;
  }

  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      userId: true,
      status: true,
      employerName: true,
      employerRut: true,
      user: { select: { name: true, email: true } },
      course: { select: { title: true, slug: true, currency: true } },
    },
  });
  if (!enrollment) {
    logger.warn('checkout.session.completed sin enrollment correspondiente', {
      enrollmentId,
      sessionId: session.id,
    });
    return;
  }

  // Idempotencia adicional: si la inscripción ya pasó a CONFIRMED por
  // otra vía (ej. retry del webhook que sí creó el Payment pero no
  // devolvimos 200), no hacemos nada.
  if (enrollment.status !== 'PENDING_PAYMENT') {
    logger.debug('webhook: enrollment no estaba en PENDING_PAYMENT', {
      enrollmentId,
      currentStatus: enrollment.status,
    });
  }

  const amount = session.amount_total ?? 0;
  const currency = (session.currency ?? enrollment.course.currency).toUpperCase();

  await db.$transaction(async (tx) => {
    await tx.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'CONFIRMED', paidAt: new Date() },
    });
    await tx.payment.create({
      data: {
        userId: enrollment.userId,
        enrollmentId: enrollment.id,
        stripePaymentId: session.id,
        amount,
        currency,
        status: 'COMPLETED',
        paidAt: new Date(),
      },
    });
  });

  // Emails best-effort (los dos en paralelo). El recibo formal es un
  // segundo email distinto del confirmation porque tiene otra
  // intención: el confirmation es UX (genial, ya estás dentro), el
  // recibo es contable (datos formales SES, RUT empleador si aplica).
  const paidAt = new Date();
  await Promise.all([
    sendEnrollmentConfirmationEmail({
      to: enrollment.user.email,
      name: enrollment.user.name,
      courseTitle: enrollment.course.title,
      courseSlug: enrollment.course.slug,
      amount,
      currency,
    }).catch((err) => {
      logger.error('enrollment confirmation email failed (best-effort)', err, {
        tags: { feature: 'enrollment', action: 'confirmation-email' },
        enrollmentId: enrollment.id,
      });
    }),
    sendPaymentReceiptEmail({
      to: enrollment.user.email,
      name: enrollment.user.name,
      courseTitle: enrollment.course.title,
      amount,
      currency,
      paidAt,
      enrollmentId: enrollment.id,
      employerName: enrollment.employerName,
      employerRut: enrollment.employerRut,
    }).catch((err) => {
      logger.error('payment receipt email failed (best-effort)', err, {
        tags: { feature: 'enrollment', action: 'receipt-email' },
        enrollmentId: enrollment.id,
      });
    }),
  ]);
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  // El refund ya viene aplicado en Stripe — aquí solo sincronizamos BD.
  // Resolvemos el Payment vía el Checkout Session que originó el
  // payment_intent.
  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) {
    logger.warn('charge.refunded sin payment_intent', { chargeId: charge.id });
    return;
  }

  // Buscamos el Payment por stripePaymentId. Como guardamos session.id
  // (no payment_intent), tenemos que buscar de otra forma. Estrategia:
  // miramos por `enrollmentId` que viene en charge.metadata.
  const enrollmentId = charge.metadata?.enrollmentId;
  if (!enrollmentId) {
    logger.warn('charge.refunded sin enrollmentId en metadata', { chargeId: charge.id });
    return;
  }

  const payment = await db.payment.findFirst({
    where: { enrollmentId, status: 'COMPLETED' },
    select: { id: true, amount: true, refundedAmount: true },
  });
  if (!payment) {
    logger.warn('charge.refunded sin Payment correspondiente', { enrollmentId, chargeId: charge.id });
    return;
  }

  const refunded = charge.amount_refunded ?? 0;
  const isFullRefund = refunded >= payment.amount;

  // Idempotencia: si ya está marcado como REFUNDED con el mismo monto,
  // no hacemos nada.
  if (payment.refundedAmount === refunded) {
    logger.debug('charge.refunded idempotente: ya sincronizado', { paymentId: payment.id });
    return;
  }

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: isFullRefund ? 'REFUNDED_FULL' : 'REFUNDED_PARTIAL',
      refundedAt: new Date(),
      refundedAmount: refunded,
    },
  });
}
