'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  createCourseSchema,
  parsePrerequisitesFromFormData,
  parseSessionsFromFormData,
  updateCourseSchema,
} from '@/lib/validations/courses';

type FieldErrors = Record<string, string>;

function flattenIssues(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.map((p) => String(p)).join('.');
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') return null;
  return session;
}

/**
 * Convierte un FormData con campos planos + `sessions[i][campo]` + checkboxes
 * múltiples `prerequisiteSkillCodes` en un objeto para validar con Zod.
 */
function parseCourseFormData(formData: FormData) {
  const sessions = parseSessionsFromFormData(formData);
  const prerequisiteSkillCodes = parsePrerequisitesFromFormData(formData);

  return {
    title: formData.get('title'),
    slug: formData.get('slug'),
    shortDescription: formData.get('shortDescription'),
    fullSyllabus: formData.get('fullSyllabus'),
    durationHours: formData.get('durationHours'),
    price: formData.get('price'),
    currency: formData.get('currency') || 'CLP',
    capacity: formData.get('capacity'),
    region: formData.get('region'),
    subdivision: formData.get('subdivision'),
    venueName: formData.get('venueName'),
    venueAddress: formData.get('venueAddress'),
    status: formData.get('status') || 'DRAFT',
    hasEvaluation: formData.get('hasEvaluation') === 'on',
    senceEligible: formData.get('senceEligible') === 'on',
    claveroSkillCode: formData.get('claveroSkillCode'),
    claveroSkillSuffix: formData.get('claveroSkillSuffix'),
    prerequisiteSkillCodes,
    includedKit: formData.get('includedKit'),
    instructorId: formData.get('instructorId'),
    sessions,
  };
}

// ---------- Crear curso ----------

export type CreateCourseResult =
  | { ok: true; courseId: string }
  | { ok: false; error: 'unauthorized' | 'invalid' | 'slug-taken'; message: string; fieldErrors?: FieldErrors };

export async function createCourseAction(formData: FormData): Promise<CreateCourseResult> {
  const session = await requireSuperAdmin();
  if (!session) {
    return { ok: false, error: 'unauthorized', message: 'No tienes permisos.' };
  }

  const parsed = createCourseSchema.safeParse(parseCourseFormData(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalid',
      message: 'Revisa los datos del formulario.',
      fieldErrors: flattenIssues(parsed.error.issues),
    };
  }

  const data = parsed.data;

  // Slug único.
  const existing = await db.course.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });
  if (existing) {
    return {
      ok: false,
      error: 'slug-taken',
      message: 'Ya existe un curso con ese slug. Cambia el slug.',
    };
  }

  // Validar instructor.
  const instructor = await db.user.findUnique({
    where: { id: data.instructorId },
    select: { id: true, role: true },
  });
  if (!instructor || (instructor.role !== 'INSTRUCTOR' && instructor.role !== 'SUPER_ADMIN')) {
    return {
      ok: false,
      error: 'invalid',
      message: 'El instructor seleccionado no existe o no tiene rol INSTRUCTOR.',
      fieldErrors: { instructorId: 'Instructor inválido.' },
    };
  }

  const course = await db.course.create({
    data: {
      title: data.title,
      slug: data.slug,
      shortDescription: data.shortDescription,
      fullSyllabus: data.fullSyllabus,
      durationHours: data.durationHours,
      price: data.price,
      currency: data.currency,
      capacity: data.capacity,
      region: data.region,
      subdivision: data.subdivision ?? null,
      venueName: data.venueName ?? null,
      venueAddress: data.venueAddress ?? null,
      status: data.status,
      hasEvaluation: data.hasEvaluation,
      senceEligible: data.senceEligible,
      claveroSkillCode: data.claveroSkillCode ?? null,
      claveroSkillSuffix: data.claveroSkillSuffix ?? null,
      prerequisiteSkillCodes: data.prerequisiteSkillCodes,
      includedKit: data.includedKit ?? null,
      instructorId: data.instructorId,
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      sessions: {
        create: data.sessions.map((s, i) => ({
          sessionNumber: i + 1,
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          location: s.location ?? null,
        })),
      },
    },
    select: { id: true },
  });

  revalidatePath('/admin/courses');
  revalidatePath('/courses');
  return { ok: true, courseId: course.id };
}

// ---------- Editar curso ----------

export type UpdateCourseResult =
  | { ok: true; message: string }
  | {
      ok: false;
      error: 'unauthorized' | 'not-found' | 'invalid' | 'slug-taken' | 'locked';
      message: string;
      fieldErrors?: FieldErrors;
    };

export async function updateCourseAction(
  courseId: string,
  formData: FormData,
): Promise<UpdateCourseResult> {
  const session = await requireSuperAdmin();
  if (!session) {
    return { ok: false, error: 'unauthorized', message: 'No tienes permisos.' };
  }

  const existing = await db.course.findUnique({
    where: { id: courseId },
    include: { _count: { select: { enrollments: { where: { paidAt: { not: null } } } } } },
  });
  if (!existing) {
    return { ok: false, error: 'not-found', message: 'Curso no encontrado.' };
  }

  const parsed = updateCourseSchema.safeParse(parseCourseFormData(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalid',
      message: 'Revisa los datos del formulario.',
      fieldErrors: flattenIssues(parsed.error.issues),
    };
  }

  const data = parsed.data;

  // Si hay alumnos pagados, bloquear cambios sensibles.
  const hasPaidEnrollments = existing._count.enrollments > 0;
  if (hasPaidEnrollments) {
    const sensitiveChanged =
      data.price !== existing.price ||
      data.capacity < existing.capacity ||
      data.currency !== existing.currency;
    if (sensitiveChanged) {
      return {
        ok: false,
        error: 'locked',
        message:
          'No se puede modificar precio, moneda ni reducir capacidad de un curso con alumnos pagados.',
      };
    }
  }

  // Slug único (solo verifica si cambió).
  if (data.slug !== existing.slug) {
    const conflicting = await db.course.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (conflicting && conflicting.id !== courseId) {
      return {
        ok: false,
        error: 'slug-taken',
        message: 'Ya existe otro curso con ese slug.',
      };
    }
  }

  // Validar instructor.
  const instructor = await db.user.findUnique({
    where: { id: data.instructorId },
    select: { id: true, role: true },
  });
  if (!instructor || (instructor.role !== 'INSTRUCTOR' && instructor.role !== 'SUPER_ADMIN')) {
    return {
      ok: false,
      error: 'invalid',
      message: 'Instructor inválido.',
      fieldErrors: { instructorId: 'Instructor inválido.' },
    };
  }

  const wasPublished = existing.publishedAt !== null;
  const willBePublished = data.status === 'PUBLISHED';

  await db.$transaction([
    // Borramos sesiones existentes y recreamos. Es destructivo pero el form
    // siempre manda el conjunto completo y para Fase 3 esto es suficiente.
    // En el futuro podríamos hacer diff por sessionNumber.
    db.courseSession.deleteMany({ where: { courseId } }),
    db.course.update({
      where: { id: courseId },
      data: {
        title: data.title,
        slug: data.slug,
        shortDescription: data.shortDescription,
        fullSyllabus: data.fullSyllabus,
        durationHours: data.durationHours,
        price: data.price,
        currency: data.currency,
        capacity: data.capacity,
        region: data.region,
        subdivision: data.subdivision ?? null,
        venueName: data.venueName ?? null,
        venueAddress: data.venueAddress ?? null,
        status: data.status,
        hasEvaluation: data.hasEvaluation,
        senceEligible: data.senceEligible,
        claveroSkillCode: data.claveroSkillCode ?? null,
        claveroSkillSuffix: data.claveroSkillSuffix ?? null,
        prerequisiteSkillCodes: data.prerequisiteSkillCodes,
        includedKit: data.includedKit ?? null,
        instructorId: data.instructorId,
        publishedAt:
          willBePublished && !wasPublished
            ? new Date()
            : wasPublished
              ? existing.publishedAt
              : null,
        sessions: {
          create: data.sessions.map((s, i) => ({
            sessionNumber: i + 1,
            startsAt: s.startsAt,
            endsAt: s.endsAt,
            location: s.location ?? null,
          })),
        },
      },
    }),
  ]);

  revalidatePath('/admin/courses');
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath('/courses');
  revalidatePath(`/courses/${data.slug}`);
  return { ok: true, message: 'Curso actualizado.' };
}
