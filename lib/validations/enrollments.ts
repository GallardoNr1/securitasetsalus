import { z } from 'zod';

const RUT_REGEX = /^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-[0-9kK]$/;

/**
 * Input que llega al server action `enrollAction` desde el form de
 * inscripción. El `courseSlug` viene del routing; el resto son campos
 * que el alumno marca en el form.
 *
 * - Si `useSence === false`: vamos directo a Stripe Checkout. Los campos
 *   de empleador no se requieren.
 * - Si `useSence === true`: el alumno declara que quiere franquicia
 *   SENCE. La inscripción queda en `PENDING_SENCE_APPROVAL` y NO va a
 *   Stripe — el admin revisa y aprueba/rechaza desde `/admin/payments`.
 *   Para enviarla, el alumno DEBE tener un RUT en su perfil (el sistema
 *   lo verifica antes de aceptar) y rellenar el bloque de empleador.
 */
export const enrollInputSchema = z
  .object({
    courseSlug: z.string().min(1),
    useSence: z.boolean().default(false),
    employerRut: z
      .string()
      .trim()
      .max(20)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    employerName: z
      .string()
      .trim()
      .max(160)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    employerHrEmail: z
      .string()
      .trim()
      .max(160)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
  })
  .superRefine((data, ctx) => {
    if (!data.useSence) return;
    if (!data.employerRut || !RUT_REGEX.test(data.employerRut)) {
      ctx.addIssue({
        code: 'custom',
        path: ['employerRut'],
        message: 'RUT del empleador requerido en formato 12.345.678-9.',
      });
    }
    if (!data.employerName || data.employerName.length < 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['employerName'],
        message: 'Nombre/razón social del empleador requerido.',
      });
    }
    if (!data.employerHrEmail || !data.employerHrEmail.includes('@')) {
      ctx.addIssue({
        code: 'custom',
        path: ['employerHrEmail'],
        message: 'Email de RR.HH. del empleador requerido.',
      });
    }
  });

export type EnrollInput = z.infer<typeof enrollInputSchema>;

export const cancelEnrollmentSchema = z.object({
  enrollmentId: z.string().min(1),
  reason: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export type CancelEnrollmentInput = z.infer<typeof cancelEnrollmentSchema>;
