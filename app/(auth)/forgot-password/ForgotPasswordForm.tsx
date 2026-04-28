'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
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
      <div className={styles.card}>
        <span className={styles.eyebrow}>Revisa tu correo</span>
        <h1>Si la cuenta existe, te enviamos un enlace</h1>
        <div className={styles.successBanner}>
          Si hay una cuenta con ese correo, recibirás en unos minutos un enlace para crear una
          nueva contraseña. El enlace caduca en 1 hora.
        </div>
        <p>
          Por seguridad no confirmamos si el correo existe en nuestra base de datos. Revisa
          también la carpeta de spam.
        </p>
        <p className={styles.footerLink}>
          <Link href="/login">← Volver al login</Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <span className={styles.eyebrow}>Recuperar contraseña</span>
      <h1>¿Olvidaste tu contraseña?</h1>
      <p>
        Introduce el correo de tu cuenta y te enviaremos un enlace para crear una contraseña
        nueva.
      </p>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}

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
  );
}
