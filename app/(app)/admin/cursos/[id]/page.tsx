import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getCourseById } from '@/lib/queries/courses';
import { listInstructors } from '@/lib/queries/users';
import { Badge } from '@/components/ui/Badge';
import { Tag } from '@/components/ui/Tag';
import {
  CLAVERO_SKILL_LABELS,
  type ClaveroSkillCode,
  type ClaveroSkillSuffix,
} from '@/lib/clavero-skills';
import { SUPPORTED_REGIONS, type SupportedRegion } from '@/lib/regions';
import { formatDate, formatDateRange, formatPrice } from '@/lib/format';
import { CourseForm } from '../CourseForm';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Editar curso · Admin',
  robots: { index: false, follow: false },
};

const STATUS_LABELS = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
} as const;

type Props = {
  params: Promise<{ id: string }>;
};

function toLocalDateTimeInput(date: Date): string {
  // Format YYYY-MM-DDTHH:MM (sin segundos) para inputs datetime-local.
  // Mantenemos hora local del servidor — es UTC por convenio de Vercel.
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
  );
}

export default async function EditCoursePage({ params }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const { id } = await params;
  const course = await getCourseById(id);
  if (!course) notFound();

  const instructors = await listInstructors();

  const region: SupportedRegion =
    course.region && (SUPPORTED_REGIONS as readonly string[]).includes(course.region)
      ? (course.region as SupportedRegion)
      : 'CL';

  const hasPaidEnrollments = course._count.enrollments > 0;

  return (
    <div className={styles.page}>
      <Link href="/admin/cursos" className={styles.back}>
        ← Volver al listado
      </Link>

      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Curso</span>
          <h1>{course.title}</h1>
          <p className={styles.slug}>/cursos/{course.slug}</p>
          <div className={styles.metaRow}>
            <Badge
              status={
                course.status === 'PUBLISHED'
                  ? 'confirmed'
                  : course.status === 'DRAFT'
                    ? 'pending'
                    : course.status === 'CANCELLED'
                      ? 'failed'
                      : 'cancelled'
              }
              showDot={false}
            >
              {STATUS_LABELS[course.status]}
            </Badge>
            {course.senceEligible ? <Tag tone="accent">SENCE</Tag> : null}
            {course.claveroSkillCode ? (
              <Tag tone="brand">
                {CLAVERO_SKILL_LABELS[course.claveroSkillCode as ClaveroSkillCode]}
                {course.claveroSkillSuffix ? ` ${course.claveroSkillSuffix as ClaveroSkillSuffix}` : ''}
              </Tag>
            ) : null}
            <span className={styles.muted}>
              · Creado {formatDate(course.createdAt, 'short')}
            </span>
          </div>
        </div>
      </header>

      {/* Resumen rápido */}
      <section className={styles.summary}>
        <article>
          <p className={styles.summaryLabel}>Inscripciones</p>
          <p className={styles.summaryValue}>
            {course._count.enrollments} / {course.capacity}
          </p>
        </article>
        <article>
          <p className={styles.summaryLabel}>Sesiones</p>
          <p className={styles.summaryValue}>{course.sessions.length}</p>
        </article>
        <article>
          <p className={styles.summaryLabel}>Duración</p>
          <p className={styles.summaryValue}>{course.durationHours} h</p>
        </article>
        <article>
          <p className={styles.summaryLabel}>Precio</p>
          <p className={styles.summaryValue}>{formatPrice(course.price, course.currency)}</p>
        </article>
      </section>

      {course.sessions.length > 0 ? (
        <section className={styles.sessions}>
          <h2>Calendario</h2>
          <ul>
            {course.sessions.map((s) => (
              <li key={s.id}>
                <span className={styles.sessionLabel}>Sesión {s.sessionNumber}</span>
                <span>{formatDateRange(s.startsAt, s.endsAt)}</span>
                {s.location ? <span className={styles.sessionLoc}>{s.location}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.formSection}>
        <h2>Editar curso</h2>
        <CourseForm
          mode="edit"
          courseId={course.id}
          instructors={instructors}
          locked={hasPaidEnrollments}
          initial={{
            title: course.title,
            slug: course.slug,
            shortDescription: course.shortDescription,
            fullSyllabus: course.fullSyllabus,
            durationHours: course.durationHours,
            price: course.price,
            currency: course.currency,
            capacity: course.capacity,
            region,
            subdivision: course.subdivision,
            venueName: course.venueName,
            venueAddress: course.venueAddress,
            status: course.status,
            hasEvaluation: course.hasEvaluation,
            senceEligible: course.senceEligible,
            claveroSkillCode: course.claveroSkillCode as ClaveroSkillCode | null,
            claveroSkillSuffix: course.claveroSkillSuffix,
            prerequisiteSkillCodes: course.prerequisiteSkillCodes,
            includedKit: course.includedKit,
            instructorId: course.instructorId,
            sessions: course.sessions.map((s) => ({
              id: s.id,
              startsAt: toLocalDateTimeInput(s.startsAt),
              endsAt: toLocalDateTimeInput(s.endsAt),
              location: s.location ?? '',
            })),
          }}
        />
      </section>
    </div>
  );
}
