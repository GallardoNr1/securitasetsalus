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
      <header className={styles.header}>
        <span className={styles.eyebrow}>Catálogo</span>
        <h1>Cursos disponibles</h1>
        <p>
          Cursos presenciales con cupos limitados. Inscríbete pagando directamente desde la web,
          recibe confirmación inmediata y descarga tu diploma al finalizar.
        </p>
      </header>

      {courses.length === 0 ? (
        <div className={styles.empty}>
          <h2>Aún no hay cursos publicados</h2>
          <p>
            Estamos preparando los próximos cursos. Vuelve pronto o escríbenos a{' '}
            <a href="mailto:contacto@ses.agsint.cl">contacto@ses.agsint.cl</a> si quieres que
            te avisemos cuando abramos inscripciones.
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
    </main>
  );
}
