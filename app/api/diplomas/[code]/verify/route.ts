import { NextResponse } from 'next/server';
import { findDiplomaByCodePublic } from '@/lib/queries/diplomas';
import { limitVerifyDiploma } from '@/lib/ratelimit';
import { logger } from '@/lib/logger';

/**
 * Verificación pública del diploma — endpoint JSON sin autenticación.
 *
 * Lo consumen:
 *  - Clavero (al verificar diplomas que un cerrajero adjunta a su solicitud
 *    de Certificado Profesional). Ver Clavero `docs/v2-refactor-plan.md` §6.
 *  - Empleadores, autoridades, aseguradoras, etc. — cualquier integración
 *    de tercero que quiera comprobar la autenticidad de un diploma SES.
 *  - La propia página `/verify/[code]` cuando se quiera client-side.
 *
 * Permisos: ninguno. El código es la "credencial" — quien lo conoce, ve
 * los datos públicos. Los códigos son largos (32^8 combinaciones, ~10^12)
 * así que no son enumerables por fuerza bruta.
 *
 * CORS: abierto (`*`) porque el caso de uso es justo este — terceros
 * consumiendo desde dominios que no controlamos.
 *
 * Rate limit: 30 req/min por IP vía Upstash sliding window
 * (`lib/ratelimit.ts`). Si Upstash no está configurado, degrada a no-op
 * con un debug log para no romper dev local.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
} as const;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  // Rate limit por IP. En Vercel `x-forwarded-for` lleva la IP del cliente
  // (la última IP del chain — Vercel inyecta una sola). En local
  // probablemente sea undefined → usamos un placeholder estable.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limit = await limitVerifyDiploma(ip);
  if (!limit.success) {
    logger.warn('verify endpoint rate-limited', {
      ip,
      remaining: limit.remaining,
      reset: limit.reset,
    });
    const retryAfterSec = Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000));
    return jsonResponse(
      { error: 'rate_limited', retryAfter: retryAfterSec },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSec),
          'X-RateLimit-Limit': String(limit.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(limit.reset),
        },
      },
    );
  }

  const { code } = await params;

  // Normalizamos: aceptamos códigos en minúsculas o con espacios accidentales.
  // Si llega un slug raro de URL, mejor 400 que ir a BD con basura.
  // El charset coincide con lib/diploma/code.ts (sin caracteres ambiguos
  // como 0/O, 1/I/L) — así rechazamos a nivel de formato cualquier input
  // que ni siquiera podría haber sido generado por nosotros.
  const normalized = code.trim().toUpperCase();
  if (!/^SES-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/.test(normalized)) {
    return jsonResponse(
      { error: 'invalid_code_format', code: normalized },
      { status: 400 },
    );
  }

  const diploma = await findDiplomaByCodePublic(normalized);

  if (!diploma) {
    return jsonResponse(
      { error: 'not_found', code: normalized },
      { status: 404 },
    );
  }

  if (diploma.status === 'REVOKED') {
    return jsonResponse(
      {
        code: diploma.code,
        status: 'REVOKED' as const,
        issuedAt: diploma.issuedAt.toISOString(),
        revokedAt: diploma.revokedAt?.toISOString() ?? null,
        revocationReason: diploma.revocationReason ?? null,
      },
      { status: 410 }, // Gone — semántica HTTP correcta para "existió pero ya no es válido"
    );
  }

  return jsonResponse(
    {
      code: diploma.code,
      status: 'ACTIVE' as const,
      issuedAt: diploma.issuedAt.toISOString(),
      course: {
        title: diploma.course.title,
        slug: diploma.course.slug,
        durationHours: diploma.course.durationHours,
        venueName: diploma.course.venueName,
        region: diploma.course.region,
        subdivision: diploma.course.subdivision,
        claveroSkillCode: diploma.course.claveroSkillCode,
        claveroSkillSuffix: diploma.course.claveroSkillSuffix,
      },
      user: {
        name: diploma.user.name,
      },
    },
    { status: 200 },
  );
}

function jsonResponse(body: unknown, init: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...CORS_HEADERS, ...(init.headers ?? {}) },
  });
}
