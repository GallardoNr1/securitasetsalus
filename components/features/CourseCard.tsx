import Link from 'next/link';
import { formatPrice, formatDate } from '@/lib/format';
import { getSubdivisionName } from '@/lib/regions';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
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

  return (
    <Card variant="elevated" interactive className={styles.card}>
      <Link href={`/cursos/${course.slug}`} className={styles.link}>
        <div className={styles.header}>
          {course.claveroSkillCode ? (
            <Tag tone="brand">{course.claveroSkillCode}</Tag>
          ) : null}
          {course.senceEligible ? <Tag tone="accent">Franquicia SENCE</Tag> : null}
        </div>

        <h3 className={styles.title}>{course.title}</h3>
        <p className={styles.description}>{course.shortDescription}</p>

        <ul className={styles.meta}>
          <li>
            <span className={styles.metaLabel}>Duración</span>
            <span>{course.durationHours} horas</span>
          </li>
          <li>
            <span className={styles.metaLabel}>Sede</span>
            <span>
              {course.venueName ?? 'Por definir'}
              {subdivisionName ? `, ${subdivisionName}` : ''}
            </span>
          </li>
          {firstSession ? (
            <li>
              <span className={styles.metaLabel}>Inicio</span>
              <span>{formatDate(firstSession.startsAt, 'long')}</span>
            </li>
          ) : null}
        </ul>

        <div className={styles.footer}>
          <span className={styles.price}>{formatPrice(course.price, course.currency)}</span>
          <span
            className={[
              styles.seats,
              seatsLeft === 0 ? styles.seatsFull : seatsLeft <= 3 ? styles.seatsLow : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {seatsLeft === 0
              ? 'Curso lleno'
              : seatsLeft === 1
                ? 'Último cupo'
                : `${seatsLeft} cupos disponibles`}
          </span>
        </div>
      </Link>
    </Card>
  );
}
