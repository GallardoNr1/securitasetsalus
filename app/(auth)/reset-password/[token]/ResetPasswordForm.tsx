'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Field, Label, ErrorMessage } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { resetPasswordAction } from './actions';
import styles from '../../authForm.module.scss';

type Props = { token: string };

export function ResetPasswordForm({ token }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set('token', token);
    startTransition(async () => {
      setError(null);
      const result = await resetPasswordAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSuccess(true);
    });
  }

  if (success) {
    return (
      <div className={styles.card}>
        <span className={styles.eyebrow}>Contraseña actualizada</span>
        <h1>Listo, ya puedes iniciar sesión</h1>
        <div className={styles.successBanner}>Tu nueva contraseña ya está guardada.</div>
        <Link
          href="/login"
          style={{
            display: 'inline-block',
            textAlign: 'center',
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          <Button variant="primary" size="lg" fullWidth>
            Ir al login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <span className={styles.eyebrow}>Nueva contraseña</span>
      <h1>Crea una contraseña nueva</h1>
      <p>Elige una contraseña con al menos 8 caracteres.</p>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <form action={handleSubmit} className={styles.form} noValidate>
        <Field>
          <Label htmlFor="password" required>
            Nueva contraseña
          </Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <ErrorMessage />
        </Field>

        <Field>
          <Label htmlFor="passwordConfirm" required>
            Repite la contraseña
          </Label>
          <PasswordInput
            id="passwordConfirm"
            name="passwordConfirm"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <ErrorMessage />
        </Field>

        <Button type="submit" variant="primary" size="lg" loading={pending} fullWidth>
          Guardar contraseña
        </Button>
      </form>
    </div>
  );
}
