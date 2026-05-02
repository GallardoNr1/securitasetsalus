import { describe, expect, it } from 'vitest';
import { computeRefundAmount } from './refunds';

/**
 * Helper para construir un input con la fecha del curso fija y `daysOffset`
 * días antes de la solicitud de cancelación. `daysOffset = 14` significa
 * que la solicitud llega 14 días antes del curso.
 */
function input(daysOffset: number, paidAmount = 250_000) {
  const courseStartsAt = new Date('2026-06-01T09:00:00Z');
  // requestedAt = courseStartsAt - daysOffset * 24h.
  const requestedAt = new Date(courseStartsAt.getTime() - daysOffset * 86_400_000);
  return { paidAmount, courseStartsAt, requestedAt };
}

describe('computeRefundAmount', () => {
  describe('tier full (≥14 días)', () => {
    it('14 días antes → 100%', () => {
      const r = computeRefundAmount(input(14));
      expect(r.tier).toBe('full');
      expect(r.percentage).toBe(100);
      expect(r.refundAmount).toBe(250_000);
    });

    it('30 días antes → 100% (cualquier tiempo > 14)', () => {
      const r = computeRefundAmount(input(30));
      expect(r.tier).toBe('full');
      expect(r.percentage).toBe(100);
    });
  });

  describe('tier high (7-13 días)', () => {
    it('13 días antes → 75%', () => {
      const r = computeRefundAmount(input(13));
      expect(r.tier).toBe('high');
      expect(r.percentage).toBe(75);
      expect(r.refundAmount).toBe(187_500);
    });

    it('7 días antes → 75% (corte inferior del tier)', () => {
      const r = computeRefundAmount(input(7));
      expect(r.tier).toBe('high');
      expect(r.percentage).toBe(75);
    });
  });

  describe('tier half (3-6 días)', () => {
    it('6 días antes → 50%', () => {
      const r = computeRefundAmount(input(6));
      expect(r.tier).toBe('half');
      expect(r.percentage).toBe(50);
      expect(r.refundAmount).toBe(125_000);
    });

    it('3 días antes → 50% (corte inferior)', () => {
      const r = computeRefundAmount(input(3));
      expect(r.tier).toBe('half');
    });
  });

  describe('tier low (1-2 días)', () => {
    it('2 días antes → 25%', () => {
      const r = computeRefundAmount(input(2));
      expect(r.tier).toBe('low');
      expect(r.percentage).toBe(25);
      expect(r.refundAmount).toBe(62_500);
    });

    it('1 día antes → 25%', () => {
      const r = computeRefundAmount(input(1));
      expect(r.tier).toBe('low');
    });
  });

  describe('tier none (<1 día o ya empezó)', () => {
    it('mismo día → 0%', () => {
      const r = computeRefundAmount(input(0));
      expect(r.tier).toBe('none');
      expect(r.percentage).toBe(0);
      expect(r.refundAmount).toBe(0);
    });

    it('después del inicio → 0%', () => {
      const r = computeRefundAmount(input(-3));
      expect(r.tier).toBe('none');
      expect(r.refundAmount).toBe(0);
      expect(r.daysBeforeStart).toBe(-3);
    });
  });

  describe('redondeo', () => {
    it('redondea hacia abajo cuando el cálculo no es exacto', () => {
      // 12345 * 75% = 9258.75 → floor a 9258.
      const r = computeRefundAmount(input(10, 12_345));
      expect(r.percentage).toBe(75);
      expect(r.refundAmount).toBe(9_258);
    });

    it('CLP zero-decimal: nunca devolvemos fracción de peso', () => {
      // 1000 * 25% = 250 (exacto, no aplica el floor pero verificamos
      // que devuelve int).
      const r = computeRefundAmount(input(2, 1_000));
      expect(r.refundAmount).toBe(250);
      expect(Number.isInteger(r.refundAmount)).toBe(true);
    });
  });

  describe('edge: 14 días exactos hasta el segundo', () => {
    it('exactamente 14 * 24h → 100%', () => {
      // Construido para caer en exactamente 14 días sin residuo.
      const courseStartsAt = new Date('2026-06-01T09:00:00Z');
      const requestedAt = new Date(courseStartsAt.getTime() - 14 * 86_400_000);
      const r = computeRefundAmount({
        paidAmount: 100,
        courseStartsAt,
        requestedAt,
      });
      expect(r.daysBeforeStart).toBe(14);
      expect(r.percentage).toBe(100);
    });

    it('14 días menos 1 segundo → 75% (Math.floor da 13)', () => {
      const courseStartsAt = new Date('2026-06-01T09:00:00Z');
      const requestedAt = new Date(courseStartsAt.getTime() - 14 * 86_400_000 + 1_000);
      const r = computeRefundAmount({
        paidAmount: 100,
        courseStartsAt,
        requestedAt,
      });
      expect(r.daysBeforeStart).toBe(13);
      expect(r.percentage).toBe(75);
    });
  });
});
