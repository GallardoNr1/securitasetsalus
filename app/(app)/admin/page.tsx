import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Panel de administración',
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'SUPER_ADMIN') redirect('/');

  const firstName = session.user.name?.split(' ')[0] ?? 'administrador';

  // Resumen rápido de la BD para que el dashboard tenga señal real.
  const [usersCount, coursesPublished, coursesDraft, instructorsCount] = await Promise.all([
    db.user.count(),
    db.course.count({ where: { status: 'PUBLISHED' } }),
    db.course.count({ where: { status: 'DRAFT' } }),
    db.user.count({ where: { role: 'INSTRUCTOR' } }),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Administración</span>
        <h1>Hola, {firstName}</h1>
        <p>
          Panel de administración. Desde aquí gestionas usuarios, cursos, inscripciones, pagos y
          diplomas. La gestión de inscripciones y diplomas se activa en fases siguientes.
        </p>
      </header>

      <section className={styles.stats}>
        <article>
          <p className={styles.statLabel}>Usuarios</p>
          <p className={styles.statValue}>{usersCount}</p>
          <Link href="/admin/usuarios" className={styles.statLink}>
            Gestionar →
          </Link>
        </article>
        <article>
          <p className={styles.statLabel}>Instructores</p>
          <p className={styles.statValue}>{instructorsCount}</p>
          <Link href="/admin/usuarios?role=INSTRUCTOR" className={styles.statLink}>
            Ver →
          </Link>
        </article>
        <article>
          <p className={styles.statLabel}>Cursos publicados</p>
          <p className={styles.statValue}>{coursesPublished}</p>
          <Link href="/admin/cursos?status=PUBLISHED" className={styles.statLink}>
            Ver →
          </Link>
        </article>
        <article>
          <p className={styles.statLabel}>Borradores</p>
          <p className={styles.statValue}>{coursesDraft}</p>
          <Link href="/admin/cursos?status=DRAFT" className={styles.statLink}>
            Ver →
          </Link>
        </article>
      </section>

      <section className={styles.quickActions}>
        <h2>Acciones rápidas</h2>
        <div className={styles.actions}>
          <Link href="/admin/cursos/new" className={styles.actionCard}>
            <h3>Crear curso</h3>
            <p>Nuevo curso con sesiones múltiples, mapeado a Clavero y SENCE.</p>
          </Link>
          <Link href="/admin/usuarios/new" className={styles.actionCard}>
            <h3>Crear usuario</h3>
            <p>Añadir instructor o admin manualmente. Queda pre-verificado.</p>
          </Link>
        </div>
      </section>

      <section className={styles.upcoming}>
        <h2>Próximamente</h2>
        <ul>
          <li>
            <strong>Fase 4:</strong> inscripciones pagadas con Stripe — el alumno se
            inscribirá desde el catálogo público.
          </li>
          <li>
            <strong>Fase 5:</strong> asistencia, evaluación y emisión automática de diplomas.
            Incluye el flujo de evaluaciones cruzadas G19 (OTEC SENCE).
          </li>
          <li>
            <strong>Fase 6:</strong> verificación pública del diploma + integración con
            Clavero.
          </li>
        </ul>
      </section>
    </div>
  );
}
