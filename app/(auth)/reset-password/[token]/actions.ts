'use server';

import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { consumePasswordResetToken } from '@/lib/tokens';

export type ResetActionResult =
  | { ok: true }
  | { ok: false; error: 'invalid' | 'used' | 'expired'; message: string };

export async function resetPasswordAction(formData: FormData): Promise<ResetActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    passwordConfirm: formData.get('passwordConfirm'),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalid',
      message: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
    };
  }

  const consumed = await consumePasswordResetToken(parsed.data.token);
  if (!consumed.ok) {
    const messages = {
      invalid: 'El enlace no es válido. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".',
      used: 'Este enlace ya se usó. Si necesitas cambiar tu contraseña otra vez, pide uno nuevo.',
      expired: 'El enlace ha caducado. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".',
    } as const;
    return { ok: false, error: consumed.reason, message: messages[consumed.reason] };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.user.update({
    where: { id: consumed.userId },
    data: { passwordHash },
  });

  return { ok: true };
}
