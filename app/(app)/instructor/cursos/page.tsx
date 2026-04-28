import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listCoursesByInstructor } from '@/lib/queries/courses';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import { formatDate, formatPrice } from '@/lib/format';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Mis cursos · Instructor',
  robots: { index: false, follow: false },
};

const STATUS_LABELS = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
} as const;

export default async function InstructorCoursesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const courses = await listCoursesByInstructor(session.user.id);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Instructor</span>
        <h1>Mis cursos asignados</h1>
        <p>
          Cursos que tienes que impartir. En la fase 5 podrás marcar asistencia por sesión y
          registrar evaluaciones desde aquí.
        </p>
      </header>

      {courses.length === 0 ? (
        <div className={styles.empty}>
          <h2>Sin cursos asignados</h2>
          <p>
            Aún no tienes cursos a tu cargo. Cuando el administrador te asigne uno, aparecerá
            aquí con sus fechas, sede y alumnos inscritos.
          </p>
        </div>
      ) : (
        <ul className={styles.grid}>
          {courses.map((c) => {
            const firstSession = c.sessions[0];
            const lastSession = c.sessions[c.sessions.length - 1];
            return (
              <li key={c.id} className={styles.card}>
                <header className={styles.cardHeader}>
                  <Badge
                    status={
                      c.status === 'PUBLISHED'
                        ? 'confirmed'
                        : c.status === 'DRAFT'
                          ? 'pending'
                          : c.status === 'CANCELLED'
                            ? 'failed'
                            : 'cancelled'
                    }
                    showDot={false}
                  >
                    {STATUS_LABELS[c.status]}
                  </Badge>
                  {c.senceEligible ? <Tag tone="accent">SENCE</Tag> : null}
                </header>

                <h2>{c.title}</h2>

                <dl className={styles.meta}>
                  <div>
                    <dt>Sesiones</dt>
                    <dd>{c.sessions.length}</dd>
                  </div>
                  <div>
                    <dt>Inscritos</dt>
                    <dd>
                      {c._count.enrollments} / {c.capacity}
                    </dd>
                  </div>
                  <div>
                    <dt>Duración</dt>
                    <dd>{c.durationHours} h</dd>
                  </div>
                  <div>
                    <dt>Precio</dt>
                    <dd>{formatPrice(c.price, c.currency)}</dd>
                  </div>
                </dl>

                {firstSession && lastSession ? (
                  <p className={styles.dates}>
                    <strong>Calendario:</strong> {formatDate(firstSession.startsAt, 'short')} –{' '}
                    {formatDate(lastSession.endsAt, 'short')}
                  </p>
                ) : null}

                {c.venueName ? (
                  <p className={styles.venue}>
                    <strong>Sede:</strong> {c.venueName}
                    {c.venueAddress ? `, ${c.venueAddress}` : ''}
                  </p>
                ) : null}

                <p className={styles.future}>
                  La gestión de asistencia y evaluación se activa en la fase 5. Mientras tanto
                  puedes ver los datos del curso aquí.
                </p>

                {session.user.role === 'SUPER_ADMIN' ? (
                  <Link href={`/admin/cursos/${c.id}`} className={styles.adminLink}>
                    Editar como admin →
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
