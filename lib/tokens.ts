import { createHash, randomBytes } from 'crypto';
import { db } from '@/lib/db';

/**
 * Password reset tokens.
 *
 * - El token en claro solo existe en memoria mientras se manda por email.
 *   En BD guardamos únicamente su SHA-256 — si la BD se compromete, los
 *   enlaces pendientes no son utilizables.
 * - Expiración corta (60 min) para minimizar ventana de abuso si el correo
 *   se filtra.
 * - Un solo uso: al consumir se marca `consumedAt`.
 * - Al generar uno nuevo, invalidamos los anteriores del mismo user para
 *   que "pedir otro enlace" siempre funcione como reinicio limpio.
 */

export const PASSWORD_RESET_EXPIRY_MINUTES = 60;
// Email verification: TTL más holgado porque el usuario suele revisar el
// correo más tarde (no al instante como en una recuperación de contraseña).
export const EMAIL_VERIFICATION_EXPIRY_MINUTES = 60 * 24; // 24 horas

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateRawToken(): string {
  // 32 bytes aleatorios → 64 chars hex. Suficiente para resistir fuerza
  // bruta online durante la ventana de 60 min.
  return randomBytes(32).toString('hex');
}

/**
 * Crea un token de reset y devuelve el valor en claro para incluirlo en el
 * enlace del email. Invalida tokens previos del mismo usuario.
 */
export async function createPasswordResetToken(userId: string): Promise<{
  rawToken: string;
  expiresAt: Date;
}> {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);

  await db.$transaction([
    db.passwordResetToken.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    db.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    }),
  ]);

  return { rawToken, expiresAt };
}

type ConsumeResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'invalid' | 'expired' | 'used' };

/**
 * Valida un token en claro. Si es válido, lo marca como consumido y devuelve
 * el userId para que el caller actualice la contraseña.
 * No lanza en caminos "normales" (token inválido, expirado, ya usado).
 */
export async function consumePasswordResetToken(rawToken: string): Promise<ConsumeResult> {
  const tokenHash = hashToken(rawToken);
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash },
  });
  if (!record) return { ok: false, reason: 'invalid' };
  if (record.consumedAt) return { ok: false, reason: 'used' };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: 'expired' };

  await db.passwordResetToken.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  return { ok: true, userId: record.userId };
}

/**
 * Versión read-only para mostrar/ocultar el formulario de nueva contraseña
 * sin consumir el token aún. No devuelve userId para no exponer info extra.
 */
export async function inspectPasswordResetToken(
  rawToken: string,
): Promise<{ valid: true } | { valid: false; reason: 'invalid' | 'expired' | 'used' }> {
  const tokenHash = hashToken(rawToken);
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash },
  });
  if (!record) return { valid: false, reason: 'invalid' };
  if (record.consumedAt) return { valid: false, reason: 'used' };
  if (record.expiresAt.getTime() < Date.now()) return { valid: false, reason: 'expired' };
  return { valid: true };
}

// ---------------------------------------------------------------------
// Email verification tokens (mismo patrón que password reset)
// ---------------------------------------------------------------------

/**
 * Genera un token de verificación de email. Invalida los previos del
 * mismo usuario (si pidió varios "reenviar email", solo el último vale).
 */
export async function createEmailVerificationToken(userId: string): Promise<{
  rawToken: string;
  expiresAt: Date;
}> {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MINUTES * 60 * 1000);

  await db.$transaction([
    db.emailVerificationToken.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: new Date() },
    }),
    db.emailVerificationToken.create({
      data: { userId, tokenHash, expiresAt },
    }),
  ]);

  return { rawToken, expiresAt };
}

type ConsumeEmailResult =
  | { ok: true; userId: string; alreadyVerified: boolean }
  | { ok: false; reason: 'invalid' | 'expired' | 'used' };

/**
 * Consume un token de verificación. Si es válido, marca emailVerifiedAt
 * en el User (idempotente: si ya estaba verificado, devuelve alreadyVerified
 * sin tocar la fecha).
 */
export async function consumeEmailVerificationToken(rawToken: string): Promise<ConsumeEmailResult> {
  const tokenHash = hashToken(rawToken);
  const record = await db.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, emailVerifiedAt: true } } },
  });
  if (!record) return { ok: false, reason: 'invalid' };
  if (record.consumedAt) return { ok: false, reason: 'used' };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: 'expired' };

  const wasVerified = record.user.emailVerifiedAt !== null;

  await db.$transaction([
    db.emailVerificationToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    }),
    // Solo actualiza si no estaba ya verificado: respetamos la fecha
    // original de verificación (auditoría).
    ...(wasVerified
      ? []
      : [
          db.user.update({
            where: { id: record.userId },
            data: { emailVerifiedAt: new Date() },
          }),
        ]),
  ]);

  return { ok: true, userId: record.userId, alreadyVerified: wasVerified };
}
