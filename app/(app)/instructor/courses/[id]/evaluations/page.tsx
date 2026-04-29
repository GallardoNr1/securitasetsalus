import type { Metadata, Route } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getCourseForEvaluation } from '@/lib/queries/evaluation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { EvaluationForm } from './EvaluationForm';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Evaluación final · Instructor',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EvaluationsPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const { id } = await params;
  const data = await getCourseForEvaluation(id, session.user.id, {
    bypassOwnerCheck: session.user.role === 'SUPER_ADMIN',
  });
  if (!data) notFound();

  const { course, roster, totalSessions } = data;

  const breadcrumbs = (
    <Breadcrumbs
      items={[
        { label: 'Panel instructor', href: '/instructor' },
        { label: 'Mis cursos', href: '/instructor/courses' },
        { label: course.title, href: `/instructor/courses/${id}` as Route },
        { label: 'Evaluación final' },
      ]}
    />
  );

  if (!course.hasEvaluation) {
    return (
      <div className={styles.page}>
        {breadcrumbs}
        <header className={styles.header}>
          <h1>Sin evaluación final</h1>
        </header>
        <div className={styles.empty}>
          <p>
            Este curso está marcado con <code>hasEvaluation = false</code>. No requiere
            evaluación final del instructor — el alumno aprueba con cumplir la asistencia
            mínima.
          </p>
        </div>
      </div>
    );
  }

  const initialEntries = roster.map((r) => ({
    enrollmentId: r.enrollmentId,
    userId: r.user.id,
    name: r.user.name ?? r.user.email,
    avatarKey: r.user.avatarKey,
    attendedSessions: r.attendedSessions,
    attendanceRatio: r.attendanceRatio,
    technicalScore: r.evaluation?.technicalScore ?? null,
    knowledgeScore: r.evaluation?.knowledgeScore ?? null,
    attitudeScore: r.evaluation?.attitudeScore ?? null,
    participationScore: r.evaluation?.participationScore ?? null,
    notes: r.evaluation?.notes ?? '',
    previousFinalGrade: r.evaluation?.finalGrade ?? null,
    previousPassed: r.evaluation?.passed ?? null,
  }));

  return (
    <div className={styles.page}>
      {breadcrumbs}
      <header className={styles.header}>
        <h1>Evaluación final</h1>
        <p className={styles.lead}>
          Notación chilena 1.0–7.0 con 4.0 como nota mínima de aprobación. Para aprobar el
          curso el alumno necesita además ≥75% de asistencia (
          {Math.ceil(totalSessions * 0.75)} de {totalSessions} sesiones).
          {!course.evaluatesAttitude
            ? ' La dimensión de actitud está desactivada para este curso.'
            : ''}
        </p>
      </header>

      {initialEntries.length === 0 ? (
        <div className={styles.empty}>
          <p>
            No hay alumnos en este curso. La evaluación se podrá pasar cuando haya
            inscripciones confirmadas.
          </p>
        </div>
      ) : (
        <EvaluationForm
          courseId={id}
          evaluatesAttitude={course.evaluatesAttitude}
          passingGrade={course.evaluationPassingGrade}
          initialEntries={initialEntries}
        />
      )}
    </div>
  );
}
