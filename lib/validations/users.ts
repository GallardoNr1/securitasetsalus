import { z } from 'zod';
import { isValidSubdivisionForCountry, SUPPORTED_REGIONS } from '@/lib/regions';

/**
 * Validaciones para CRUD de usuarios desde /admin/usuarios.
 *
 * El SUPER_ADMIN puede crear instructores, alumnos y otros admins.
 * Los instructores creados manualmente quedan pre-verificados (sin
 * email verification flow). Los alumnos se crean igual pero pueden
 * registrarse también vía /register pública.
 */

const ROLES = ['SUPER_ADMIN', 'INSTRUCTOR', 'STUDENT'] as const;
const RUT_REGEX = /^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-[0-9kK]$/;

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

// ---------- Crear usuario ----------

export const createUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
      .max(120),
    email: z.email({ message: 'Introduce un correo válido.' }).transform((v) => v.toLowerCase()),
    role: z.enum(ROLES, { message: 'Selecciona un rol.' }),
    region: z.enum(SUPPORTED_REGIONS, { message: 'Selecciona un país.' }),
    subdivision: subdivisionField,
    phone: optionalTrimmed(40),
    rut: optionalTrimmed(20).refine((v) => !v || RUT_REGEX.test(v), {
      message: 'El RUT no tiene un formato válido (ej: 12.345.678-9).',
    }),
    // Password opcional: si no se introduce, el usuario solo puede entrar
    // por Magic Link hasta que se la cambie desde /forgot-password.
    password: z
      .string()
      .min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
      .max(128)
      .optional()
      .or(z.literal('').transform(() => undefined)),
  })
  .superRefine((data, ctx) => {
    if (!data.subdivision) return;
    if (!isValidSubdivisionForCountry(data.subdivision, data.region)) {
      ctx.addIssue({
        code: 'custom',
        path: ['subdivision'],
        message: 'La subdivisión seleccionada no corresponde al país elegido.',
      });
    }
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateUserFormInput = z.input<typeof createUserSchema>;

// ---------- Editar usuario ----------

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
      .max(120),
    role: z.enum(ROLES, { message: 'Selecciona un rol.' }),
    region: z.enum(SUPPORTED_REGIONS, { message: 'Selecciona un país.' }),
    subdivision: subdivisionField,
    phone: optionalTrimmed(40),
    rut: optionalTrimmed(20).refine((v) => !v || RUT_REGEX.test(v), {
      message: 'El RUT no tiene un formato válido.',
    }),
  })
  .superRefine((data, ctx) => {
    if (!data.subdivision) return;
    if (!isValidSubdivisionForCountry(data.subdivision, data.region)) {
      ctx.addIssue({
        code: 'custom',
        path: ['subdivision'],
        message: 'La subdivisión seleccionada no corresponde al país elegido.',
      });
    }
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ---------- Filtros del listado ----------

export const userListFiltersSchema = z.object({
  q: z
    .string()
    .max(120)
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
  role: z.enum(ROLES).optional(),
  region: z.enum(SUPPORTED_REGIONS).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type UserListFilters = z.infer<typeof userListFiltersSchema>;
