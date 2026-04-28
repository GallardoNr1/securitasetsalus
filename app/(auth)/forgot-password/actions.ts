'use server';

import { db } from '@/lib/db';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import { createPasswordResetToken, PASSWORD_RESET_EXPIRY_MINUTES } from '@/lib/tokens';
import { sendPasswordResetEmail } from '@/lib/email/send';

export type ForgotActionResult =
  | { ok: true }
  | { ok: false; error: 'invalid'; message: string };

/**
 * Genera un token de reset y manda el email. Diseñado para no revelar
 * si una cuenta existe o no: SIEMPRE devuelve `ok: true` cuando el email
 * tiene formato válido (incluso si no hay usuario con ese email).
 */
export async function forgotPasswordAction(formData: FormData): Promise<ForgotActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { ok: false, error: 'invalid', message: 'Introduce un correo válido.' };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true },
  });

  if (user) {
    const { rawToken } = await createPasswordResetToken(user.id);
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token: rawToken,
      expiresInMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
    });
  }
  // Caso "no existe": no hacemos nada pero respondemos OK.

  return { ok: true };
}
