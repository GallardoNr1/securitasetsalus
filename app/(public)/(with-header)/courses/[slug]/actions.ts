'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { createCheckoutSession } from '@/lib/payments/checkout';
import { isStripeAvailable } from '@/lib/stripe';
import { enrollInputSchema, type EnrollInput } from '@/lib/validations/enrollments';

/**
 * Server action de inscripción a un curso.
 *
 * Tres caminos posibles:
 *   1. Pago directo con Stripe (`useSence=false`) — crea Enrollment
 *      PENDING_PAYMENT y devuelve la URL de la Checkout Session de
 *      Stripe. El webhook confirma cuando el pago llega.
 *   2. Solicitud SENCE (`useSence=true`) — crea Enrollment
 *      PENDING_SENCE_APPROVAL con los datos del empleador. El admin
 *      aprueba/rechaza desde /admin/payments. NO va a Stripe — el pago
 *      lo gestiona el empleador con la OTEC.
 *   3. Modo "sin Stripe" (env vars vacías) — para entornos pre-launch
 *      sin pasarela: crea Enrollment CONFIRMED directamente. Útil para
 *      testing antes de tener cuenta Stripe verificada.
 *
 * Pre-checks (antes de cualquier creación):
 *   - Sesión activa.
 *   - Email del usuario verificado (regla del producto).
 *   - Curso PUBLISHED y existe.
 *   - Hay cupos disponibles (count en transacción contra capacity).
 *   - El usuario no está ya inscrito (unique [userId, courseId]).
 *   - Si usa SENCE, el usuario tiene RUT en su perfil.
 */

export type EnrollActionResult =
  | {
      ok: true;
      mode: 'stripe-checkout';
      checkoutUrl: string;
    }
  | {
      ok: true;
      mode: 'sence-pending';
      enrollmentId: string;
    }
  | {
      ok: true;
      mode: 'no-stripe-confirmed';
      enrollmentId: string;
    }
  | {
      ok: false;
      error:
        | 'unauthorized'
        | 'email-not-verified'
        | 'invalid'
        | 'course-not-found'
        | 'already-enrolled'
        | 'course-full'
        | 'sence-requires-rut'
        | 'unknown';
      message: string;
      fieldErrors?: Record<string, string>;
    };

export async function enrollAction(input: EnrollInput): Promise<EnrollActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: 'unauthorized', message: 'Inicia sesión para inscribirte.' };
  }

  const parsed = enrollInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.map((p) => String(p)).join('.');
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      error: 'invalid',
      message: 'Revisa los datos del formulario.',
      fieldErrors,
    };
  }
  const data = parsed.data;

  // Lookup user para validar email verificado + tener RUT si SENCE.
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, emailVerifiedAt: true, rut: true },
  });
  if (!user) {
    return { ok: false, error: 'unauthorized', message: 'Sesión inválida.' };
  }
  if (!user.emailVerifiedAt) {
    return {
      ok: false,
      error: 'email-not-verified',
      message: 'Verifica tu email antes de inscribirte. Revisa tu correo.',
    };
  }
  if (data.useSence && !user.rut) {
    return {
      ok: false,
      error: 'sence-requires-rut',
      message:
        'Para usar franquicia SENCE necesitamos tu RUT. Añádelo en tu perfil y vuelve a inscribirte.',
    };
  }

  // Lookup course PUBLISHED.
  const course = await db.course.findFirst({
    where: { slug: data.courseSlug, status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      shortDescription: true,
      price: true,
      currency: true,
      capacity: true,
      senceEligible: true,
    },
  });
  if (!course) {
    return { ok: false, error: 'course-not-found', message: 'Curso no encontrado.' };
  }

  if (data.useSence && !course.senceEligible) {
    return {
      ok: false,
      error: 'invalid',
      message: 'Este curso no admite franquicia SENCE.',
    };
  }

  // Validamos cupo y unicidad EN UNA TRANSACCIÓN — entre el count y el
  // create caben race conditions con la capacidad pero el unique de
  // (userId, courseId) garantiza que el alumno no se inscribe dos veces.
  // Aceptamos el riesgo de overcap residual para MVP — un cron de
  // limpieza de PENDING_PAYMENT > 24h libera cupos no consumados.
  try {
    const result = await db.$transaction(async (tx) => {
      const taken = await tx.enrollment.count({
        where: {
          courseId: course.id,
          status: { in: ['PENDING_PAYMENT', 'PENDING_SENCE_APPROVAL', 'CONFIRMED', 'COMPLETED'] },
        },
      });
      if (taken >= course.capacity) {
        return { kind: 'full' as const };
      }

      const existing = await tx.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: course.id } },
        select: { id: true, status: true },
      });
      if (existing) {
        return { kind: 'duplicate' as const };
      }

      // Decisión de status inicial según camino.
      let status:
        | 'PENDING_PAYMENT'
        | 'PENDING_SENCE_APPROVAL'
        | 'CONFIRMED' = 'PENDING_PAYMENT';
      if (data.useSence) status = 'PENDING_SENCE_APPROVAL';
      else if (!isStripeAvailable()) status = 'CONFIRMED';

      const enrollment = await tx.enrollment.create({
        data: {
          userId: user.id,
          courseId: course.id,
          status,
          senceUsed: data.useSence,
          employerRut: data.useSence ? data.employerRut ?? null : null,
          employerName: data.useSence ? data.employerName ?? null : null,
          employerHrEmail: data.useSence ? data.employerHrEmail ?? null : null,
          paidAt: status === 'CONFIRMED' ? new Date() : null,
        },
        select: { id: true, status: true },
      });
      return { kind: 'ok' as const, enrollment };
    });

    if (result.kind === 'full') {
      return { ok: false, error: 'course-full', message: 'No quedan cupos en este curso.' };
    }
    if (result.kind === 'duplicate') {
      return {
        ok: false,
        error: 'already-enrolled',
        message: 'Ya estás inscrito en este curso.',
      };
    }

    const enrollment = result.enrollment;

    // Camino SENCE: solo creamos la solicitud, no Checkout Session.
    if (enrollment.status === 'PENDING_SENCE_APPROVAL') {
      revalidatePath('/admin/payments');
      revalidatePath('/my-courses');
      return {
        ok: true,
        mode: 'sence-pending',
        enrollmentId: enrollment.id,
      };
    }

    // Camino sin Stripe: confirmamos al vuelo (pre-launch).
    if (enrollment.status === 'CONFIRMED') {
      revalidatePath('/my-courses');
      return {
        ok: true,
        mode: 'no-stripe-confirmed',
        enrollmentId: enrollment.id,
      };
    }

    // Camino normal: Stripe Checkout.
    const checkout = await createCheckoutSession({
      enrollmentId: enrollment.id,
      user: { email: user.email, name: user.name },
      course: {
        id: course.id,
        title: course.title,
        shortDescription: course.shortDescription,
        price: course.price,
        currency: course.currency,
      },
    });
    if (!checkout.url) {
      throw new Error('Stripe no devolvió URL de checkout.');
    }
    return { ok: true, mode: 'stripe-checkout', checkoutUrl: checkout.url };
  } catch (err) {
    logger.error('enrollAction failed', err, {
      tags: { feature: 'enrollment', action: 'create' },
      userId: user.id,
      courseSlug: data.courseSlug,
      useSence: data.useSence,
    });
    return {
      ok: false,
      error: 'unknown',
      message: 'No se pudo procesar la inscripción. Intenta de nuevo en unos minutos.',
    };
  }
}
