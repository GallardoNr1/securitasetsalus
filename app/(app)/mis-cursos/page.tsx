import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listEnrollmentsByStudent } from '@/lib/queries/courses';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate, formatPrice } from '@/lib/format';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Mis cursos',
  robots: { index: false, follow: false },
};

const ENROLLMENT_STATUS_BADGE = {
  PENDING_PAYMENT: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  PENDING_EVALUATION: 'pending',
  COMPLETED: 'confirmed',
  FAILED: 'failed',
} as const;

const ENROLLMENT_STATUS_LABELS = {
  PENDING_PAYMENT: 'Pago pendiente',
  CONFIRMED: 'Inscrito',
  CANCELLED: 'Cancelado',
  PENDING_EVALUATION: 'Pendiente evaluación',
  COMPLETED: 'Completado',
  FAILED: 'No aprobado',
} as const;

export default async function MyCoursesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  // Solo STUDENT y SUPER_ADMIN (para preview) acceden a esta vista.
  if (session.user.role !== 'STUDENT' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const enrollments = await listEnrollmentsByStudent(session.user.id);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Tus inscripciones</span>
        <h1>Mis cursos</h1>
        <p>
          Cursos en los que te has inscrito. La inscripción real con pago llega en la fase 4 —
          de momento, esta lista solo se llena cuando un admin te inscribe manualmente desde su
          panel.
        </p>
      </header>

      {enrollments.length === 0 ? (
        <div className={styles.empty}>
          <h2>Aún no tienes cursos</h2>
          <p>Explora el catálogo para ver los cursos disponibles y cuándo empiezan.</p>
          <Button href="/cursos" variant="primary" size="md">
            Ver catálogo
          </Button>
        </div>
      ) : (
        <ul className={styles.list}>
          {enrollments.map((e) => {
            const firstSession = e.course.sessions[0];
            const lastSession = e.course.sessions[e.course.sessions.length - 1];
            return (
              <li key={e.id} className={styles.item}>
                <header className={styles.itemHeader}>
                  <Badge
                    status={ENROLLMENT_STATUS_BADGE[e.status]}
                    showDot={false}
                  >
                    {ENROLLMENT_STATUS_LABELS[e.status]}
                  </Badge>
                  <span className={styles.muted}>
                    Inscrito {formatDate(e.enrolledAt, 'short')}
                  </span>
                </header>

                <h2>
                  <Link href={`/cursos/${e.course.slug}`} className={styles.title}>
                    {e.course.title}
                  </Link>
                </h2>

                <dl className={styles.meta}>
                  <div>
                    <dt>Instructor</dt>
                    <dd>{e.course.instructor.name}</dd>
                  </div>
                  {firstSession && lastSession ? (
                    <div>
                      <dt>Calendario</dt>
                      <dd>
                        {formatDate(firstSession.startsAt, 'short')} –{' '}
                        {formatDate(lastSession.endsAt, 'short')}
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>Sede</dt>
                    <dd>
                      {e.course.venueName ?? '—'}
                      {e.course.venueAddress ? `, ${e.course.venueAddress}` : ''}
                    </dd>
                  </div>
                  <div>
                    <dt>Precio</dt>
                    <dd>{formatPrice(e.course.price, e.course.currency)}</dd>
                  </div>
                </dl>

                {e.diploma && e.diploma.status === 'ACTIVE' ? (
                  <div className={styles.diploma}>
                    <div className={styles.diplomaInfo}>
                      <span className={styles.diplomaEyebrow}>Diploma emitido</span>
                      <span className={styles.diplomaCode}>{e.diploma.code}</span>
                      <span className={styles.diplomaIssued}>
                        Emitido el {formatDate(e.diploma.issuedAt, 'short')}
                      </span>
                    </div>
                    <div className={styles.diplomaActions}>
                      {e.diploma.pdfKey ? (
                        <a
                          href={`/api/diplomas/${e.diploma.code}/download`}
                          className={styles.diplomaButton}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver diploma →
                        </a>
                      ) : null}
                      <Link
                        href={`/verify/${e.diploma.code}`}
                        className={styles.diplomaSecondary}
                      >
                        Ver verificación pública
                      </Link>
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
