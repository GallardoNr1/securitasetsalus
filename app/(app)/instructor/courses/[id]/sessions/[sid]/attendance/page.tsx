import type { Metadata, Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSessionForAttendance } from '@/lib/queries/attendance';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { formatDate } from '@/lib/format';
import { RollCallForm } from './RollCallForm';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Pasar lista · Instructor',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string; sid: string }>;
};

export default async function AttendancePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const { id, sid } = await params;
  const data = await getSessionForAttendance(sid, session.user.id, {
    bypassOwnerCheck: session.user.role === 'SUPER_ADMIN',
  });
  if (!data || data.session.courseId !== id) notFound();

  const { session: courseSession, roster } = data;
  const startTime = courseSession.startsAt.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTime = courseSession.endsAt.toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const initialRoster = roster.map((r) => ({
    enrollmentId: r.enrollmentId,
    userId: r.user.id,
    name: r.user.name ?? r.user.email,
    avatarKey: r.user.avatarKey,
    attended: r.attendance?.attended ?? false,
    previouslyMarked: r.attendance !== null,
  }));

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Panel instructor', href: '/instructor' },
          { label: 'Mis cursos', href: '/instructor/courses' },
          { label: courseSession.course.title, href: `/instructor/courses/${id}` as Route },
          { label: `Sesión ${courseSession.sessionNumber} — pasar lista` },
        ]}
      />
      <header className={styles.header}>
        <h1>Pasar lista — Sesión {courseSession.sessionNumber}</h1>
        <p className={styles.dateLine}>
          {formatDate(courseSession.startsAt, 'long')} · {startTime} – {endTime}
          {courseSession.location ? ` · ${courseSession.location}` : ''}
        </p>
      </header>

      {initialRoster.length === 0 ? (
        <div className={styles.empty}>
          <h2>Sin alumnos inscritos</h2>
          <p>
            Este curso aún no tiene alumnos pagados. La asistencia se podrá pasar cuando haya
            inscripciones confirmadas (status CONFIRMED o COMPLETED).
          </p>
        </div>
      ) : (
        <RollCallForm
          sessionId={courseSession.id}
          courseId={id}
          initialRoster={initialRoster}
        />
      )}
    </div>
  );
}
