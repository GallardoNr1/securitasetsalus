import Link from 'next/link';
import { formatPrice, formatDate } from '@/lib/format';
import { getSubdivisionName } from '@/lib/regions';
import styles from './CourseCard.module.scss';

/**
 * Datos mínimos del curso necesarios para renderizar la card.
 * Se construye desde la query `listPublishedCourses` (lib/queries/courses.ts).
 */
type CourseCardData = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  durationHours: number;
  price: number;
  currency: string;
  capacity: number;
  senceEligible: boolean;
  claveroSkillCode: string | null;
  subdivision: string | null;
  venueName: string | null;
  sessions: { startsAt: Date }[];
  _count: { enrollments: number };
};

type Props = {
  course: CourseCardData;
};

export function CourseCard({ course }: Props) {
  const firstSession = course.sessions[0];
  const seatsLeft = course.capacity - course._count.enrollments;
  const subdivisionName = getSubdivisionName(course.subdivision);
  const isFull = seatsLeft === 0;
  const isLow = seatsLeft > 0 && seatsLeft <= 3;

  return (
    <Link href={`/courses/${course.slug}`} className={styles.card}>
      {/* Tags arriba */}
      <div className={styles.tagsRow}>
        {course.claveroSkillCode ? (
          <span className={styles.tagBrand}>{course.claveroSkillCode}</span>
        ) : null}
        {course.senceEligible ? (
          <span className={styles.tagAccent}>Franquicia SENCE</span>
        ) : null}
      </div>

      <h3 className={styles.title}>{course.title}</h3>
      <p className={styles.description}>{course.shortDescription}</p>

      <dl className={styles.meta}>
        <div>
          <dt>Duración</dt>
          <dd>{course.durationHours} h lectivas</dd>
        </div>
        <div>
          <dt>Sede</dt>
          <dd>
            {course.venueName ?? 'Por definir'}
            {subdivisionName ? `, ${subdivisionName}` : ''}
          </dd>
        </div>
        {firstSession ? (
          <div>
            <dt>Inicio</dt>
            <dd>{formatDate(firstSession.startsAt, 'long')}</dd>
          </div>
        ) : null}
      </dl>

      <div className={styles.footer}>
        <div className={styles.priceBlock}>
          <span className={styles.priceLabel}>Inscripción</span>
          <span className={styles.price}>
            {formatPrice(course.price, course.currency)}
          </span>
        </div>
        <span
          className={
            isFull
              ? `${styles.seats} ${styles.seatsFull}`
              : isLow
                ? `${styles.seats} ${styles.seatsLow}`
                : styles.seats
          }
        >
          {isFull
            ? 'Curso lleno'
            : seatsLeft === 1
              ? 'Último cupo'
              : `${seatsLeft} cupos disponibles`}
        </span>
      </div>

      <span className={styles.cta} aria-hidden>
        Ver detalle
        <svg
          viewBox="0 0 24 24"
          width={14}
          height={14}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}
