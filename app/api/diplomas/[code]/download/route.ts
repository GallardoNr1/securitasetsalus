import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getSignedDownloadUrl, isBucketConfigured } from '@/lib/r2';

/**
 * Descarga del PDF del diploma.
 *
 * Devuelve un 302 a una URL firmada de R2 con expiración corta (15 min).
 * El PDF NO se sirve directamente desde Vercel para evitar costes y
 * limitar el TTFB — R2 es CDN-friendly.
 *
 * Permisos:
 *  - El propio alumno puede descargar su diploma.
 *  - El instructor del curso puede descargarlo (validar emisión).
 *  - Un SUPER_ADMIN puede descargar cualquier diploma.
 *  - Cualquier otro usuario recibe 403.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { code } = await params;
  const diploma = await db.diploma.findUnique({
    where: { code },
    select: {
      pdfKey: true,
      userId: true,
      status: true,
      course: { select: { instructorId: true, title: true } },
    },
  });

  if (!diploma) {
    return new NextResponse('Diploma no encontrado', { status: 404 });
  }

  if (diploma.status === 'REVOKED') {
    return new NextResponse('Diploma revocado', { status: 410 });
  }

  const isOwner = diploma.userId === session.user.id;
  const isInstructor = diploma.course.instructorId === session.user.id;
  const isAdmin = session.user.role === 'SUPER_ADMIN';
  if (!isOwner && !isInstructor && !isAdmin) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (!diploma.pdfKey) {
    return new NextResponse(
      'PDF no disponible — R2 no estaba configurado al emitir este diploma',
      { status: 503 },
    );
  }

  if (!isBucketConfigured('diplomas')) {
    return new NextResponse('R2 no configurado', { status: 503 });
  }

  const url = await getSignedDownloadUrl('diplomas', diploma.pdfKey, {
    expiresInSeconds: 15 * 60,
    filename: `Diploma SES — ${diploma.course.title}.pdf`,
  });

  return NextResponse.redirect(url, 302);
}
