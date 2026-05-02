'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { sendEnrollmentSenceApprovedEmail, sendEnrollmentSenceRejectedEmail } from '@/lib/email/send';

/**
 * Acciones del admin sobre pagos / inscripciones SENCE.
 */

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') return null;
  return session;
}

export type SenceApprovalResult =
  | { ok: true; message: string }
  | {
      ok: false;
      error: 'unauthorized' | 'not-found' | 'wrong-status' | 'unknown';
      message: string;
    };

/**
 * Aprueba una inscripción SENCE: pasa de PENDING_SENCE_APPROVAL a
 * CONFIRMED y registra la fecha de aprobación como paidAt (a efectos
 * del producto, una solicitud SENCE aprobada equivale a un pago — el
 * pago real lo gestiona el empleador con la OTEC).
 *
 * Envía email al alumno con la confirmación.
 */
export async function approveSenceEnrollmentAction(
  enrollmentId: string,
): Promise<SenceApprovalResult> {
  const session = await requireSuperAdmin();
  if (!session) return { ok: false, error: 'unauthorized', message: 'No tienes permisos.' };

  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      status: true,
      user: { select: { name: true, email: true } },
      course: { select: { title: true, slug: true } },
    },
  });
  if (!enrollment) {
    return { ok: false, error: 'not-found', message: 'Inscripción no encontrada.' };
  }
  if (enrollment.status !== 'PENDING_SENCE_APPROVAL') {
    return {
      ok: false,
      error: 'wrong-status',
      message: 'Esta inscripción no está pendiente de aprobación SENCE.',
    };
  }

  try {
    await db.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'CONFIRMED', paidAt: new Date() },
    });

    // Email best-effort.
    await sendEnrollmentSenceApprovedEmail({
      to: enrollment.user.email,
      name: enrollment.user.name,
      courseTitle: enrollment.course.title,
    }).catch((err) => {
      logger.error('sence approve: email failed (best-effort)', err, {
        tags: { feature: 'sence', action: 'approve-email' },
        enrollmentId,
      });
    });

    revalidatePath('/admin/payments');
    revalidatePath('/my-courses');
    return { ok: true, message: 'Inscripción SENCE aprobada.' };
  } catch (err) {
    logger.error('sence approve failed', err, {
      tags: { feature: 'sence', action: 'approve' },
      enrollmentId,
    });
    return { ok: false, error: 'unknown', message: 'No se pudo aprobar.' };
  }
}

export type SenceRejectionResult =
  | { ok: true; message: string }
  | {
      ok: false;
      error: 'unauthorized' | 'not-found' | 'wrong-status' | 'invalid' | 'unknown';
      message: string;
    };

/**
 * Rechaza una inscripción SENCE: pasa a CANCELLED con el motivo
 * guardado en `senceRejectionReason`. El alumno recibe email con el
 * motivo y opción de re-inscribirse pagando de su bolsillo.
 *
 * El cupo del curso se libera automáticamente al pasar a CANCELLED
 * (el count de cupos solo cuenta los activos).
 */
export async function rejectSenceEnrollmentAction(
  enrollmentId: string,
  reason: string,
): Promise<SenceRejectionResult> {
  const session = await requireSuperAdmin();
  if (!session) return { ok: false, error: 'unauthorized', message: 'No tienes permisos.' };

  const trimmed = reason.trim().slice(0, 500);
  if (!trimmed) {
    return {
      ok: false,
      error: 'invalid',
      message: 'Indica el motivo del rechazo (será visible para el alumno).',
    };
  }

  const enrollment = await db.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      status: true,
      user: { select: { name: true, email: true } },
      course: { select: { title: true, slug: true } },
    },
  });
  if (!enrollment) {
    return { ok: false, error: 'not-found', message: 'Inscripción no encontrada.' };
  }
  if (enrollment.status !== 'PENDING_SENCE_APPROVAL') {
    return { ok: false, error: 'wrong-status', message: 'Estado inválido.' };
  }

  try {
    await db.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        senceRejectionReason: trimmed,
      },
    });

    await sendEnrollmentSenceRejectedEmail({
      to: enrollment.user.email,
      name: enrollment.user.name,
      courseTitle: enrollment.course.title,
      courseSlug: enrollment.course.slug,
      reason: trimmed,
    }).catch((err) => {
      logger.error('sence reject: email failed (best-effort)', err, {
        tags: { feature: 'sence', action: 'reject-email' },
        enrollmentId,
      });
    });

    revalidatePath('/admin/payments');
    revalidatePath('/my-courses');
    return { ok: true, message: 'Inscripción SENCE rechazada.' };
  } catch (err) {
    logger.error('sence reject failed', err, {
      tags: { feature: 'sence', action: 'reject' },
      enrollmentId,
    });
    return { ok: false, error: 'unknown', message: 'No se pudo rechazar.' };
  }
}
