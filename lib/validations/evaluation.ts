import { z } from 'zod';

/**
 * Escala chilena 1.0–7.0 con un decimal. Aceptamos null en el client
 * (campo aún no rellenado) — el server lo trata como "no evaluado todavía"
 * y no afecta el cálculo de promedio.
 */
const gradeSchema = z
  .number()
  .min(1.0, 'La nota mínima es 1.0')
  .max(7.0, 'La nota máxima es 7.0')
  .nullable();

export const evaluationEntrySchema = z.object({
  enrollmentId: z.string().min(1),
  technicalScore: gradeSchema,
  knowledgeScore: gradeSchema,
  attitudeScore: gradeSchema,
  participationScore: gradeSchema,
  notes: z.string().max(1000).nullable(),
});

export const evaluationBatchSchema = z.object({
  courseId: z.string().min(1),
  entries: z.array(evaluationEntrySchema).min(1),
});

export type EvaluationEntryInput = z.infer<typeof evaluationEntrySchema>;
export type EvaluationBatchInput = z.infer<typeof evaluationBatchSchema>;
