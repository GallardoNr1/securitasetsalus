import { afterEach, describe, expect, it, vi } from 'vitest';

// Mocks ANTES de importar el módulo bajo test — vi.mock se hoistea pero
// los mock factories se evalúan al importar.
vi.mock('@/lib/queries/diplomas', () => ({
  findDiplomaByCodePublic: vi.fn(),
}));

vi.mock('@/lib/ratelimit', () => ({
  limitVerifyDiploma: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { GET, OPTIONS } from './route';
import { findDiplomaByCodePublic } from '@/lib/queries/diplomas';
import { limitVerifyDiploma } from '@/lib/ratelimit';

const mockFindDiploma = vi.mocked(findDiplomaByCodePublic);
const mockLimit = vi.mocked(limitVerifyDiploma);

const ALLOW_PASS = {
  success: true,
  remaining: 29,
  reset: Date.now() + 60_000,
  limit: 30,
};

function buildRequest(code: string, ip = '1.2.3.4'): Request {
  return new Request(`https://securitasetsalus.cl/api/diplomas/${code}/verify`, {
    headers: { 'x-forwarded-for': ip },
  });
}

function paramsFor(code: string): { params: Promise<{ code: string }> } {
  return { params: Promise.resolve({ code }) };
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/diplomas/[code]/verify', () => {
  describe('formato del código', () => {
    it.each([
      'foo',
      'SES-XXXX', // demasiado corto
      'SES-1234-5678', // contiene 1 (carácter ambiguo del charset)
      'XYZ-ABCD-EFGH', // prefix incorrecto
      'SES-O123-ABCD', // contiene O (excluido)
    ])('400 cuando el código no encaja con el regex (%s)', async (code) => {
      mockLimit.mockResolvedValue(ALLOW_PASS);

      const res = await GET(buildRequest(code), paramsFor(code));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('invalid_code_format');
      expect(mockFindDiploma).not.toHaveBeenCalled();
    });

    it('normaliza minúsculas y espacios antes de validar formato', async () => {
      mockLimit.mockResolvedValue(ALLOW_PASS);
      mockFindDiploma.mockResolvedValue(null);

      const res = await GET(
        buildRequest('  ses-abcd-efgh  '),
        paramsFor('  ses-abcd-efgh  '),
      );

      // Pasa el regex (minúsculas + trim → SES-ABCD-EFGH) y va a 404.
      expect(res.status).toBe(404);
      expect(mockFindDiploma).toHaveBeenCalledWith('SES-ABCD-EFGH');
    });
  });

  describe('rate limit', () => {
    it('429 con Retry-After cuando supera la cuota', async () => {
      const reset = Date.now() + 30_000;
      mockLimit.mockResolvedValue({ success: false, remaining: 0, reset, limit: 30 });

      const res = await GET(
        buildRequest('SES-ABCD-EFGH'),
        paramsFor('SES-ABCD-EFGH'),
      );

      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBeDefined();
      expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0);
      expect(res.headers.get('X-RateLimit-Limit')).toBe('30');
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');

      const body = await res.json();
      expect(body.error).toBe('rate_limited');
      expect(body.retryAfter).toBeGreaterThan(0);

      // No debe haber consultado la BD si el rate limit ya bloqueó.
      expect(mockFindDiploma).not.toHaveBeenCalled();
    });

    it('extrae IP del header x-forwarded-for (toma la primera de la lista)', async () => {
      mockLimit.mockResolvedValue(ALLOW_PASS);
      mockFindDiploma.mockResolvedValue(null);

      const req = new Request(
        'https://securitasetsalus.cl/api/diplomas/SES-ABCD-EFGH/verify',
        { headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' } },
      );
      await GET(req, paramsFor('SES-ABCD-EFGH'));

      expect(mockLimit).toHaveBeenCalledWith('203.0.113.10');
    });

    it('usa "unknown" cuando no hay x-forwarded-for', async () => {
      mockLimit.mockResolvedValue(ALLOW_PASS);
      mockFindDiploma.mockResolvedValue(null);

      const req = new Request(
        'https://securitasetsalus.cl/api/diplomas/SES-ABCD-EFGH/verify',
      );
      await GET(req, paramsFor('SES-ABCD-EFGH'));

      expect(mockLimit).toHaveBeenCalledWith('unknown');
    });
  });

  describe('lookup en BD', () => {
    it('404 cuando el código no existe', async () => {
      mockLimit.mockResolvedValue(ALLOW_PASS);
      mockFindDiploma.mockResolvedValue(null);

      const res = await GET(
        buildRequest('SES-ABCD-EFGH'),
        paramsFor('SES-ABCD-EFGH'),
      );

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('not_found');
      expect(body.code).toBe('SES-ABCD-EFGH');
    });

    it('410 Gone con motivo cuando el diploma está revocado', async () => {
      mockLimit.mockResolvedValue(ALLOW_PASS);
      mockFindDiploma.mockResolvedValue({
        code: 'SES-ABCD-EFGH',
        status: 'REVOKED',
        issuedAt: new Date('2026-04-01T12:00:00Z'),
        revokedAt: new Date('2026-04-15T08:00:00Z'),
        revocationReason: 'Falsificación detectada',
        user: { name: 'Carla Pérez' },
        course: {
          title: 'Aperturas Básicas',
          slug: 'aperturas-basicas',
          durationHours: 24,
          venueName: 'Santiago',
          region: 'CL',
          subdivision: null,
          claveroSkillCode: 'AB',
          claveroSkillSuffix: null,
        },
      });

      const res = await GET(
        buildRequest('SES-ABCD-EFGH'),
        paramsFor('SES-ABCD-EFGH'),
      );

      expect(res.status).toBe(410);
      const body = await res.json();
      expect(body.status).toBe('REVOKED');
      expect(body.revocationReason).toBe('Falsificación detectada');
      expect(body.revokedAt).toBe('2026-04-15T08:00:00.000Z');
      // No debe filtrar datos del alumno o curso en respuesta REVOKED.
      expect(body.user).toBeUndefined();
      expect(body.course).toBeUndefined();
    });

    it('200 con datos completos del diploma cuando está ACTIVE', async () => {
      mockLimit.mockResolvedValue(ALLOW_PASS);
      mockFindDiploma.mockResolvedValue({
        code: 'SES-ABCD-EFGH',
        status: 'ACTIVE',
        issuedAt: new Date('2026-04-30T12:00:00Z'),
        revokedAt: null,
        revocationReason: null,
        user: { name: 'Carla Pérez González' },
        course: {
          title: 'Aperturas Básicas — Cilindros Estándar',
          slug: 'aperturas-basicas-cilindros',
          durationHours: 24,
          venueName: 'Santiago — Providencia',
          region: 'CL',
          subdivision: 'CL-RM',
          claveroSkillCode: 'AB',
          claveroSkillSuffix: null,
        },
      });

      const res = await GET(
        buildRequest('SES-ABCD-EFGH'),
        paramsFor('SES-ABCD-EFGH'),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        code: 'SES-ABCD-EFGH',
        status: 'ACTIVE',
        issuedAt: '2026-04-30T12:00:00.000Z',
        course: {
          title: 'Aperturas Básicas — Cilindros Estándar',
          slug: 'aperturas-basicas-cilindros',
          durationHours: 24,
          venueName: 'Santiago — Providencia',
          region: 'CL',
          subdivision: 'CL-RM',
          claveroSkillCode: 'AB',
          claveroSkillSuffix: null,
        },
        user: { name: 'Carla Pérez González' },
      });
    });
  });

  describe('CORS', () => {
    it('headers CORS abiertos en respuesta 200', async () => {
      mockLimit.mockResolvedValue(ALLOW_PASS);
      mockFindDiploma.mockResolvedValue(null);

      const res = await GET(
        buildRequest('SES-ABCD-EFGH'),
        paramsFor('SES-ABCD-EFGH'),
      );

      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });

    it('OPTIONS responde 204 con CORS para preflight', async () => {
      const res = await OPTIONS();
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });
  });
});
