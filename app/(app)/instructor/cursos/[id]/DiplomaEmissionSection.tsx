'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { issueDiplomasAction } from '@/app/(app)/instructor/actions';
import styles from './page.module.scss';

type Props = {
  courseId: string;
  /** Alumnos COMPLETED y aprobados (con derecho a diploma). */
  passedCount: number;
  /** Diplomas ya emitidos en este curso. */
  diplomasIssued: number;
};

export function DiplomaEmissionSection({ courseId, passedCount, diplomasIssued }: Props) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; message: string } | null>(
    null,
  );

  const pending = passedCount - diplomasIssued;

  function handleClick() {
    setFeedback(null);
    startTransition(async () => {
      const result = await issueDiplomasAction(courseId);
      if (result.ok) {
        setFeedback({ kind: 'ok', message: result.message });
      } else {
        setFeedback({ kind: 'error', message: result.message });
      }
    });
  }

  return (
    <section className={styles.diplomas}>
      <header className={styles.sectionHeader}>
        <h2>Emisión de diplomas</h2>
        <p>
          Cuando un alumno cierre el curso con asistencia ≥75% y nota ≥4.0, puedes emitir su
          diploma con un PDF descargable, código QR público y notificación por email.
        </p>
      </header>

      <dl className={styles.diplomaStats}>
        <div>
          <dt>Aptos para diploma</dt>
          <dd>{passedCount}</dd>
        </div>
        <div>
          <dt>Diplomas emitidos</dt>
          <dd>{diplomasIssued}</dd>
        </div>
        <div>
          <dt>Pendientes</dt>
          <dd>{Math.max(0, pending)}</dd>
        </div>
      </dl>

      {feedback ? (
        <p
          className={feedback.kind === 'ok' ? styles.feedbackOk : styles.feedbackError}
          role="status"
        >
          {feedback.message}
        </p>
      ) : null}

      <div className={styles.diplomaActions}>
        <Button
          type="button"
          variant="primary"
          size="md"
          loading={isPending}
          disabled={isPending || pending <= 0}
          onClick={handleClick}
        >
          {pending > 0 ? `Emitir ${pending} diploma${pending === 1 ? '' : 's'}` : 'Sin diplomas pendientes'}
        </Button>
      </div>
    </section>
  );
}
