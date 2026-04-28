'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/lib/auth';
import { loginSchema, magicLinkSchema } from '@/lib/validations/auth';

export type LoginActionResult =
  | { ok: true }
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
    return { ok: true };
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
