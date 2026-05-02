/**
 * Cálculo puro de elegibilidad para diploma SES — extraído de
 * `saveEvaluationsAction` para poder testearlo aislado.
 *
 * Reglas (alineadas con SENCE / G19):
 * - Asistencia mínima al `attendanceThreshold` del total de sesiones
 *   (default 0.75 = 75%).
 * - Nota final ≥ `passingGrade` (escala chilena 1.0–7.0, default 4.0).
 * - El instructor evalúa hasta 4 dimensiones: técnica, conocimientos,
 *   actitud, participación. La actitud es opcional por curso (flag
 *   `evaluatesAttitude` en el modelo `Course`).
 * - `passed` solo se decide cuando TODAS las dimensiones activas están
 *   rellenadas Y hay datos de asistencia. Si falta cualquiera, devuelve
 *   `null` para que el caller deje el `Enrollment.status` tal cual y
 *   no lo marque como `FAILED` prematuramente.
 *
 * Es una función PURA — no toca DB, no lee env, no produce side
 * effects. Así los tests pueden cubrir todos los casos edge sin mocks.
 */

export type EligibilityInput = {
  scores: {
    technical: number | null;
    knowledge: number | null;
    attitude: number | null;
    participation: number | null;
  };
  /** Si false, la dimensión actitud no se requiere para passed=true. */
  evaluatesAttitude: boolean;
  attendedSessions: number;
  totalSessions: number;
  /** Nota mínima de aprobación. Tradicional chileno: 4.0 sobre 7.0. */
  passingGrade: number;
  /** Ratio mínimo de asistencia (0..1). Default SENCE: 0.75. */
  attendanceThreshold: number;
};

export type EligibilityFailedReason = 'attendance' | 'evaluation' | 'both';

export type EligibilityResult = {
  /** Promedio de dimensiones rellenadas, redondeado a 2 decimales. */
  finalGrade: number | null;
  /**
   * `true` aprobado, `false` reprobado, `null` decisión pendiente
   * (faltan dimensiones por evaluar — el caller no debe persistir
   * cambios definitivos al `Enrollment` cuando es null).
   */
  passed: boolean | null;
  /** Solo presente cuando `passed === false`. */
  failedReason: EligibilityFailedReason | null;
  /** Útil para UI / mensajes diagnósticos. */
  meetsAttendance: boolean;
  allDimensionsFilled: boolean;
};

export function computeEligibility(input: EligibilityInput): EligibilityResult {
  // 1. Promedio de dimensiones rellenadas. La actitud solo cuenta si el
  //    curso la evalúa (en otro caso, ignoramos lo que mande el cliente).
  const dimensions: Array<number | null> = [
    input.scores.technical,
    input.scores.knowledge,
    input.evaluatesAttitude ? input.scores.attitude : null,
    input.scores.participation,
  ];
  const filled = dimensions.filter((d): d is number => d !== null);

  const finalGrade =
    filled.length === 0
      ? null
      : Number(
          (filled.reduce((sum, n) => sum + n, 0) / filled.length).toFixed(2),
        );

  // 2. ¿Están todas las dimensiones activas rellenadas?
  const requiredDimensions = input.evaluatesAttitude ? 4 : 3;
  const allDimensionsFilled = filled.length === requiredDimensions;

  // 3. Asistencia. Si el curso tiene 0 sesiones (no debería pasar pero
  //    blindamos), consideramos que cumple.
  const attendanceRatio =
    input.totalSessions === 0
      ? 1
      : input.attendedSessions / input.totalSessions;
  const meetsAttendance = attendanceRatio >= input.attendanceThreshold;

  // 4. Decisión. Si falta nota o falta alguna dimensión activa, dejamos
  //    pendiente con null.
  if (finalGrade === null || !allDimensionsFilled) {
    return {
      finalGrade,
      passed: null,
      failedReason: null,
      meetsAttendance,
      allDimensionsFilled,
    };
  }

  const passed = finalGrade >= input.passingGrade && meetsAttendance;
  if (passed) {
    return {
      finalGrade,
      passed: true,
      failedReason: null,
      meetsAttendance,
      allDimensionsFilled,
    };
  }

  // Reprobó — diagnosticar motivo.
  const lowGrade = finalGrade < input.passingGrade;
  const failedReason: EligibilityFailedReason =
    lowGrade && !meetsAttendance ? 'both' : lowGrade ? 'evaluation' : 'attendance';

  return {
    finalGrade,
    passed: false,
    failedReason,
    meetsAttendance,
    allDimensionsFilled,
  };
}
