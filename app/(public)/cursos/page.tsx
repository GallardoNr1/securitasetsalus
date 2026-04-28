import type { Metadata } from 'next';
import Link from 'next/link';
import { CourseCard } from '@/components/features/CourseCard';
import { COURSE_CATEGORIES, getPublishedCourses, type MockCourse } from '@/lib/mock/courses';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Catálogo de cursos',
  description:
    'Cursos presenciales de cerrajería, control de accesos y seguridad física. Inscríbete y obtén tu diploma verificable.',
};

type SearchParams = {
  categoria?: string;
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const selectedCategory = isValidCategory(params.categoria) ? params.categoria : undefined;
  const courses = getPublishedCourses(
    selectedCategory ? { category: selectedCategory } : undefined,
  );

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

      <nav className={styles.filters} aria-label="Filtros de categoría">
        <Link
          href="/cursos"
          className={[styles.filter, !selectedCategory ? styles.filterActive : '']
            .filter(Boolean)
            .join(' ')}
        >
          Todas
        </Link>
        {(Object.keys(COURSE_CATEGORIES) as MockCourse['category'][]).map((cat) => (
          <Link
            key={cat}
            href={`/cursos?categoria=${cat}`}
            className={[styles.filter, selectedCategory === cat ? styles.filterActive : '']
              .filter(Boolean)
              .join(' ')}
          >
            {COURSE_CATEGORIES[cat]}
          </Link>
        ))}
      </nav>

      {courses.length === 0 ? (
        <div className={styles.empty}>
          <h2>No hay cursos en esta categoría</h2>
          <p>
            Por ahora no tenemos cursos abiertos en{' '}
            <strong>{COURSE_CATEGORIES[selectedCategory!]}</strong>. Vuelve pronto o consulta
            las otras categorías.
          </p>
          <Link href="/cursos" className={styles.emptyLink}>
            Ver todas las categorías
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

function isValidCategory(value: string | undefined): value is MockCourse['category'] {
  if (!value) return false;
  return value in COURSE_CATEGORIES;
}
