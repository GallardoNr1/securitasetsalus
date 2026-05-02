'use server';

import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { hashPassword } from '@/lib/password';
import { limitSignup } from '@/lib/ratelimit';
import { registerSchema } from '@/lib/validations/auth';
import { createEmailVerificationToken, EMAIL_VERIFICATION_EXPIRY_MINUTES } from '@/lib/tokens';
import { sendEmailVerificationEmail } from '@/lib/email/send';

export type RegisterActionResult =
  | { ok: true; email: string }
  | {
      ok: false;
      error: 'invalid' | 'email-taken' | 'rate-limited' | 'unknown';
      message: string;
      fieldErrors?: Record<string, string>;
    };

export async function registerAction(formData: FormData): Promise<RegisterActionResult> {
  // Rate limit ANTES de parsear: aunque parsing es barato, esto
  // bloquea bots que envían payloads vacíos a saco para enumerar.
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await limitSignup(ip);
  if (!rl.success) {
    logger.warn('signup rate-limited', { ip });
    return {
      ok: false,
      error: 'rate-limited',
      message: 'Demasiados registros desde tu red. Espera una hora antes de intentarlo.',
    };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    region: formData.get('region'),
    phone: formData.get('phone'),
    rut: formData.get('rut'),
    password: formData.get('password'),
    passwordConfirm: formData.get('passwordConfirm'),
    acceptTerms: formData.get('acceptTerms') === 'on',
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.');
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      error: 'invalid',
      message: 'Revisa los datos del formulario.',
      fieldErrors,
    };
  }

  const data = parsed.data;

  // Comprobar si el email ya existe.
  const existing = await db.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existing) {
    return {
      ok: false,
      error: 'email-taken',
      message: 'Ya hay una cuenta con ese correo. Inicia sesión o recupera tu contraseña.',
    };
  }

  // Crear usuario con rol STUDENT (registro público solo crea alumnos).
  const passwordHash = await hashPassword(data.password);

  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: 'STUDENT',
      region: data.region,
      phone: data.phone ?? null,
      rut: data.rut ?? null,
    },
    select: { id: true, name: true, email: true },
  });

  // Generar y enviar token de verificación.
  const { rawToken } = await createEmailVerificationToken(user.id);
  await sendEmailVerificationEmail({
    to: user.email,
    name: user.name,
    token: rawToken,
    expiresInHours: Math.floor(EMAIL_VERIFICATION_EXPIRY_MINUTES / 60),
  });

  return { ok: true, email: user.email };
}
