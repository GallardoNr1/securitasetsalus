import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listInstructors } from '@/lib/queries/users';
import { CourseForm } from '../CourseForm';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Crear curso · Admin',
  robots: { index: false, follow: false },
};

export default async function NewCoursePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const instructors = await listInstructors();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/admin/cursos" className={styles.back}>
          ← Volver al listado
        </Link>
        <span className={styles.eyebrow}>Administración</span>
        <h1>Crear curso</h1>
        <p>
          Completa los datos del curso y añade al menos una sesión. Empieza en estado
          borrador — luego cambias a publicado cuando esté listo para abrir inscripciones.
        </p>
      </header>

      <CourseForm
        mode="create"
        instructors={instructors}
        initial={{
          title: '',
          slug: '',
          shortDescription: '',
          fullSyllabus: '',
          durationHours: 8,
          price: 0,
          currency: 'CLP',
          capacity: 12,
          region: 'CL',
          subdivision: null,
          venueName: null,
          venueAddress: null,
          status: 'DRAFT',
          hasEvaluation: true,
          senceEligible: true,
          claveroSkillCode: null,
          claveroSkillSuffix: null,
          prerequisiteSkillCodes: [],
          includedKit: null,
          instructorId: '',
          sessions: [],
        }}
      />
    </div>
  );
}
