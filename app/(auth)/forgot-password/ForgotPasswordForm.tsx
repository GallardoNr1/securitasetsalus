'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/features/AuthShell';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, ErrorMessage } from '@/components/ui/Input';
import { forgotPasswordAction } from './actions';
import styles from '../authForm.module.scss';

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const result = await forgotPasswordAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <AuthShell
        side="recover"
        title={
          <>
            Revisa
            <br />
            tu correo.
          </>
        }
        subtitle="Si la cuenta existe, te enviamos un enlace para crear una contraseña nueva."
      >
        <div className={styles.body}>
          <div className={styles.successBanner}>
            Si hay una cuenta con ese correo, recibirás en unos minutos un enlace para crear
            una nueva contraseña. El enlace caduca en 1 hora.
          </div>
          <p>
            Por seguridad no confirmamos si el correo existe en nuestra base de datos. Revisa
            también la carpeta de spam.
          </p>
          <p className={styles.footerLink}>
            <Link href="/login">← Volver al login</Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      side="recover"
      title={
        <>
          Recuperar
          <br />
          contraseña.
        </>
      }
      subtitle="Ingresa el correo de tu cuenta. Te enviaremos un enlace seguro para restablecer tu contraseña."
      banner={error ? <div className={styles.errorBanner}>{error}</div> : undefined}
    >
      <div className={styles.body}>
        <form action={handleSubmit} className={styles.form} noValidate>
          <Field>
            <Label htmlFor="email" required>
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@correo.com"
            />
            <ErrorMessage />
          </Field>

          <Button type="submit" variant="primary" size="lg" loading={pending} fullWidth>
            Enviar enlace
          </Button>
        </form>

        <p className={styles.footerLink}>
          <Link href="/login">← Volver al login</Link>
        </p>
      </div>
    </AuthShell>
  );
}
