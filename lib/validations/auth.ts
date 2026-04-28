import { z } from 'zod';
import { isValidSubdivisionForCountry, REGION_LABELS, SUPPORTED_REGIONS } from '@/lib/regions';
import type { SupportedRegion } from '@/lib/regions';

// Re-exportamos para no romper imports.
export { REGION_LABELS, SUPPORTED_REGIONS };
export type { SupportedRegion };

/**
 * Schemas de validación de los flujos de auth en SES.
 *
 * Diferencia con Clavero: el `User` de SES es un alumno (STUDENT), no un
 * cerrajero con perfil profesional público. Por eso los schemas son más
 * simples — sólo name, email, phone, region (subdivisión opcional) y RUT.
 * Los datos profesionales (especialidad, ciudades de cobertura, etc.) son
 * de Clavero, no de SES.
 */

// ---------- Login ----------

export const loginSchema = z.object({
  email: z.email({ message: 'Introduce un correo válido.' }),
  password: z.string().min(1, { message: 'La contraseña es obligatoria.' }),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ---------- Magic Link ----------

export const magicLinkSchema = z.object({
  email: z.email({ message: 'Introduce un correo válido.' }).transform((v) => v.toLowerCase()),
});

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

// ---------- Registro ----------

// Helper: valida un RUT chileno básicamente (formato + dígito verificador).
// Acepta con puntos o sin ellos: "12.345.678-9" o "12345678-9".
const RUT_REGEX = /^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-[0-9kK]$/;

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
      .max(120, { message: 'El nombre es demasiado largo.' }),
    email: z.email({ message: 'Introduce un correo válido.' }).transform((v) => v.toLowerCase()),
    region: z.enum(SUPPORTED_REGIONS, { message: 'Selecciona un país.' }),
    phone: z
      .string()
      .trim()
      .max(40)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    // RUT opcional al registrarse — solo se exige si el alumno aplica
    // franquicia SENCE en su primer pago.
    rut: z
      .string()
      .trim()
      .max(20)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined))
      .refine((v) => !v || RUT_REGEX.test(v), {
        message: 'El RUT no tiene un formato válido (ej: 12.345.678-9).',
      }),
    password: z
      .string()
      .min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
      .max(128, { message: 'La contraseña es demasiado larga.' }),
    passwordConfirm: z.string(),
    acceptTerms: z.literal(true, { message: 'Debes aceptar los términos.' }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Las contraseñas no coinciden.',
    path: ['passwordConfirm'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ---------- Perfil ----------

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

export const profileUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
      .max(120),
    region: z.enum(SUPPORTED_REGIONS),
    subdivision: subdivisionField,
    phone: optionalTrimmed(40),
    rut: optionalTrimmed(20).refine((v) => !v || RUT_REGEX.test(v), {
      message: 'El RUT no tiene un formato válido (ej: 12.345.678-9).',
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

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ProfileFormInput = z.input<typeof profileUpdateSchema>;

// ---------- Cambio de contraseña ----------

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, { message: 'Introduce tu contraseña actual.' }),
    newPassword: z
      .string()
      .min(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres.' })
      .max(128),
    newPasswordConfirm: z.string(),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: 'Las contraseñas no coinciden.',
    path: ['newPasswordConfirm'],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

// ---------- Recuperación de contraseña ----------

export const forgotPasswordSchema = z.object({
  email: z.email({ message: 'Introduce un correo válido.' }).transform((v) => v.toLowerCase()),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
      .max(128, { message: 'La contraseña es demasiado larga.' }),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Las contraseñas no coinciden.',
    path: ['passwordConfirm'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
