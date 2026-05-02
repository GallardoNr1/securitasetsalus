import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import styles from '../billing.module.scss';

export const metadata: Metadata = {
  title: 'Inscripción confirmada',
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ session_id?: string; mode?: string }>;
};

/**
 * Aterrizaje tras pagar (o tras inscribirse en modo "no Stripe").
 *
 * El webhook de Stripe es quien realmente confirma el pago — esta
 * página solo agradece. Si el alumno llega aquí pero el webhook aún
 * no procesó (poco probable, pero posible por latencia), igualmente
 * verá la inscripción como "Confirmada" en /my-courses cuando llegue.
 */
export default async function BillingSuccessPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const { mode } = await searchParams;
  const isNoStripe = mode === 'no-stripe';

  return (
    <div className={styles.successPage}>
      <div className={styles.successCard}>
        <div className={styles.successIcon} aria-hidden>
          <CheckIcon />
        </div>
        <span className={styles.eyebrow}>
          {isNoStripe ? 'Inscripción registrada' : 'Pago confirmado'}
        </span>
        <h1 className={styles.title}>
          ¡Listo!
          <br />
          <span className={styles.titleItalic}>Tu cupo está reservado.</span>
        </h1>
        <p className={styles.lead}>
          {isNoStripe
            ? 'Tu inscripción quedó registrada. SES está operando aún sin pasarela de pago — recibirás un correo con instrucciones de pago manual si aplica.'
            : 'Recibimos tu pago correctamente. En unos minutos te llegará un correo con la confirmación y los datos del curso.'}
        </p>
        <div className={styles.successActions}>
          <Button href="/my-courses" variant="primary" size="md">
            Ver mis cursos
          </Button>
          <Link href="/courses" className={styles.secondaryLink}>
            Ver más cursos
          </Link>
        </div>
      </div>
    </div>
  );
}

function CheckIcon() {
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
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
