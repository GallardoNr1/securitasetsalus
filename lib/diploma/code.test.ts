import { describe, it, expect } from 'vitest';
import { generateDiplomaCode } from './code';

// Mismo charset que el generador en code.ts (sin 0/O, 1/I/L).
const CODE_FORMAT = /^SES-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;

describe('generateDiplomaCode', () => {
  it('produce un código en formato SES-XXXX-XXXX', () => {
    const code = generateDiplomaCode();
    expect(code).toMatch(CODE_FORMAT);
  });

  it('genera códigos sin caracteres ambiguos (0/O, 1/I/L)', () => {
    const code = generateDiplomaCode();
    expect(code).not.toMatch(/[0OIL1]/);
  });

  it('genera códigos distintos en llamadas sucesivas', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateDiplomaCode()));
    // Si generamos 100 códigos sobre 31^8 ≈ 8.5e11 combinaciones, la prob.
    // de colisión es <10^-9. Si fallara, tenemos un bug en la entropía.
    expect(codes.size).toBe(100);
  });
});

describe('regex de validación de código de diploma', () => {
  it('acepta códigos bien formados', () => {
    expect(CODE_FORMAT.test('SES-A4F2-9P3X')).toBe(true);
    expect(CODE_FORMAT.test('SES-ZZZZ-2222')).toBe(true);
    expect(CODE_FORMAT.test('SES-9P3X-A4F2')).toBe(true);
  });

  it('rechaza códigos con caracteres inválidos', () => {
    expect(CODE_FORMAT.test('SES-AAAA-0000')).toBe(false); // contiene 0
    expect(CODE_FORMAT.test('SES-IIII-AAAA')).toBe(false); // contiene I
    expect(CODE_FORMAT.test('SES-1234-AAAA')).toBe(false); // contiene 1
    expect(CODE_FORMAT.test('SES-LLLL-AAAA')).toBe(false); // contiene L
    expect(CODE_FORMAT.test('SES-OOOO-AAAA')).toBe(false); // contiene O
  });

  it('rechaza prefijos distintos a SES', () => {
    expect(CODE_FORMAT.test('CLV-A4F2-9P3X')).toBe(false);
    expect(CODE_FORMAT.test('XYZ-A4F2-9P3X')).toBe(false);
  });

  it('rechaza longitudes incorrectas', () => {
    expect(CODE_FORMAT.test('SES-A4F-9P3X')).toBe(false);
    expect(CODE_FORMAT.test('SES-A4F2-9P3')).toBe(false);
    expect(CODE_FORMAT.test('SES-A4F2-9P3X-EXTRA')).toBe(false);
  });

  it('rechaza minúsculas (el endpoint normaliza a mayúsculas antes de validar)', () => {
    expect(CODE_FORMAT.test('ses-a4f2-9p3x')).toBe(false);
  });
});
