import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { consumeEmailVerificationToken } from '@/lib/tokens';
import { sendWelcomeEmail } from '@/lib/email/send';
import { Button } from '@/components/ui/Button';
import styles from '../../authForm.module.scss';

export const metadata: Metadata = {
  title: 'Verificación de correo',
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ token: string }>;
};

export default async function VerifyEmailTokenPage({ params }: Props) {
  const { token } = await params;
  const result = await consumeEmailVerificationToken(token);

  if (!result.ok) {
    const reasons = {
      invalid: 'El enlace no es válido o ya no existe.',
      used: 'Este enlace ya se usó. Si tu cuenta sigue sin verificar, pide uno nuevo desde /login.',
      expired: 'El enlace ha caducado. Pide uno nuevo desde /login.',
    } as const;
    return (
      <div className={styles.card}>
        <span className={styles.eyebrow}>Verificación fallida</span>
        <h1>No podemos verificar este enlace</h1>
        <div className={styles.errorBanner}>{reasons[result.reason]}</div>
        <p className={styles.footerLink}>
          <Link href="/login">← Ir al login</Link>
        </p>
      </div>
    );
  }

  // Verificación nueva (no idempotente): mandamos el email de bienvenida.
  if (!result.alreadyVerified) {
    const user = await db.user.findUnique({
      where: { id: result.userId },
      select: { name: true, email: true },
    });
    if (user) {
      // Best effort — si falla el email, la verificación ya está hecha.
      await sendWelcomeEmail(user.email, user.name);
    }
  }

  return (
    <div className={styles.card}>
      <span className={styles.eyebrow}>Cuenta verificada</span>
      <h1>{result.alreadyVerified ? 'Tu cuenta ya estaba verificada' : 'Listo, cuenta activada'}</h1>
      <div className={styles.successBanner}>
        {result.alreadyVerified
          ? 'Puedes iniciar sesión cuando quieras.'
          : 'Tu correo está confirmado. Ya puedes iniciar sesión y empezar a inscribirte en cursos.'}
      </div>
      <Link
        href="/login"
        style={{ display: 'block', textAlign: 'center', textDecoration: 'none', color: 'inherit' }}
      >
        <Button variant="primary" size="lg" fullWidth>
          Iniciar sesión
        </Button>
      </Link>
    </div>
  );
}
