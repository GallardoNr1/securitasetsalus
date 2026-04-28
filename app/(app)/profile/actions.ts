'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/password';
import { passwordChangeSchema, profileUpdateSchema } from '@/lib/validations/auth';

// ---------- Update perfil ----------

export type ProfileUpdateResult =
  | { ok: true; message: string }
  | { ok: false; error: 'unauthorized' | 'invalid' | 'unknown'; message: string; fieldErrors?: Record<string, string> };

export async function updateProfileAction(formData: FormData): Promise<ProfileUpdateResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: 'unauthorized', message: 'No estás autenticado.' };
  }

  const parsed = profileUpdateSchema.safeParse({
    name: formData.get('name'),
    region: formData.get('region'),
    subdivision: formData.get('subdivision'),
    phone: formData.get('phone'),
    rut: formData.get('rut'),
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

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      region: parsed.data.region,
      subdivision: parsed.data.subdivision ?? null,
      phone: parsed.data.phone ?? null,
      rut: parsed.data.rut ?? null,
    },
  });

  revalidatePath('/profile');
  return { ok: true, message: 'Tus datos se guardaron correctamente.' };
}

// ---------- Cambio de contraseña ----------

export type ChangePasswordResult =
  | { ok: true; message: string }
  | {
      ok: false;
      error: 'unauthorized' | 'invalid' | 'wrong-current' | 'no-password' | 'unknown';
      message: string;
    };

export async function changePasswordAction(formData: FormData): Promise<ChangePasswordResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: 'unauthorized', message: 'No estás autenticado.' };
  }

  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    newPasswordConfirm: formData.get('newPasswordConfirm'),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: 'invalid',
      message: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
    };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) {
    return { ok: false, error: 'unauthorized', message: 'No encontramos tu cuenta.' };
  }
  if (!user.passwordHash) {
    return {
      ok: false,
      error: 'no-password',
      message:
        'Tu cuenta usa Magic Link, no tiene contraseña. Pide un enlace de "Olvidé contraseña" para crear una.',
    };
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return {
      ok: false,
      error: 'wrong-current',
      message: 'La contraseña actual no es correcta.',
    };
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await db.user.update({
    where: { id: session.user.id },
    data: { passwordHash: newHash },
  });

  return { ok: true, message: 'Contraseña actualizada.' };
}
