import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

const PAGE_SIZE = 20;

/**
 * Histórico de pagos del propio alumno para `/billing`.
 * Incluye datos del curso para mostrar contexto.
 */
export async function listPaymentsByUser(userId: string) {
  return db.payment.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }],
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      paidAt: true,
      refundedAt: true,
      refundedAmount: true,
      createdAt: true,
      enrollment: {
        select: {
          id: true,
          status: true,
          senceUsed: true,
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      },
    },
  });
}

export type StudentPayment = Awaited<ReturnType<typeof listPaymentsByUser>>[number];

// ============================================================
// Listings de admin (/admin/payments)
// ============================================================

export type AdminPaymentFilters = {
  q?: string;
  courseId?: string;
  status?: 'PENDING' | 'COMPLETED' | 'REFUNDED_FULL' | 'REFUNDED_PARTIAL' | 'FAILED';
  senceUsed?: 'true' | 'false';
  page: number;
};

export async function listPaymentsAdmin(filters: AdminPaymentFilters) {
  const where: Prisma.PaymentWhereInput = {};
  const enrollmentWhere: Prisma.EnrollmentWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.courseId) enrollmentWhere.courseId = filters.courseId;
  if (filters.senceUsed === 'true') enrollmentWhere.senceUsed = true;
  else if (filters.senceUsed === 'false') enrollmentWhere.senceUsed = false;
  if (Object.keys(enrollmentWhere).length > 0) where.enrollment = enrollmentWhere;
  if (filters.q) {
    // Búsqueda por nombre / email del alumno o título de curso.
    where.OR = [
      { user: { name: { contains: filters.q, mode: 'insensitive' } } },
      { user: { email: { contains: filters.q, mode: 'insensitive' } } },
      {
        enrollment: {
          course: { title: { contains: filters.q, mode: 'insensitive' } },
        },
      },
    ];
  }

  const skip = (filters.page - 1) * PAGE_SIZE;

  const [items, total] = await Promise.all([
    db.payment.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        paidAt: true,
        refundedAt: true,
        refundedAmount: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        enrollment: {
          select: {
            id: true,
            status: true,
            senceUsed: true,
            employerName: true,
            employerRut: true,
            course: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    }),
    db.payment.count({ where }),
  ]);

  return {
    items,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    page: filters.page,
    pageSize: PAGE_SIZE,
  };
}

export type AdminPaymentItem = Awaited<ReturnType<typeof listPaymentsAdmin>>['items'][number];

/**
 * Lista enrollments en estado PENDING_SENCE_APPROVAL para que el admin
 * los revise. Incluye los campos SENCE para que pueda contactar al
 * empleador.
 */
export async function listPendingSenceEnrollments() {
  return db.enrollment.findMany({
    where: { status: 'PENDING_SENCE_APPROVAL' },
    orderBy: [{ enrolledAt: 'desc' }],
    select: {
      id: true,
      enrolledAt: true,
      employerRut: true,
      employerName: true,
      employerHrEmail: true,
      user: { select: { id: true, name: true, email: true, rut: true } },
      course: { select: { id: true, title: true, slug: true, price: true, currency: true } },
    },
  });
}

export type PendingSenceEnrollment = Awaited<
  ReturnType<typeof listPendingSenceEnrollments>
>[number];
