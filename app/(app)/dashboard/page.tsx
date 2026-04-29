import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listEnrollmentsByStudent } from '@/lib/queries/courses';
import { Button } from '@/components/ui/Button';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Mi panel',
  robots: { index: false, follow: false },
};

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const firstName = session.user.name?.split(' ')[0] ?? 'alumno';
  const enrollments = await listEnrollmentsByStudent(session.user.id);
  const activeDiplomas = enrollments.filter(
    (e) => e.diploma && e.diploma.status === 'ACTIVE',
  ).length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Tu panel</span>
        <h1>Hola, {firstName}</h1>
        <p>
          Bienvenido a SecuritasEtSalus. Desde aquí ves tus cursos, descargas tus diplomas y
          gestionas tu perfil.
        </p>
      </header>

      <section className={styles.cards}>
        <article className={styles.card}>
          <h2>Mis cursos</h2>
          <p>
            {enrollments.length === 0
              ? 'Aún no tienes inscripciones. Explora el catálogo para ver los próximos cursos disponibles.'
              : `Tienes ${enrollments.length} ${enrollments.length === 1 ? 'inscripción' : 'inscripciones'}.`}
          </p>
          <div className={styles.actions}>
            {enrollments.length > 0 ? (
              <Button href="/mis-cursos" variant="primary" size="md">
                Ver mis cursos
              </Button>
            ) : (
              <Button href="/cursos" variant="primary" size="md">
                Ver catálogo
              </Button>
            )}
          </div>
        </article>

        <article className={styles.card}>
          <h2>Mis diplomas</h2>
          <p>
            {activeDiplomas === 0
              ? 'Aún no tienes diplomas emitidos. Cuando completes un curso, aparecerá aquí con su código público y enlace de descarga.'
              : `Tienes ${activeDiplomas} ${activeDiplomas === 1 ? 'diploma emitido' : 'diplomas emitidos'} con código de verificación pública.`}
          </p>
          <div className={styles.actions}>
            {activeDiplomas > 0 ? (
              <Button href="/mis-cursos" variant="primary" size="md">
                Ver mis diplomas
              </Button>
            ) : (
              <span className={styles.muted}>Sin diplomas aún</span>
            )}
          </div>
        </article>

        <article className={styles.card}>
          <h2>Mi perfil</h2>
          <p>
            Gestiona tus datos personales, foto de perfil y contraseña. Si vas a aplicar
            franquicia SENCE en tu próxima inscripción, asegúrate de tener tu RUT registrado.
          </p>
          <Button href="/profile" variant="secondary" size="md">
            Editar perfil
          </Button>
        </article>
      </section>
    </div>
  );
}
