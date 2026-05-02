'use server';

import { headers } from 'next/headers';
import { AuthError } from 'next-auth';
import type { Role } from '@prisma/client';
import { signIn } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { limitLogin } from '@/lib/ratelimit';
import { loginSchema, magicLinkSchema } from '@/lib/validations/auth';

export type LoginActionResult =
  | { ok: true; role: Role }
  | {
      ok: false;
      error:
        | 'invalid'
        | 'email-not-verified'
        | 'account-suspended'
        | 'rate-limited'
        | 'unknown';
      message: string;
    };

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

export async function loginAction(formData: FormData): Promise<LoginActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalid',
      message: 'Revisa el email y la contraseña.',
    };
  }

  // Rate limit: 5 intentos/min por (IP, email). Bloquea brute force
  // de contraseñas y limita el daño si una IP rota emails.
  const ip = await clientIp();
  const rl = await limitLogin(ip, parsed.data.email);
  if (!rl.success) {
    logger.warn('login rate-limited', { ip, email: parsed.data.email });
    return {
      ok: false,
      error: 'rate-limited',
      message: 'Demasiados intentos. Espera un momento antes de volver a intentarlo.',
    };
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    // Para que el cliente pueda redirigir al dashboard correcto, devolvemos
    // el rol del usuario. Lo leemos directamente de BD — usar `auth()` aquí
    // mismo no funcionaría porque las cookies recién escritas por signIn
    // todavía no están disponibles en el request context actual.
    const user = await db.user.findUnique({
      where: { email: parsed.data.email },
      select: { role: true },
    });
    if (!user) {
      return {
        ok: false,
        error: 'unknown',
        message: 'No encontramos tu cuenta tras el login. Recarga e inténtalo de nuevo.',
      };
    }
    return { ok: true, role: user.role };
  } catch (err) {
    if (err instanceof AuthError) {
      const code = (err.cause?.err as { code?: string } | undefined)?.code;
      if (code === 'email-not-verified') {
        return {
          ok: false,
          error: 'email-not-verified',
          message:
            'Tu correo aún no está verificado. Revisa tu bandeja o pide un nuevo enlace de verificación.',
        };
      }
      if (code === 'account-suspended') {
        return {
          ok: false,
          error: 'account-suspended',
          message:
            'Tu cuenta está suspendida. Contacta a soporte si crees que es un error.',
        };
      }
      return {
        ok: false,
        error: 'invalid',
        message: 'Email o contraseña incorrectos.',
      };
    }
    return {
      ok: false,
      error: 'unknown',
      message: 'No pudimos iniciar sesión ahora mismo. Inténtalo de nuevo en un momento.',
    };
  }
}

export type MagicLinkActionResult =
  | { ok: true; email: string }
  | { ok: false; error: 'invalid' | 'rate-limited' | 'unknown'; message: string };

export async function magicLinkAction(formData: FormData): Promise<MagicLinkActionResult> {
  const parsed = magicLinkSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { ok: false, error: 'invalid', message: 'Introduce un correo válido.' };
  }

  // Mismo bucket que login: si alguien spamea magic links a un usuario,
  // que comparta cuota con sus intentos de password.
  const ip = await clientIp();
  const rl = await limitLogin(ip, parsed.data.email);
  if (!rl.success) {
    logger.warn('magic-link rate-limited', { ip, email: parsed.data.email });
    return {
      ok: false,
      error: 'rate-limited',
      message: 'Demasiadas peticiones. Espera un momento antes de pedir otro enlace.',
    };
  }

  try {
    await signIn('resend', { email: parsed.data.email, redirect: false });
    return { ok: true, email: parsed.data.email };
  } catch {
    // No filtramos detalles. Si Resend está caído o el email no existe, el
    // mensaje es siempre el mismo (no leak de información sobre cuentas).
    return {
      ok: true,
      email: parsed.data.email,
    };
  }
}
