import type { Metadata } from 'next';
import Link from 'next/link';
import { ResendForm } from './ResendForm';
import styles from '../../authForm.module.scss';

export const metadata: Metadata = {
  title: 'Revisa tu correo',
  robots: { index: false, follow: true },
};

type Props = {
  searchParams: Promise<{ email?: string }>;
};

export default async function VerifyEmailSentPage({ searchParams }: Props) {
  const params = await searchParams;
  const email = params.email ?? '';

  return (
    <div className={styles.card}>
      <span className={styles.eyebrow}>Cuenta creada</span>
      <h1>Revisa tu correo</h1>
      <p>
        {email ? (
          <>
            Hemos enviado un enlace de verificación a <strong>{email}</strong>. Pulsa el enlace
            del correo para activar tu cuenta — caduca en 24 horas.
          </>
        ) : (
          <>
            Hemos enviado un enlace de verificación a tu correo. Pulsa el enlace para activar
            tu cuenta — caduca en 24 horas.
          </>
        )}
      </p>
      <p>
        ¿No te llegó? Revisa la carpeta de spam o vuelve a pedirlo más abajo. Si pones un
        correo distinto al del registro, no llegará nada.
      </p>

      {email ? <ResendForm email={email} /> : null}

      <p className={styles.footerLink}>
        <Link href="/login">← Volver al login</Link>
      </p>
    </div>
  );
}
