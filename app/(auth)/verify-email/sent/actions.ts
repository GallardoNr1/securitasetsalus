'use server';

import { db } from '@/lib/db';
import { magicLinkSchema } from '@/lib/validations/auth';
import { createEmailVerificationToken, EMAIL_VERIFICATION_EXPIRY_MINUTES } from '@/lib/tokens';
import { sendEmailVerificationEmail } from '@/lib/email/send';

export type ResendVerificationResult =
  | { ok: true }
  | { ok: false; error: 'invalid'; message: string };

/**
 * Reenviar email de verificación. No revela si el email existe — siempre
 * responde OK si el formato es válido. Solo se manda si hay un usuario
 * STUDENT con ese email y todavía no verificado.
 */
export async function resendVerificationAction(
  formData: FormData,
): Promise<ResendVerificationResult> {
  const parsed = magicLinkSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { ok: false, error: 'invalid', message: 'Introduce un correo válido.' };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true, role: true, emailVerifiedAt: true },
  });

  if (user && user.role === 'STUDENT' && !user.emailVerifiedAt) {
    const { rawToken } = await createEmailVerificationToken(user.id);
    await sendEmailVerificationEmail({
      to: user.email,
      name: user.name,
      token: rawToken,
      expiresInHours: Math.floor(EMAIL_VERIFICATION_EXPIRY_MINUTES / 60),
    });
  }

  return { ok: true };
}
