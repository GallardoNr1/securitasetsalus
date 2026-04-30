import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
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
          claveroSkillSuffix: true,
        },
      },
    },
  });

  const activeCount = diplomas.filter((d) => d.status === 'ACTIVE').length;

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
        <h1 className={styles.title}>
          Mis <span className={styles.titleItalic}>diplomas.</span>
        </h1>
        <p className={styles.lead}>
          Cada diploma lleva un código de verificación pública — cualquiera puede comprobar su
          autenticidad introduciéndolo en{' '}
          <Link href="/verify" className={styles.leadLink}>
            /verify
          </Link>
          .
        </p>
        <div className={styles.metaRow}>
          <span className={styles.metaPill}>
            <span className={styles.metaDot} aria-hidden />
            {diplomas.length === 0
              ? 'Sin diplomas todavía'
              : activeCount === diplomas.length
                ? `${diplomas.length} ${diplomas.length === 1 ? 'diploma vigente' : 'diplomas vigentes'}`
                : `${activeCount} de ${diplomas.length} ${diplomas.length === 1 ? 'vigente' : 'vigentes'}`}
          </span>
        </div>
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
            const skill = d.course.claveroSkillCode
              ? `${d.course.claveroSkillCode}${
                  d.course.claveroSkillSuffix ? ` (${d.course.claveroSkillSuffix})` : ''
                }`
              : null;

            return (
              <li
                key={d.id}
                className={`${styles.item} ${isActive ? '' : styles.itemRevoked}`}
              >
                <div className={styles.itemLeft}>
                  <div
                    className={`${styles.statusPill} ${
                      isActive ? '' : styles.statusPillDanger
                    }`}
                  >
                    <span
                      className={`${styles.statusDot} ${
                        isActive ? '' : styles.statusDotDanger
                      }`}
                      aria-hidden
                    />
                    <span className={styles.statusText}>
                      {isActive ? 'Diploma vigente' : 'Diploma revocado'}
                    </span>
                    <span
                      className={`${styles.statusBadge} ${
                        isActive ? '' : styles.statusBadgeDanger
                      }`}
                    >
                      {isActive ? 'VIGENTE' : 'REVOCADO'}
                    </span>
                  </div>

                  <div className={styles.courseEyebrow}>Curso acreditado</div>
                  <h2 className={styles.courseTitle}>{d.course.title}</h2>

                  <div className={styles.codeBlock}>
                    <div className={styles.codeEyebrow}>Código de verificación</div>
                    <div className={styles.code}>{d.code}</div>
                  </div>

                  <dl className={styles.meta}>
                    <div className={styles.field}>
                      <dt>Duración</dt>
                      <dd>{d.course.durationHours} horas lectivas</dd>
                    </div>
                    <div className={styles.field}>
                      <dt>Emitido</dt>
                      <dd>{formatDate(d.issuedAt, 'long')}</dd>
                    </div>
                    {d.course.venueName ? (
                      <div className={styles.field}>
                        <dt>Sede</dt>
                        <dd>{d.course.venueName}</dd>
                      </div>
                    ) : null}
                    {skill ? (
                      <div className={styles.field}>
                        <dt>Skill Clavero</dt>
                        <dd className={styles.fieldMono}>{skill}</dd>
                      </div>
                    ) : null}
                  </dl>

                  {!isActive && d.revocationReason ? (
                    <div className={styles.revocationNote}>
                      <p>
                        <strong>Motivo de revocación:</strong> {d.revocationReason}
                      </p>
                    </div>
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
                        <QrIcon /> Verificación pública
                      </Link>
                    </div>
                  ) : null}
                </div>

                {isActive ? (
                  <div className={styles.itemRight} aria-hidden>
                    <Image
                      src="/brand/logo-seal.png"
                      alt=""
                      width={140}
                      height={140}
                      className={styles.seal}
                    />
                    <div className={styles.sigEyebrow}>Sello SES</div>
                    <div className={styles.sigText}>
                      Acredita formación
                      <br />
                      No caduca
                    </div>
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

function QrIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x={3} y={3} width={7} height={7} />
      <rect x={14} y={3} width={7} height={7} />
      <rect x={3} y={14} width={7} height={7} />
      <path d="M14 14h3v3h-3zM20 14v3M14 20h3" />
    </svg>
  );
}
