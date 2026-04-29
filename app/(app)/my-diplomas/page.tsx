import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Mis diplomas',
  robots: { index: false, follow: false },
};

export default async function MyDiplomasPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'STUDENT' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const diplomas = await db.diploma.findMany({
    where: { userId: session.user.id },
    orderBy: [{ issuedAt: 'desc' }],
    select: {
      id: true,
      code: true,
      status: true,
      issuedAt: true,
      pdfKey: true,
      revokedAt: true,
      revocationReason: true,
      course: {
        select: {
          title: true,
          slug: true,
          durationHours: true,
          venueName: true,
          claveroSkillCode: true,
        },
      },
    },
  });

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Mi panel', href: '/dashboard' },
          { label: 'Mis diplomas' },
        ]}
      />
      <header className={styles.header}>
        <span className={styles.eyebrow}>Tus diplomas</span>
        <h1>Mis diplomas</h1>
        <p>
          Todos los diplomas que has obtenido en SES. Cada uno lleva un código de verificación
          público — cualquiera puede comprobar su autenticidad introduciéndolo en{' '}
          <code>/verify</code>.
        </p>
      </header>

      {diplomas.length === 0 ? (
        <div className={styles.empty}>
          <h2>Aún no tienes diplomas</h2>
          <p>
            Los diplomas aparecen aquí cuando completas un curso satisfactoriamente y el
            instructor cierra la evaluación final.
          </p>
          <Button href="/courses" variant="primary" size="md">
            Ver catálogo
          </Button>
        </div>
      ) : (
        <ul className={styles.list}>
          {diplomas.map((d) => {
            const isActive = d.status === 'ACTIVE';
            return (
              <li key={d.id} className={styles.item}>
                <header className={styles.itemHeader}>
                  <Badge
                    status={isActive ? 'active' : 'revoked'}
                    showDot={false}
                  >
                    {isActive ? 'Vigente' : 'Revocado'}
                  </Badge>
                  <span className={styles.muted}>
                    Emitido el {formatDate(d.issuedAt, 'long')}
                  </span>
                </header>

                <h2>{d.course.title}</h2>

                <dl className={styles.meta}>
                  <div>
                    <dt>Código</dt>
                    <dd className={styles.code}>{d.code}</dd>
                  </div>
                  <div>
                    <dt>Duración</dt>
                    <dd>{d.course.durationHours} h lectivas</dd>
                  </div>
                  {d.course.venueName ? (
                    <div>
                      <dt>Sede</dt>
                      <dd>{d.course.venueName}</dd>
                    </div>
                  ) : null}
                  {d.course.claveroSkillCode ? (
                    <div>
                      <dt>Skill acreditado (Clavero)</dt>
                      <dd>{d.course.claveroSkillCode}</dd>
                    </div>
                  ) : null}
                </dl>

                {!isActive && d.revocationReason ? (
                  <p className={styles.revocation}>
                    Motivo de revocación: {d.revocationReason}
                  </p>
                ) : null}

                {isActive ? (
                  <div className={styles.actions}>
                    {d.pdfKey ? (
                      <a
                        href={`/api/diplomas/${d.code}/download`}
                        className={styles.primary}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver diploma →
                      </a>
                    ) : null}
                    <Link href={`/verify/${d.code}`} className={styles.secondary}>
                      Página de verificación
                    </Link>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
