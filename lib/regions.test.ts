import { describe, expect, it } from 'vitest';
import {
  getSubdivisionName,
  getSubdivisions,
  isValidSubdivisionForCountry,
  REGION_LABELS,
  SUBDIVISION_LABEL,
  SUPPORTED_REGIONS,
} from './regions';

describe('SUPPORTED_REGIONS y REGION_LABELS', () => {
  it('cubre los 7 países iniciales', () => {
    expect(SUPPORTED_REGIONS).toEqual(['CL', 'AR', 'PE', 'CO', 'MX', 'EC', 'UY']);
  });

  it('todos los códigos tienen label', () => {
    for (const code of SUPPORTED_REGIONS) {
      expect(REGION_LABELS[code]).toBeTruthy();
    }
  });

  it('todos los países tienen su SUBDIVISION_LABEL específico', () => {
    expect(SUBDIVISION_LABEL.CL).toBe('Región');
    expect(SUBDIVISION_LABEL.AR).toBe('Provincia');
    expect(SUBDIVISION_LABEL.MX).toBe('Estado');
    expect(SUBDIVISION_LABEL.PE).toBe('Departamento');
    expect(SUBDIVISION_LABEL.CO).toBe('Departamento');
    expect(SUBDIVISION_LABEL.EC).toBe('Provincia');
    expect(SUBDIVISION_LABEL.UY).toBe('Departamento');
  });
});

describe('getSubdivisions', () => {
  it('Chile tiene exactamente 16 regiones', () => {
    const subs = getSubdivisions('CL');
    expect(subs).toHaveLength(16);
  });

  it('Argentina tiene exactamente 24 provincias (23 + CABA)', () => {
    const subs = getSubdivisions('AR');
    expect(subs).toHaveLength(24);
  });

  it('México tiene exactamente 32 estados', () => {
    const subs = getSubdivisions('MX');
    expect(subs).toHaveLength(32);
  });

  it('todos los códigos siguen el formato ISO 3166-2 con prefijo del país', () => {
    for (const country of SUPPORTED_REGIONS) {
      for (const sub of getSubdivisions(country)) {
        expect(sub.code).toMatch(new RegExp(`^${country}-[A-Z0-9]+$`));
        expect(sub.name).toBeTruthy();
      }
    }
  });

  it('contiene subdivisiones específicas conocidas', () => {
    const cl = getSubdivisions('CL').map((s) => s.code);
    expect(cl).toContain('CL-RM'); // Región Metropolitana

    const ar = getSubdivisions('AR').map((s) => s.code);
    expect(ar).toContain('AR-C'); // CABA

    const mx = getSubdivisions('MX').map((s) => s.code);
    expect(mx).toContain('MX-CMX'); // CDMX
  });
});

describe('getSubdivisionName', () => {
  it('devuelve el nombre oficial dado un code', () => {
    expect(getSubdivisionName('CL-RM')).toBe('Región Metropolitana de Santiago');
    expect(getSubdivisionName('AR-C')).toBe('Ciudad Autónoma de Buenos Aires');
    expect(getSubdivisionName('MX-CMX')).toBe('Ciudad de México');
  });

  it('null/undefined → null', () => {
    expect(getSubdivisionName(null)).toBeNull();
    expect(getSubdivisionName(undefined)).toBeNull();
  });

  it('code inexistente → null (no lanza)', () => {
    expect(getSubdivisionName('XX-FAKE')).toBeNull();
    expect(getSubdivisionName('')).toBeNull();
  });
});

describe('isValidSubdivisionForCountry', () => {
  it('null/undefined es válido (campo opcional)', () => {
    expect(isValidSubdivisionForCountry(null, 'CL')).toBe(true);
    expect(isValidSubdivisionForCountry(undefined, 'CL')).toBe(true);
  });

  it('code que pertenece al país → true', () => {
    expect(isValidSubdivisionForCountry('CL-RM', 'CL')).toBe(true);
    expect(isValidSubdivisionForCountry('AR-B', 'AR')).toBe(true);
    expect(isValidSubdivisionForCountry('MX-CMX', 'MX')).toBe(true);
  });

  it('code que NO pertenece al país → false (defensa anti URL manipulada)', () => {
    expect(isValidSubdivisionForCountry('CL-RM', 'AR')).toBe(false);
    expect(isValidSubdivisionForCountry('MX-CMX', 'PE')).toBe(false);
  });

  it('code malformado → false', () => {
    expect(isValidSubdivisionForCountry('FAKE', 'CL')).toBe(false);
    expect(isValidSubdivisionForCountry('CL-INEXISTENTE', 'CL')).toBe(false);
  });
});
