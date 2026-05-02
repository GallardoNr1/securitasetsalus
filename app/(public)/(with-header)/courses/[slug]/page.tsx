import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getPublishedCourseBySlug, listPublishedCourses } from '@/lib/queries/courses';
import {
  CLAVERO_SKILL_LABELS,
  type ClaveroSkillCode,
  formatSkillCode,
  type ClaveroSkillSuffix,
} from '@/lib/clavero-skills';
import { formatDate, formatDateRange, formatPrice } from '@/lib/format';
import { getSubdivisionName } from '@/lib/regions';
import { EnrollPanel } from './EnrollPanel';
import styles from './page.module.scss';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
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

  // El conteo del schema cuenta TODOS los enrollments. Para cupos hay
  // que excluir cancelados: solo activos consumen cupo.
  const activeEnrollments = await db.enrollment.count({
    where: {
      courseId: course.id,
      status: { in: ['PENDING_PAYMENT', 'PENDING_SENCE_APPROVAL', 'CONFIRMED', 'COMPLETED'] },
    },
  });
  const seatsLeft = Math.max(0, course.capacity - activeEnrollments);
  const subdivisionName = getSubdivisionName(course.subdivision);
  const firstSession = course.sessions[0];
  const lastSession = course.sessions[course.sessions.length - 1];
  const claveroLabel = course.claveroSkillCode
    ? formatSkillCode(
        course.claveroSkillCode as ClaveroSkillCode,
        course.claveroSkillSuffix as ClaveroSkillSuffix | null,
      )
    : null;
  const isFull = seatsLeft === 0;

  // Estado del usuario para el EnrollPanel (decide qué CTA mostrar).
  const session = await auth();
  const isLogged = Boolean(session?.user);
  const emailVerified =
    isLogged && session
      ? Boolean(
          (
            await db.user.findUnique({
              where: { id: session.user.id },
              select: { emailVerifiedAt: true },
            })
          )?.emailVerifiedAt,
        )
      : false;
  const isLow = seatsLeft > 0 && seatsLeft <= 3;

  return (
    <main className={styles.page}>
      <div className={styles.heroBg}>
        <div className={styles.layout}>
          {/* ---- Columna principal ---- */}
          <article className={styles.main}>
            <Link href="/courses" className={styles.breadcrumb}>
              ← Catálogo de cursos
            </Link>

            <div className={styles.tagsRow}>
              {course.claveroSkillCode ? (
                <span className={styles.tagBrand}>
                  {course.claveroSkillCode}
                  {course.claveroSkillSuffix
                    ? ` (${course.claveroSkillSuffix})`
                    : ''}
                </span>
              ) : null}
              {course.senceEligible ? (
                <span className={styles.tagAccent}>Franquicia SENCE</span>
              ) : null}
              {claveroLabel ? (
                <span className={styles.tagNeutral}>Aplica a Clavero</span>
              ) : null}
            </div>

            <h1 className={styles.title}>{course.title}</h1>
            <p className={styles.lead}>{course.shortDescription}</p>

            <section className={styles.section}>
              <h2>
                <span className={styles.eyebrow}>Contenido</span>
                Temario completo
              </h2>
              <pre className={styles.markdown}>{course.fullSyllabus}</pre>
            </section>

            {course.includedKit ? (
              <section className={styles.section}>
                <h2>
                  <span className={styles.eyebrow}>Material</span>
                  Kit incluido
                </h2>
                <pre className={styles.markdown}>{course.includedKit}</pre>
              </section>
            ) : null}

            {course.prerequisiteSkillCodes.length > 0 ? (
              <section className={styles.section}>
                <h2>
                  <span className={styles.eyebrow}>Requisitos</span>
                  Prerrequisitos
                </h2>
                <p>
                  Para inscribirte a este curso debes acreditar previamente las
                  siguientes habilidades:
                </p>
                <ul className={styles.prereqList}>
                  {course.prerequisiteSkillCodes.map((code) => (
                    <li key={code}>
                      <span className={styles.prereqCode}>{code}</span>
                      <span>
                        {CLAVERO_SKILL_LABELS[code as ClaveroSkillCode] ?? code}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className={styles.section}>
              <h2>
                <span className={styles.eyebrow}>Calendario</span>
                Sesiones del curso
              </h2>
              <ul className={styles.sessions}>
                {course.sessions.map((session) => (
                  <li key={session.id} className={styles.sessionItem}>
                    <span className={styles.sessionNumber}>
                      Sesión {session.sessionNumber}
                    </span>
                    <span className={styles.sessionDate}>
                      {formatDateRange(session.startsAt, session.endsAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className={styles.section}>
              <h2>
                <span className={styles.eyebrow}>Quien lo imparte</span>
                Tu instructor
              </h2>
              <div className={styles.instructorCard}>
                <Avatar
                  name={course.instructor.name ?? 'Instructor'}
                  userId={course.instructor.id}
                  avatarKey={course.instructor.avatarKey}
                  size="lg"
                />
                <div className={styles.instructorBody}>
                  <h3>{course.instructor.name}</h3>
                  <p>
                    Instructor cualificado de SecuritasEtSalus con experiencia real
                    en taller. Cada cohorte se mantiene pequeña para que tengas
                    atención personalizada.
                  </p>
                </div>
              </div>
            </section>
          </article>

          {/* ---- Sidebar de inscripción (sticky en desktop) ---- */}
          <aside className={styles.sidebar}>
            <div className={styles.card}>
              <div className={styles.cardPriceBlock}>
                <span className={styles.cardPriceLabel}>Inscripción</span>
                <span className={styles.cardPrice}>
                  {formatPrice(course.price, course.currency)}
                </span>
                <span className={styles.cardPriceNote}>
                  Pago único — incluye material y diploma.
                </span>
              </div>

              <dl className={styles.cardMeta}>
                <div>
                  <dt>Duración</dt>
                  <dd>{course.durationHours} horas lectivas</dd>
                </div>
                <div>
                  <dt>Sesiones</dt>
                  <dd>{course.sessions.length}</dd>
                </div>
                {firstSession && lastSession ? (
                  <div>
                    <dt>Fechas</dt>
                    <dd>
                      {formatDate(firstSession.startsAt, 'short')} –{' '}
                      {formatDate(lastSession.endsAt, 'short')}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt>Sede</dt>
                  <dd>
                    {course.venueName ?? 'Por definir'}
                    {subdivisionName ? `, ${subdivisionName}` : ''}
                  </dd>
                </div>
                <div>
                  <dt>Cupos</dt>
                  <dd
                    className={
                      isFull
                        ? styles.seatsFull
                        : isLow
                          ? styles.seatsLow
                          : undefined
                    }
                  >
                    {isFull
                      ? 'Curso lleno'
                      : seatsLeft === 1
                        ? 'Último cupo disponible'
                        : `${seatsLeft} de ${course.capacity} disponibles`}
                  </dd>
                </div>
              </dl>

              <EnrollPanel
                courseSlug={course.slug}
                isLogged={isLogged}
                isFull={isFull}
                emailVerified={emailVerified}
                senceEligible={course.senceEligible}
              />

              <p className={styles.cardNote}>
                Necesitas una cuenta verificada para inscribirte. El pago se procesa
                con Stripe; recibirás confirmación inmediata por correo.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
