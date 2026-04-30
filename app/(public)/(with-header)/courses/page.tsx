import type { Metadata } from 'next';
import Link from 'next/link';
import { CourseCard } from '@/components/features/CourseCard';
import { listPublishedCourses } from '@/lib/queries/courses';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Catálogo de cursos',
  description:
    'Cursos presenciales de cerrajería, control de accesos y seguridad física. Inscríbete y obtén tu diploma verificable.',
};

export default async function CoursesPage() {
  const courses = await listPublishedCourses();

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Catálogo</span>
          <h1 className={styles.title}>
            Cursos<br />
            <span className={styles.titleItalic}>presenciales.</span>
          </h1>
          <p className={styles.lead}>
            Cohortes pequeñas, instructores con experiencia real, diplomas
            verificables. Inscríbete directamente desde la web.
          </p>

          {courses.length > 0 ? (
            <div className={styles.metaRow}>
              <span className={styles.metaPill}>
                <span className={styles.metaDot} aria-hidden />
                {courses.length}{' '}
                {courses.length === 1 ? 'curso disponible' : 'cursos disponibles'}
              </span>
            </div>
          ) : null}
        </div>
      </section>

      <section className={styles.list}>
        <div className={styles.listInner}>
          {courses.length === 0 ? (
            <div className={styles.empty}>
              <h2>Aún no hay cursos publicados</h2>
              <p>
                Estamos preparando los próximos cursos. Vuelve pronto o escríbenos a{' '}
                <a href="mailto:dev@securitasetsalus.cl">dev@securitasetsalus.cl</a> si
                quieres que te avisemos cuando abramos inscripciones.
              </p>
              <Link href="/" className={styles.emptyLink}>
                Volver al inicio
              </Link>
            </div>
          ) : (
            <ul className={styles.grid}>
              {courses.map((course) => (
                <li key={course.id}>
                  <CourseCard course={course} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
