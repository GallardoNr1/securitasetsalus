import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import type { CourseListFilters } from '@/lib/validations/courses';

const ADMIN_PAGE_SIZE = 20;

/**
 * Listado paginado de cursos para /admin/cursos con filtros opcionales.
 */
export async function listCoursesAdmin(filters: CourseListFilters) {
  const where: Prisma.CourseWhereInput = {};
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: 'insensitive' } },
      { slug: { contains: filters.q, mode: 'insensitive' } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.region) where.region = filters.region;
  if (filters.instructorId) where.instructorId = filters.instructorId;

  const skip = (filters.page - 1) * ADMIN_PAGE_SIZE;

  const [courses, total] = await Promise.all([
    db.course.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        durationHours: true,
        price: true,
        currency: true,
        capacity: true,
        region: true,
        senceEligible: true,
        claveroSkillCode: true,
        publishedAt: true,
        createdAt: true,
        instructor: { select: { id: true, name: true } },
        _count: { select: { enrollments: true, sessions: true } },
      },
    }),
    db.course.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  return { courses, total, totalPages, page: filters.page, pageSize: ADMIN_PAGE_SIZE };
}

export type CourseListItem = Awaited<ReturnType<typeof listCoursesAdmin>>['courses'][number];

/**
 * Detalle completo del curso para /admin/cursos/[id] (edición).
 */
export async function getCourseById(id: string) {
  return db.course.findUnique({
    where: { id },
    include: {
      sessions: {
        orderBy: { sessionNumber: 'asc' },
      },
      instructor: {
        select: { id: true, name: true, email: true, avatarKey: true },
      },
      _count: {
        select: { enrollments: true },
      },
    },
  });
}

export type CourseDetail = NonNullable<Awaited<ReturnType<typeof getCourseById>>>;

/**
 * Detalle del curso por slug (para el catálogo público en Fase 3c).
 * Solo devuelve cursos PUBLISHED.
 */
export async function getPublishedCourseBySlug(slug: string) {
  return db.course.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      sessions: { orderBy: { sessionNumber: 'asc' } },
      instructor: { select: { id: true, name: true, avatarKey: true } },
      _count: { select: { enrollments: true } },
    },
  });
}

/**
 * Listado público de cursos publicados (para /cursos en Fase 3c).
 */
export async function listPublishedCourses() {
  return db.course.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: [{ publishedAt: 'desc' }],
    include: {
      sessions: { orderBy: { sessionNumber: 'asc' } },
      instructor: { select: { id: true, name: true } },
      _count: { select: { enrollments: true } },
    },
  });
}

/**
 * Cursos asignados a un instructor (para /instructor/cursos en Fase 3c).
 */
export async function listCoursesByInstructor(instructorId: string) {
  return db.course.findMany({
    where: { instructorId },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      sessions: { orderBy: { sessionNumber: 'asc' } },
      _count: { select: { enrollments: true } },
    },
  });
}

/**
 * Inscripciones del alumno (para /mis-cursos).
 *
 * Incluye el diploma asociado si existe (Fase 5c).
 */
export async function listEnrollmentsByStudent(userId: string) {
  return db.enrollment.findMany({
    where: { userId },
    orderBy: [{ enrolledAt: 'desc' }],
    include: {
      course: {
        include: {
          sessions: { orderBy: { sessionNumber: 'asc' } },
          instructor: { select: { id: true, name: true } },
        },
      },
      diploma: {
        select: { id: true, code: true, status: true, issuedAt: true, pdfKey: true },
      },
    },
  });
}
