import { NextResponse } from 'next/server';
import { getUserAvatarKey } from '@/lib/queries/users';
import { getSignedDownloadUrl, isBucketConfigured } from '@/lib/r2';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/users/[id]/avatar
 *
 * Devuelve un 302 a una URL firmada de R2 (bucket `avatars`) con la foto
 * de perfil del usuario. Endpoint público (sin auth) — un avatar es
 * información tan visible como el nombre. Si el usuario no tiene foto,
 * devolvemos 404 y el componente <Avatar> renderiza el fallback de
 * iniciales.
 *
 * Cache-Control: 5 min en navegador. Más largo no compensa: cuando el
 * user sube un avatar nuevo, su key cambia (timestamp) y el componente
 * vuelve a pedir esta URL — el ciclo de cache es por key implícita.
 * Aceptamos un breve período stale tras un cambio.
 */
export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;

  const avatarKey = await getUserAvatarKey(id);
  if (!avatarKey) {
    return NextResponse.json({ error: 'no avatar' }, { status: 404 });
  }
  if (!isBucketConfigured('avatars')) {
    return NextResponse.json({ error: 'storage not configured' }, { status: 503 });
  }

  const url = await getSignedDownloadUrl('avatars', avatarKey, { expiresInSeconds: 3600 });
  return NextResponse.redirect(url, {
    status: 302,
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
