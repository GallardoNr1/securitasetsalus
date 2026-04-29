import { db } from '@/lib/db';

/**
 * Busca un diploma por su código corto público (formato `SES-XXXX-XXXX`).
 *
 * Esta query alimenta dos consumidores:
 *  1. El endpoint público `/api/diplomas/[code]/verify` (JSON, sin auth).
 *  2. La página pública `/verify/[code]` (HTML, sin auth).
 *
 * Solo selecciona campos que pueden ser públicos. Crucialmente NO devolvemos
 * email del alumno, ni info de pago, ni `enrollmentId`. Lo expuesto es lo
 * mínimo necesario para que un tercero (cliente, empleador, autoridad,
 * Clavero) pueda confirmar que el diploma existe y a qué curso/persona
 * pertenece.
 *
 * Devuelve null si el código no existe.
 */
export async function findDiplomaByCodePublic(code: string) {
  return db.diploma.findUnique({
    where: { code },
    select: {
      code: true,
      status: true,
      issuedAt: true,
      revokedAt: true,
      revocationReason: true,
      user: {
        select: { name: true },
      },
      course: {
        select: {
          title: true,
          slug: true,
          durationHours: true,
          venueName: true,
          region: true,
          subdivision: true,
          claveroSkillCode: true,
          claveroSkillSuffix: true,
        },
      },
    },
  });
}

export type DiplomaPublicView = NonNullable<
  Awaited<ReturnType<typeof findDiplomaByCodePublic>>
>;
