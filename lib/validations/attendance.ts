import { z } from 'zod';

/**
 * Payload del pase de lista: el cliente manda una lista con un entry
 * por enrollment del curso. `attended` es booleano.
 */
export const attendanceMarkSchema = z.object({
  sessionId: z.string().min(1),
  entries: z
    .array(
      z.object({
        enrollmentId: z.string().min(1),
        attended: z.boolean(),
      }),
    )
    .min(1, 'Debes pasar al menos un alumno'),
});

export type AttendanceMarkInput = z.infer<typeof attendanceMarkSchema>;
