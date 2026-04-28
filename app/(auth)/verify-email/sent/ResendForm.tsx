'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { resendVerificationAction } from './actions';
import styles from '../../authForm.module.scss';

type Props = { email: string };

export function ResendForm({ email }: Props) {
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleResend() {
    const formData = new FormData();
    formData.set('email', email);
    startTransition(async () => {
      const result = await resendVerificationAction(formData);
      if (result.ok) setSent(true);
    });
  }

  if (sent) {
    return (
      <div className={styles.successBanner}>
        Si la cuenta existe y aún no está verificada, te enviamos un nuevo enlace.
      </div>
    );
  }

  return (
    <Button onClick={handleResend} loading={pending} variant="secondary" size="md" type="button">
      Reenviar email de verificación
    </Button>
  );
}
