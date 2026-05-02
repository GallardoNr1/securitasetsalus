import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listEnrollmentsByStudent } from '@/lib/queries/courses';
import { Button } from '@/components/ui/Button';
import { formatDate, formatPrice } from '@/lib/format';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Mis cursos',
  robots: { index: false, follow: false },
};

type EnrollmentStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'PENDING_EVALUATION'
  | 'COMPLETED'
  | 'FAILED';

type StatusVariant = 'brand' | 'pending' | 'cancelled' | 'failed' | 'completed';

const STATUS_META: Record<EnrollmentStatus, { label: string; variant: StatusVariant; tagline: string }> = {
  PENDING_PAYMENT: {
    label: 'Pago pendiente',
    variant: 'pending',
    tagline: 'Tu inscripción se confirmará al recibir el pago',
  },
  CONFIRMED: {
    label: 'Inscrito',
    variant: 'brand',
    tagline: 'Tu plaza está reservada',
  },
  CANCELLED: {
    label: 'Cancelado',
    variant: 'cancelled',
    tagline: 'Esta inscripción se canceló',
  },
  PENDING_EVALUATION: {
    label: 'Evaluación pendiente',
    variant: 'pending',
    tagline: 'Falta completar la evaluación cruzada',
  },
  COMPLETED: {
    label: 'Completado',
    variant: 'completed',
    tagline: 'Has completado satisfactoriamente este curso',
  },
  FAILED: {
    label: 'No aprobado',
    variant: 'failed',
    tagline: 'No se cumplieron los requisitos de aprobación',
  },
};

export default async function MyCoursesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'STUDENT' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const enrollments = await listEnrollmentsByStudent(session.user.id);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Tus inscripciones</span>
        <h1 className={styles.title}>
          Mis <span className={styles.titleItalic}>cursos.</span>
        </h1>
        <p className={styles.lead}>
          Cursos en los que te has inscrito. Consulta su estado, descarga tu diploma cuando se
          emita y vuelve al detalle del curso para revisar fechas y sede.
        </p>
        <div className={styles.metaRow}>
          <span className={styles.metaPill}>
            <span className={styles.metaDot} aria-hidden />
            {enrollments.length === 0
              ? 'Sin inscripciones todavía'
              : `${enrollments.length} ${
                  enrollments.length === 1 ? 'inscripción activa' : 'inscripciones activas'
                }`}
          </span>
        </div>
      </header>

      {enrollments.length === 0 ? (
        <div className={styles.empty}>
          <h2>Aún no tienes cursos</h2>
          <p>
            Explora el catálogo para ver los próximos cursos disponibles, sus fechas y la sede
            en la que se imparten.
          </p>
          <Button href="/courses" variant="primary" size="md">
            Ver catálogo
          </Button>
        </div>
      ) : (
        <ul className={styles.list}>
          {enrollments.map((e) => {
            const status = e.status as EnrollmentStatus;
            const meta = STATUS_META[status];
            const firstSession = e.course.sessions[0];
            const lastSession = e.course.sessions[e.course.sessions.length - 1];
            // Narrow `diploma` con un const así TypeScript lo trata como
            // non-null dentro del bloque condicional — sin `!` colgando.
            const diploma =
              e.diploma && e.diploma.status === 'ACTIVE' ? e.diploma : null;

            return (
              <li key={e.id} className={styles.item}>
                <div className={styles.itemHeader}>
                  <span className={`${styles.statusPill} ${styles[`pill-${meta.variant}`]}`}>
                    <span
                      className={`${styles.statusDot} ${styles[`dot-${meta.variant}`]}`}
                      aria-hidden
                    />
                    <span className={styles.statusText}>{meta.tagline}</span>
                    <span
                      className={`${styles.statusBadge} ${styles[`badge-${meta.variant}`]}`}
                    >
                      {meta.label.toUpperCase()}
                    </span>
                  </span>
                  <span className={styles.muted}>
                    Inscrito el {formatDate(e.enrolledAt, 'short')}
                  </span>
                </div>

                <Link href={`/courses/${e.course.slug}`} className={styles.titleLink}>
                  <h2 className={styles.itemTitle}>{e.course.title}</h2>
                </Link>

                <dl className={styles.meta}>
                  <div className={styles.field}>
                    <dt>Instructor</dt>
                    <dd>{e.course.instructor.name}</dd>
                  </div>
                  {firstSession && lastSession ? (
                    <div className={styles.field}>
                      <dt>Calendario</dt>
                      <dd>
                        {formatDate(firstSession.startsAt, 'short')} –{' '}
                        {formatDate(lastSession.endsAt, 'short')}
                      </dd>
                    </div>
                  ) : null}
                  <div className={styles.field}>
                    <dt>Sede</dt>
                    <dd>
                      {e.course.venueName ?? '—'}
                      {e.course.venueAddress ? `, ${e.course.venueAddress}` : ''}
                    </dd>
                  </div>
                  <div className={styles.field}>
                    <dt>Precio</dt>
                    <dd>{formatPrice(e.course.price, e.course.currency)}</dd>
                  </div>
                </dl>

                {diploma ? (
                  <div className={styles.diploma}>
                    <div className={styles.diplomaInfo}>
                      <span className={styles.diplomaEyebrow}>Diploma emitido</span>
                      <span className={styles.diplomaCode}>{diploma.code}</span>
                      <span className={styles.diplomaIssued}>
                        Emitido el {formatDate(diploma.issuedAt, 'short')}
                      </span>
                    </div>
                    <div className={styles.diplomaActions}>
                      {diploma.pdfKey ? (
                        <a
                          href={`/api/diplomas/${diploma.code}/download`}
                          className={styles.diplomaButton}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ver diploma →
                        </a>
                      ) : null}
                      <Link
                        href={`/verify/${diploma.code}`}
                        className={styles.diplomaSecondary}
                      >
                        Verificación pública
                      </Link>
                    </div>
                  </div>
                ) : null}

                <div className={styles.itemFooter}>
                  <Link href={`/courses/${e.course.slug}`} className={styles.detailLink}>
                    Ver detalle del curso →
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
