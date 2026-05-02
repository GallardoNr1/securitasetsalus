'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { hashPassword, verifyPassword } from '@/lib/password';
import {
  deleteObject,
  isBucketConfigured,
  r2Keys,
  uploadBuffer,
} from '@/lib/r2';
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

// ---------- Avatar (foto de perfil) ----------

const ALLOWED_AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB ya recortado a 512×512

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export type AvatarActionResult =
  | { ok: true; message: string }
  | {
      ok: false;
      formError:
        | 'unauthorized'
        | 'storage-not-configured'
        | 'invalid-file'
        | 'too-large'
        | 'unknown';
    };

/**
 * Sube la foto de perfil del usuario autenticado al bucket R2 `avatars`,
 * borra la anterior si existía, y guarda la nueva key en User.avatarKey.
 *
 * El recorte cuadrado a 512×512 lo hace el cliente (AvatarUploader.tsx)
 * antes de mandar el blob; aquí solo validamos tipo, tamaño y subimos.
 */
export async function uploadAvatarAction(formData: FormData): Promise<AvatarActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, formError: 'unauthorized' };
  }
  if (!isBucketConfigured('avatars')) {
    return { ok: false, formError: 'storage-not-configured' };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { ok: false, formError: 'invalid-file' };
  }
  if (!ALLOWED_AVATAR_MIME.includes(file.type)) {
    return { ok: false, formError: 'invalid-file' };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, formError: 'too-large' };
  }

  const ext = MIME_TO_EXT[file.type] ?? 'jpg';
  const newKey = r2Keys.avatar(session.user.id, ext);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadBuffer('avatars', newKey, buffer, file.type);

    // Lee la key actual para borrarla después de actualizar (best-effort).
    const existing = await db.user.findUnique({
      where: { id: session.user.id },
      select: { avatarKey: true },
    });

    await db.user.update({
      where: { id: session.user.id },
      data: { avatarKey: newKey },
    });

    if (existing?.avatarKey && existing.avatarKey !== newKey) {
      try {
        await deleteObject('avatars', existing.avatarKey);
      } catch (err) {
        // Si el viejo objeto ya no existe (limpieza manual, etc.), no
        // bloqueamos la actualización del avatar nuevo.
        logger.warn('avatar: no se pudo borrar la key anterior', {
          previousKey: existing.avatarKey,
          err,
        });
      }
    }

    revalidatePath('/profile');
    revalidatePath('/');
    return { ok: true, message: 'Foto de perfil actualizada.' };
  } catch (err) {
    logger.error('avatar upload failed', err, {
      tags: { feature: 'avatar', action: 'upload' },
      userId: session.user.id,
    });
    return { ok: false, formError: 'unknown' };
  }
}

/**
 * Elimina la foto de perfil actual: borra del bucket R2 y pone avatarKey
 * a null en BD. Idempotente — si ya no había foto, no hace nada.
 */
export async function deleteAvatarAction(): Promise<AvatarActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, formError: 'unauthorized' };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { avatarKey: true },
  });
  if (!user?.avatarKey) {
    return { ok: true, message: 'No había foto que eliminar.' };
  }

  try {
    if (isBucketConfigured('avatars')) {
      try {
        await deleteObject('avatars', user.avatarKey);
      } catch (err) {
        logger.warn('avatar delete: R2 delete failed (best-effort)', {
          key: user.avatarKey,
          err,
        });
      }
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { avatarKey: null },
    });

    revalidatePath('/profile');
    revalidatePath('/');
    return { ok: true, message: 'Foto de perfil eliminada.' };
  } catch (err) {
    logger.error('avatar delete failed', err, {
      tags: { feature: 'avatar', action: 'delete' },
      userId: session.user.id,
    });
    return { ok: false, formError: 'unknown' };
  }
}
