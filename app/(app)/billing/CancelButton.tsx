'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelEnrollmentAction } from './actions';
import styles from './billing.module.scss';

type Props = {
  enrollmentId: string;
  courseTitle: string;
};

/**
 * Botón "Cancelar inscripción" en la fila de /billing.
 *
 * Click → muestra confirmación inline con campo opcional de motivo.
 * Submit → llama `cancelEnrollmentAction` y refresca la lista.
 * El cálculo del % de reembolso lo hace la action (función pura
 * `computeRefundAmount`) — el alumno verá el monto en el email y en
 * el badge de status que actualiza la tabla.
 */
export function CancelButton({ enrollmentId, courseTitle }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    startTransition(async () => {
      setError(null);
      const result = await cancelEnrollmentAction({
        enrollmentId,
        reason: reason.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOpen(false);
      setReason('');
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        className={styles.cancelTrigger}
        onClick={() => setOpen(true)}
      >
        Cancelar
      </button>
    );
  }

  return (
    <div className={styles.cancelInline}>
      <p className={styles.cancelInlineQuestion}>
        ¿Cancelar tu inscripción a <strong>{courseTitle}</strong>?
      </p>
      <textarea
        className={styles.cancelInlineTextarea}
        placeholder="Motivo (opcional)"
        rows={2}
        maxLength={500}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        disabled={pending}
      />
      {error ? <p className={styles.cancelInlineError}>{error}</p> : null}
      <div className={styles.cancelInlineActions}>
        <button
          type="button"
          className={styles.cancelInlineCancel}
          onClick={() => {
            setOpen(false);
            setReason('');
            setError(null);
          }}
          disabled={pending}
        >
          No
        </button>
        <button
          type="button"
          className={styles.cancelInlineConfirm}
          onClick={handleCancel}
          disabled={pending}
        >
          {pending ? 'Cancelando…' : 'Sí, cancelar'}
        </button>
      </div>
    </div>
  );
}
