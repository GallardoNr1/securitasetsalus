'use server';

import { AuthError } from 'next-auth';
import type { Role } from '@prisma/client';
import { signIn } from '@/lib/auth';
import { db } from '@/lib/db';
import { loginSchema, magicLinkSchema } from '@/lib/validations/auth';

export type LoginActionResult =
  | { ok: true; role: Role }
  | { ok: false; error: 'invalid' | 'email-not-verified' | 'unknown'; message: string };

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
      // Distingue email-not-verified (lanzado por authorize en lib/auth.ts).
      if (err.cause?.err && (err.cause.err as { code?: string }).code === 'email-not-verified') {
        return {
          ok: false,
          error: 'email-not-verified',
          message:
            'Tu correo aún no está verificado. Revisa tu bandeja o pide un nuevo enlace de verificación.',
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
  | { ok: false; error: 'invalid' | 'unknown'; message: string };

export async function magicLinkAction(formData: FormData): Promise<MagicLinkActionResult> {
  const parsed = magicLinkSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { ok: false, error: 'invalid', message: 'Introduce un correo válido.' };
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
