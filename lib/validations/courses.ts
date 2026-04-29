import { z } from 'zod';
import { CLAVERO_SKILL_CODES, CLAVERO_SKILL_SUFFIXES } from '@/lib/clavero-skills';
import { SUPPORTED_REGIONS, isValidSubdivisionForCountry } from '@/lib/regions';

/**
 * Validaciones para CRUD de cursos desde /admin/courses.
 *
 * Un curso tiene N sesiones (al menos 1) que se editan en el mismo form
 * mediante un array indexado en el FormData (sessions.0.startsAt, ...).
 */

const COURSE_STATUSES = ['DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED'] as const;

const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

const subdivisionField = z
  .string()
  .max(10)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

// Slug: lowercase, números, guiones. Sin espacios ni caracteres especiales.
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ---------- Una sesión del curso ----------

const sessionSchema = z
  .object({
    sessionNumber: z.coerce.number().int().min(1),
    startsAt: z.coerce.date({ message: 'Fecha de inicio inválida.' }),
    endsAt: z.coerce.date({ message: 'Fecha de fin inválida.' }),
    location: optionalTrimmed(200),
  })
  .refine((s) => s.endsAt > s.startsAt, {
    message: 'La hora de fin debe ser posterior a la de inicio.',
    path: ['endsAt'],
  });

export type CourseSessionInput = z.infer<typeof sessionSchema>;

// ---------- Curso completo ----------

const baseCourseFields = {
  title: z
    .string()
    .trim()
    .min(3, { message: 'El título debe tener al menos 3 caracteres.' })
    .max(200),
  slug: z
    .string()
    .trim()
    .min(3, { message: 'El slug debe tener al menos 3 caracteres.' })
    .max(120)
    .regex(slugRegex, {
      message: 'El slug solo admite minúsculas, números y guiones (ej: cerrajeria-residencial).',
    }),
  shortDescription: z
    .string()
    .trim()
    .min(20, { message: 'La descripción corta debe tener al menos 20 caracteres.' })
    .max(280),
  fullSyllabus: z
    .string()
    .trim()
    .min(50, { message: 'El temario debe tener al menos 50 caracteres.' }),
  durationHours: z.coerce.number().int().min(1).max(500),
  price: z.coerce.number().int().min(0).max(100_000_000),
  currency: z.string().trim().min(3).max(3).default('CLP'),
  capacity: z.coerce.number().int().min(1).max(200),
  region: z.enum(SUPPORTED_REGIONS, { message: 'Selecciona un país.' }),
  subdivision: subdivisionField,
  venueName: optionalTrimmed(200),
  venueAddress: optionalTrimmed(300),
  status: z.enum(COURSE_STATUSES).default('DRAFT'),
  hasEvaluation: z.coerce.boolean().default(true),
  senceEligible: z.coerce.boolean().default(false),
  claveroSkillCode: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine((v) => !v || (CLAVERO_SKILL_CODES as readonly string[]).includes(v), {
      message: 'Código Clavero inválido.',
    }),
  claveroSkillSuffix: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine((v) => !v || (CLAVERO_SKILL_SUFFIXES as readonly string[]).includes(v), {
      message: 'Sufijo Clavero inválido.',
    }),
  prerequisiteSkillCodes: z
    .array(z.string())
    .optional()
    .default([])
    .transform((arr) =>
      arr.filter((v) => (CLAVERO_SKILL_CODES as readonly string[]).includes(v)),
    ),
  includedKit: optionalTrimmed(2000),
  instructorId: z.string().min(1, { message: 'Selecciona un instructor.' }),
  sessions: z.array(sessionSchema).min(1, { message: 'Añade al menos una sesión.' }),
};

const baseCourseRefine = (data: z.infer<z.ZodObject<typeof baseCourseFields>>, ctx: z.RefinementCtx) => {
  // Subdivisión coherente con país (si se rellena).
  if (data.subdivision && !isValidSubdivisionForCountry(data.subdivision, data.region)) {
    ctx.addIssue({
      code: 'custom',
      path: ['subdivision'],
      message: 'La subdivisión seleccionada no corresponde al país.',
    });
  }

  // Si claveroSkillSuffix se usa sin code base, error.
  if (data.claveroSkillSuffix && !data.claveroSkillCode) {
    ctx.addIssue({
      code: 'custom',
      path: ['claveroSkillSuffix'],
      message: 'El sufijo solo aplica si hay un código Clavero asignado.',
    });
  }

  // Las sesiones deben estar ordenadas y los sessionNumber consecutivos
  // empezando en 1. Se renumeran en server side igualmente, pero validamos
  // que no haya solapes.
  const sortedByStart = [...data.sessions].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  );
  for (let i = 1; i < sortedByStart.length; i++) {
    if (sortedByStart[i]!.startsAt < sortedByStart[i - 1]!.endsAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['sessions', i, 'startsAt'],
        message: 'Las sesiones no pueden solaparse.',
      });
      break;
    }
  }
};

export const createCourseSchema = z.object(baseCourseFields).superRefine(baseCourseRefine);
export const updateCourseSchema = z.object(baseCourseFields).superRefine(baseCourseRefine);

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

// ---------- Filtros del listado ----------

export const courseListFiltersSchema = z.object({
  q: z
    .string()
    .max(120)
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
  status: z.enum(COURSE_STATUSES).optional(),
  region: z.enum(SUPPORTED_REGIONS).optional(),
  instructorId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type CourseListFilters = z.infer<typeof courseListFiltersSchema>;

/**
 * Helper para parsear las sesiones desde un FormData con el patrón
 * `sessions[i][campo]`. Se usa antes de validar con Zod.
 */
export function parseSessionsFromFormData(formData: FormData): unknown[] {
  const sessions: Record<number, Record<string, string>> = {};
  for (const [key, value] of formData.entries()) {
    const match = /^sessions\[(\d+)\]\[(\w+)\]$/.exec(key);
    if (!match) continue;
    const idx = Number(match[1]);
    const field = match[2]!;
    if (!sessions[idx]) sessions[idx] = {};
    sessions[idx][field] = typeof value === 'string' ? value : '';
  }
  return Object.entries(sessions)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, fields], i) => ({
      sessionNumber: i + 1,
      ...fields,
    }));
}

/**
 * Helper para parsear los códigos de skills prerequisito desde checkboxes
 * múltiples del form (`prerequisiteSkillCodes` por cada uno).
 */
export function parsePrerequisitesFromFormData(formData: FormData): string[] {
  return formData.getAll('prerequisiteSkillCodes').filter((v): v is string => typeof v === 'string');
}
