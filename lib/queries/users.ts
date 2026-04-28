import { db } from '@/lib/db';

/**
 * Devuelve la `avatarKey` del usuario o null si no tiene foto subida.
 * Se usa desde el endpoint público /api/users/[id]/avatar para resolver
 * el redirect a la URL firmada de R2.
 */
export async function getUserAvatarKey(userId: string): Promise<string | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { avatarKey: true },
  });
  return user?.avatarKey ?? null;
}
