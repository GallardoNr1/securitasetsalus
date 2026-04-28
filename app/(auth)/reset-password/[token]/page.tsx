import type { Metadata } from 'next';
import Link from 'next/link';
import { inspectPasswordResetToken } from '@/lib/tokens';
import { ResetPasswordForm } from './ResetPasswordForm';
import styles from '../../authForm.module.scss';

export const metadata: Metadata = {
  title: 'Crear nueva contraseña',
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ token: string }>;
};

export default async function ResetPasswordPage({ params }: Props) {
  const { token } = await params;
  const result = await inspectPasswordResetToken(token);

  if (!result.valid) {
    const reasons = {
      invalid: 'El enlace no es válido o ya no existe.',
      used: 'Este enlace ya se usó. Pide uno nuevo si necesitas cambiar la contraseña.',
      expired: 'El enlace ha caducado. Pide uno nuevo desde "¿Olvidaste tu contraseña?".',
    } as const;
    return (
      <div className={styles.card}>
        <span className={styles.eyebrow}>Enlace no disponible</span>
        <h1>No podemos usar este enlace</h1>
        <div className={styles.errorBanner}>{reasons[result.reason]}</div>
        <p className={styles.footerLink}>
          <Link href="/forgot-password">Pedir un nuevo enlace</Link>
        </p>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
