/**
 * Política de reembolsos escalonada por antelación al inicio del curso.
 *
 * Función PURA — no toca DB, no lee env, sin side effects. Recibe el
 * monto del Payment, la fecha de inicio del curso y la fecha en que se
 * solicita el reembolso, y devuelve cuánto se devuelve y bajo qué tier.
 *
 * Tiers:
 * - ≥14 días antes del curso → 100% (todo reembolsable).
 * - 7-13 días → 75%.
 * - 3-6 días → 50%.
 * - 1-2 días → 25%.
 * - <1 día (incluido el día y posterior) → 0% (no reembolsable).
 *
 * Estos porcentajes están alineados con prácticas de OTECs chilenas y
 * la Ley 19.496 (Derechos del Consumidor): el alumno tiene derecho a
 * cancelar con costo decreciente cuanto más se acerca la fecha. Los
 * cortes específicos son una decisión de negocio que se puede ajustar
 * desde aquí sin tocar nada más del sistema.
 *
 * Si el `paidAmount` no es divisible exactamente por la fracción, se
 * redondea hacia abajo (preferimos pasarse de poco que sobre-reembolsar).
 */

export type RefundTier = 'full' | 'high' | 'half' | 'low' | 'none';

export type RefundResult = {
  /** Cuánto se devuelve, en la misma unidad mínima que `paidAmount`. */
  refundAmount: number;
  /** Porcentaje aplicado (0..100, entero). */
  percentage: number;
  /** Etiqueta del tier para mensajes y para guardarlo en BD. */
  tier: RefundTier;
  /** Días enteros entre `requestedAt` y `courseStartsAt`. Negativo si ya empezó. */
  daysBeforeStart: number;
};

export type ComputeRefundInput = {
  paidAmount: number;
  courseStartsAt: Date;
  requestedAt: Date;
};

const MS_PER_DAY = 86_400_000;

export function computeRefundAmount(input: ComputeRefundInput): RefundResult {
  const diffMs = input.courseStartsAt.getTime() - input.requestedAt.getTime();
  // Días enteros restantes — `Math.floor` para que "13.9 días" cuente como 13
  // (no como 14). Solo se sube de tier al cruzar el corte de día completo.
  const daysBeforeStart = Math.floor(diffMs / MS_PER_DAY);

  let percentage: number;
  let tier: RefundTier;

  if (daysBeforeStart >= 14) {
    percentage = 100;
    tier = 'full';
  } else if (daysBeforeStart >= 7) {
    percentage = 75;
    tier = 'high';
  } else if (daysBeforeStart >= 3) {
    percentage = 50;
    tier = 'half';
  } else if (daysBeforeStart >= 1) {
    percentage = 25;
    tier = 'low';
  } else {
    percentage = 0;
    tier = 'none';
  }

  // Floor al céntimo (o equivalente — para CLP que es zero-decimal,
  // floor a la unidad). Preferimos sub-reembolsar a sobre-reembolsar
  // cuando hay residuo, así nunca devolvemos más de lo recibido.
  const refundAmount = Math.floor((input.paidAmount * percentage) / 100);

  return { refundAmount, percentage, tier, daysBeforeStart };
}
