import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getCourseForInstructor } from '@/lib/queries/attendance';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { formatDate } from '@/lib/format';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Detalle del curso · Instructor',
  robots: { index: false, follow: false },
};

const STATUS_LABELS = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
} as const;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InstructorCourseDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const { id } = await params;
  const course = await getCourseForInstructor(id, session.user.id, {
    bypassOwnerCheck: session.user.role === 'SUPER_ADMIN',
  });
  if (!course) notFound();

  const totalEnrolled = course._count.enrollments;
  const now = new Date();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/instructor/cursos" className={styles.back}>
          ← Mis cursos
        </Link>
        <div className={styles.titleRow}>
          <Badge
            status={
              course.status === 'PUBLISHED'
                ? 'confirmed'
                : course.status === 'DRAFT'
                  ? 'pending'
                  : course.status === 'CANCELLED'
                    ? 'failed'
                    : 'cancelled'
            }
            showDot={false}
          >
            {STATUS_LABELS[course.status]}
          </Badge>
          {course.senceEligible ? <Tag tone="accent">SENCE</Tag> : null}
        </div>
        <h1>{course.title}</h1>
        <dl className={styles.meta}>
          <div>
            <dt>Inscritos confirmados</dt>
            <dd>
              {totalEnrolled} / {course.capacity}
            </dd>
          </div>
          <div>
            <dt>Sesiones</dt>
            <dd>{course.sessions.length}</dd>
          </div>
          <div>
            <dt>Duración total</dt>
            <dd>{course.durationHours} h</dd>
          </div>
          {course.venueName ? (
            <div>
              <dt>Sede</dt>
              <dd>
                {course.venueName}
                {course.venueAddress ? `, ${course.venueAddress}` : ''}
              </dd>
            </div>
          ) : null}
        </dl>
      </header>

      <section className={styles.sessions}>
        <header className={styles.sectionHeader}>
          <h2>Sesiones</h2>
          <p>
            Pulsa "Pasar lista" en cada sesión para registrar la asistencia. Si una sesión ya
            tiene marcas, puedes editarlas hasta cerrar el curso.
          </p>
        </header>

        {course.sessions.length === 0 ? (
          <div className={styles.empty}>
            <p>Este curso no tiene sesiones programadas.</p>
          </div>
        ) : (
          <ul className={styles.sessionList}>
            {course.sessions.map((s) => {
              const marked = s._count.attendances;
              const isPast = s.endsAt < now;
              const isFuture = s.startsAt > now;
              const noneMarked = marked === 0;
              return (
                <li key={s.id} className={styles.sessionCard}>
                  <div className={styles.sessionMeta}>
                    <span className={styles.sessionNumber}>Sesión {s.sessionNumber}</span>
                    <span className={styles.sessionDate}>
                      {formatDate(s.startsAt, 'short')} ·{' '}
                      {s.startsAt.toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' – '}
                      {s.endsAt.toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {s.location ? (
                      <span className={styles.sessionLocation}>{s.location}</span>
                    ) : null}
                  </div>

                  <div className={styles.sessionStatus}>
                    {totalEnrolled === 0 ? (
                      <Tag tone="neutral">Sin inscritos</Tag>
                    ) : noneMarked ? (
                      isFuture ? (
                        <Tag tone="neutral">Aún no empieza</Tag>
                      ) : (
                        <span className={styles.statusPending}>Pendiente de pasar lista</span>
                      )
                    ) : marked < totalEnrolled ? (
                      <span className={styles.statusPartial}>
                        {marked} / {totalEnrolled} marcados
                      </span>
                    ) : (
                      <Tag tone="brand">
                        Lista completa ({marked}/{totalEnrolled})
                      </Tag>
                    )}
                    {isPast && noneMarked ? (
                      <span className={styles.lateWarning}>Sesión ya finalizada</span>
                    ) : null}
                  </div>

                  <Link
                    href={`/instructor/cursos/${course.id}/sesiones/${s.id}/asistencia`}
                    className={styles.takeAction}
                  >
                    {noneMarked ? 'Pasar lista →' : 'Editar asistencia →'}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {course.hasEvaluation ? (
        <section className={styles.closure}>
          <header className={styles.sectionHeader}>
            <h2>Cierre del curso</h2>
            <p>
              Cuando termines de pasar lista de todas las sesiones, evalúa a cada alumno con
              nota chilena 1.0–7.0 en técnica, conocimientos
              {course.evaluatesAttitude ? ', actitud' : ''} y participación. La nota final
              decide si recibe diploma (Fase 5c).
            </p>
          </header>
          <Link href={`/instructor/cursos/${course.id}/evaluaciones`} className={styles.closureLink}>
            Evaluación final →
          </Link>
        </section>
      ) : null}
    </div>
  );
}
