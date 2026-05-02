import { describe, expect, it } from 'vitest';
import {
  computeEligibility,
  type EligibilityInput,
} from './eligibility';

/**
 * Helper para construir inputs con defaults sensatos (curso de 4
 * sesiones, evalúa actitud, escala 4.0/7.0, asistencia 75%). Cada
 * test sobrescribe solo lo que necesita.
 */
function input(overrides: Partial<EligibilityInput> = {}): EligibilityInput {
  const baseScores = { technical: 6.0, knowledge: 6.0, attitude: 6.0, participation: 6.0 };
  const { scores: scoreOverrides, ...rest } = overrides;
  return {
    evaluatesAttitude: true,
    attendedSessions: 4,
    totalSessions: 4,
    passingGrade: 4.0,
    attendanceThreshold: 0.75,
    ...rest,
    scores: { ...baseScores, ...(scoreOverrides ?? {}) },
  };
}

describe('computeEligibility', () => {
  describe('happy path', () => {
    it('aprobado con 4 dimensiones a 6.0 + 100% asistencia', () => {
      const r = computeEligibility(input());
      expect(r.passed).toBe(true);
      expect(r.failedReason).toBeNull();
      expect(r.finalGrade).toBe(6);
      expect(r.meetsAttendance).toBe(true);
      expect(r.allDimensionsFilled).toBe(true);
    });

    it('aprobado en el límite — nota 4.0 exacta + 75% exacto', () => {
      const r = computeEligibility(
        input({
          scores: { technical: 4.0, knowledge: 4.0, attitude: 4.0, participation: 4.0 },
          attendedSessions: 3,
          totalSessions: 4, // 0.75 exacto
        }),
      );
      expect(r.passed).toBe(true);
      expect(r.finalGrade).toBe(4);
    });

    it('aprobado cuando el curso no evalúa actitud (3 dimensiones)', () => {
      const r = computeEligibility(
        input({
          evaluatesAttitude: false,
          scores: { technical: 5.0, knowledge: 5.0, attitude: null, participation: 5.0 },
        }),
      );
      expect(r.passed).toBe(true);
      expect(r.finalGrade).toBe(5);
      expect(r.allDimensionsFilled).toBe(true);
    });
  });

  describe('reprobado', () => {
    it('reason=evaluation cuando nota < passingGrade pero asistencia OK', () => {
      const r = computeEligibility(
        input({
          scores: { technical: 3.0, knowledge: 3.0, attitude: 3.0, participation: 3.0 },
        }),
      );
      expect(r.passed).toBe(false);
      expect(r.failedReason).toBe('evaluation');
      expect(r.finalGrade).toBe(3);
      expect(r.meetsAttendance).toBe(true);
    });

    it('reason=attendance cuando nota OK pero falta a más del 25%', () => {
      const r = computeEligibility(
        input({
          attendedSessions: 2,
          totalSessions: 4, // 0.5 < 0.75
        }),
      );
      expect(r.passed).toBe(false);
      expect(r.failedReason).toBe('attendance');
      expect(r.finalGrade).toBe(6);
      expect(r.meetsAttendance).toBe(false);
    });

    it('reason=both cuando nota baja Y poca asistencia', () => {
      const r = computeEligibility(
        input({
          scores: { technical: 2.0, knowledge: 2.0, attitude: 2.0, participation: 2.0 },
          attendedSessions: 1,
          totalSessions: 4,
        }),
      );
      expect(r.passed).toBe(false);
      expect(r.failedReason).toBe('both');
    });
  });

  describe('decisión pendiente (passed=null)', () => {
    it('sin notas → passed=null y finalGrade=null', () => {
      const r = computeEligibility(
        input({
          scores: { technical: null, knowledge: null, attitude: null, participation: null },
        }),
      );
      expect(r.passed).toBeNull();
      expect(r.finalGrade).toBeNull();
      expect(r.failedReason).toBeNull();
      expect(r.allDimensionsFilled).toBe(false);
    });

    it('con dimensiones parciales → passed=null aunque el promedio sea alto', () => {
      const r = computeEligibility(
        input({
          scores: { technical: 7.0, knowledge: null, attitude: 7.0, participation: 7.0 },
        }),
      );
      expect(r.passed).toBeNull();
      // El promedio sí se calcula con lo rellenado.
      expect(r.finalGrade).toBe(7);
      expect(r.allDimensionsFilled).toBe(false);
    });

    it('sin actitud cuando el curso SÍ la evalúa → passed=null', () => {
      const r = computeEligibility(
        input({
          scores: { technical: 6.0, knowledge: 6.0, attitude: null, participation: 6.0 },
        }),
      );
      expect(r.passed).toBeNull();
      expect(r.allDimensionsFilled).toBe(false);
    });
  });

  describe('reglas de actitud', () => {
    it('si evaluatesAttitude=false la actitud se ignora aunque venga rellena', () => {
      const r = computeEligibility(
        input({
          evaluatesAttitude: false,
          // Actitud "envenenada" a 1.0 — no debe afectar el promedio.
          scores: { technical: 6.0, knowledge: 6.0, attitude: 1.0, participation: 6.0 },
        }),
      );
      expect(r.finalGrade).toBe(6); // promedio de las 3 dimensiones activas
      expect(r.passed).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('curso sin sesiones → meetsAttendance=true (no podemos exigir asistencia que no existe)', () => {
      const r = computeEligibility(
        input({ attendedSessions: 0, totalSessions: 0 }),
      );
      expect(r.meetsAttendance).toBe(true);
      expect(r.passed).toBe(true);
    });

    it('redondea finalGrade a 2 decimales', () => {
      const r = computeEligibility(
        input({
          scores: { technical: 5.0, knowledge: 5.5, attitude: 6.0, participation: 6.5 },
        }),
      );
      // (5.0 + 5.5 + 6.0 + 6.5) / 4 = 5.75
      expect(r.finalGrade).toBe(5.75);
    });

    it('promedio con decimales largos se redondea a 2', () => {
      const r = computeEligibility(
        input({
          scores: { technical: 5.0, knowledge: 5.0, attitude: 5.0, participation: 6.0 },
        }),
      );
      // 21 / 4 = 5.25
      expect(r.finalGrade).toBe(5.25);
    });
  });
});
