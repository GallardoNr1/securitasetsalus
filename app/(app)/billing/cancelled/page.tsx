import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import styles from '../billing.module.scss';

export const metadata: Metadata = {
  title: 'Pago cancelado',
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ enrollment_id?: string }>;
};

/**
 * Aterrizaje cuando el alumno cancela el pago en Stripe (botón "Volver").
 *
 * La inscripción queda en `PENDING_PAYMENT` y el cron de cleanup la
 * limpiará pasadas 24 h. Si vuelve antes y reintenta, va a fallar el
 * unique constraint — eso es correcto: ya tiene una pendiente, debe
 * usar la URL del email original o esperar al cleanup.
 *
 * Para mejorar UX podríamos pre-cancelar la enrollment aquí. Por ahora
 * dejamos que el cron lo haga — es más simple y robusto.
 */
export default async function BillingCancelledPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { enrollment_id: enrollmentId } = await searchParams;

  // Si llega con el enrollment_id en query, intentamos resolver el slug
  // del curso para que el botón "Volver al curso" lleve directo.
  let courseSlug: string | null = null;
  if (enrollmentId) {
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        userId: true,
        course: { select: { slug: true } },
      },
    });
    if (enrollment && enrollment.userId === session.user.id) {
      courseSlug = enrollment.course.slug;
    }
  }

  return (
    <div className={styles.successPage}>
      <div className={`${styles.successCard} ${styles.cancelledCard}`}>
        <div className={`${styles.successIcon} ${styles.cancelledIcon}`} aria-hidden>
          <CrossIcon />
        </div>
        <span className={styles.eyebrow}>Pago no completado</span>
        <h1 className={styles.title}>
          No pasa nada.
          <br />
          <span className={styles.titleItalic}>Tu cupo aún no se ha reservado.</span>
        </h1>
        <p className={styles.lead}>
          Cancelaste el pago antes de completarlo, así que no se cargó nada a tu tarjeta. Si
          quieres, puedes volver al curso e intentarlo de nuevo.
        </p>
        <div className={styles.successActions}>
          {courseSlug ? (
            <Button href={{ pathname: `/courses/${courseSlug}` }} variant="primary" size="md">
              Volver al curso
            </Button>
          ) : (
            <Button href="/courses" variant="primary" size="md">
              Ver catálogo
            </Button>
          )}
          <Link href="/dashboard" className={styles.secondaryLink}>
            Ir a mi panel
          </Link>
        </div>
      </div>
    </div>
  );
}

function CrossIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={28}
      height={28}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
