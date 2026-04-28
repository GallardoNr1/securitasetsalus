import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { getPublishedCourseBySlug, listPublishedCourses } from '@/lib/queries/courses';
import {
  CLAVERO_SKILL_LABELS,
  type ClaveroSkillCode,
  formatSkillCode,
  type ClaveroSkillSuffix,
} from '@/lib/clavero-skills';
import { formatDate, formatDateRange, formatPrice } from '@/lib/format';
import { getSubdivisionName } from '@/lib/regions';
import styles from './page.module.scss';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  // Pre-renderizamos los slugs de cursos publicados al hacer build.
  // Cuando se publica/edita un curso, revalidatePath('/cursos/[slug]') en
  // las actions de admin invalida el cache y se regenera bajo demanda.
  const courses = await listPublishedCourses();
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublishedCourseBySlug(slug);
  if (!course) return { title: 'Curso no encontrado' };
  return {
    title: course.title,
    description: course.shortDescription,
  };
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const course = await getPublishedCourseBySlug(slug);
  if (!course) notFound();

  const seatsLeft = course.capacity - course._count.enrollments;
  const subdivisionName = getSubdivisionName(course.subdivision);
  const firstSession = course.sessions[0];
  const lastSession = course.sessions[course.sessions.length - 1];
  const claveroLabel = course.claveroSkillCode
    ? formatSkillCode(
        course.claveroSkillCode as ClaveroSkillCode,
        course.claveroSkillSuffix as ClaveroSkillSuffix | null,
      )
    : null;

  return (
    <main className={styles.page}>
      <nav aria-label="Migaja de pan" className={styles.breadcrumb}>
        <Link href="/cursos">← Volver al catálogo</Link>
      </nav>

      <div className={styles.layout}>
        <article className={styles.main}>
          <header className={styles.header}>
            <div className={styles.tags}>
              {course.claveroSkillCode ? (
                <Tag tone="brand">
                  {CLAVERO_SKILL_LABELS[course.claveroSkillCode as ClaveroSkillCode]}
                  {course.claveroSkillSuffix ? ` ${course.claveroSkillSuffix}` : ''}
                </Tag>
              ) : null}
              {course.senceEligible ? <Tag tone="accent">Franquicia SENCE</Tag> : null}
              {claveroLabel ? <Tag tone="neutral">Aplica a Clavero</Tag> : null}
            </div>
            <h1>{course.title}</h1>
            <p className={styles.lead}>{course.shortDescription}</p>
          </header>

          <section className={styles.section}>
            <h2>Temario completo</h2>
            <pre className={styles.syllabus}>{course.fullSyllabus}</pre>
          </section>

          {course.includedKit ? (
            <section className={styles.section}>
              <h2>Kit incluido</h2>
              <pre className={styles.syllabus}>{course.includedKit}</pre>
            </section>
          ) : null}

          {course.prerequisiteSkillCodes.length > 0 ? (
            <section className={styles.section}>
              <h2>Prerrequisitos</h2>
              <p>
                Para inscribirte a este curso debes acreditar previamente las siguientes
                habilidades de SES:
              </p>
              <ul className={styles.prereqList}>
                {course.prerequisiteSkillCodes.map((code) => (
                  <li key={code}>
                    {CLAVERO_SKILL_LABELS[code as ClaveroSkillCode] ?? code}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className={styles.section}>
            <h2>Calendario de sesiones</h2>
            <ul className={styles.sessions}>
              {course.sessions.map((session) => (
                <li key={session.id}>
                  <span className={styles.sessionNumber}>Sesión {session.sessionNumber}</span>
                  <span className={styles.sessionDate}>
                    {formatDateRange(session.startsAt, session.endsAt)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.section}>
            <h2>Tu instructor</h2>
            <div className={styles.instructor}>
              <h3>{course.instructor.name}</h3>
              <p className={styles.instructorBio}>
                Instructor cualificado de SecuritasEtSalus.
              </p>
            </div>
          </section>
        </article>

        <aside className={styles.sidebar}>
          <div className={styles.card}>
            <p className={styles.price}>{formatPrice(course.price, course.currency)}</p>
            <p className={styles.priceSubtext}>Pago único — incluye material y diploma.</p>

            <ul className={styles.cardMeta}>
              <li>
                <span className={styles.cardMetaLabel}>Duración</span>
                <span>{course.durationHours} horas lectivas</span>
              </li>
              <li>
                <span className={styles.cardMetaLabel}>Sesiones</span>
                <span>{course.sessions.length}</span>
              </li>
              {firstSession && lastSession ? (
                <li>
                  <span className={styles.cardMetaLabel}>Fechas</span>
                  <span>
                    {formatDate(firstSession.startsAt, 'short')} –{' '}
                    {formatDate(lastSession.endsAt, 'short')}
                  </span>
                </li>
              ) : null}
              <li>
                <span className={styles.cardMetaLabel}>Sede</span>
                <span>
                  {course.venueName ?? 'Por definir'}
                  {subdivisionName ? `, ${subdivisionName}` : ''}
                </span>
              </li>
              <li>
                <span className={styles.cardMetaLabel}>Cupos</span>
                <span
                  className={
                    seatsLeft === 0
                      ? styles.seatsFull
                      : seatsLeft <= 3
                        ? styles.seatsLow
                        : undefined
                  }
                >
                  {seatsLeft === 0
                    ? 'Curso lleno'
                    : seatsLeft === 1
                      ? 'Último cupo disponible'
                      : `${seatsLeft} de ${course.capacity} disponibles`}
                </span>
              </li>
            </ul>

            {seatsLeft > 0 ? (
              <Button href="/login" variant="primary" size="lg" fullWidth>
                Inscribirme y pagar
              </Button>
            ) : (
              <Button variant="secondary" size="lg" fullWidth disabled>
                Curso lleno
              </Button>
            )}

            <p className={styles.cardNote}>
              Necesitas una cuenta verificada para inscribirte. El pago se procesa con Stripe;
              recibirás confirmación inmediata por correo.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
