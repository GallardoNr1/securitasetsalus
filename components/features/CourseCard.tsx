import Link from 'next/link';
import type { MockCourse } from '@/lib/mock/courses';
import { COURSE_CATEGORIES } from '@/lib/mock/courses';
import { formatPrice, formatDate } from '@/lib/format';
import { getSubdivisionName } from '@/lib/regions';
import { Card } from '@/components/ui/Card';
import { Tag } from '@/components/ui/Tag';
import styles from './CourseCard.module.scss';

type Props = {
  course: MockCourse;
};

export function CourseCard({ course }: Props) {
  const firstSession = course.sessions[0];
  const seatsLeft = course.capacity - course.enrolledCount;
  const subdivisionName = getSubdivisionName(course.subdivision);

  return (
    <Card variant="elevated" interactive className={styles.card}>
      <Link href={`/cursos/${course.slug}`} className={styles.link}>
        <div className={styles.header}>
          <Tag tone="brand">{COURSE_CATEGORIES[course.category]}</Tag>
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
              {course.venueName}
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
