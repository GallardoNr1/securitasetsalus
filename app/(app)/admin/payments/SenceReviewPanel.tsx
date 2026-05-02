'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { PendingSenceEnrollment } from '@/lib/queries/payments';
import { Button } from '@/components/ui/Button';
import { approveSenceEnrollmentAction, rejectSenceEnrollmentAction } from './actions';
import styles from './payments.module.scss';

type Props = {
  enrollment: PendingSenceEnrollment;
};

export function SenceReviewPanel({ enrollment }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    startTransition(async () => {
      setError(null);
      const r = await approveSenceEnrollmentAction(enrollment.id);
      if (!r.ok) {
        setError(r.message);
        return;
      }
      router.refresh();
    });
  }

  function handleReject() {
    startTransition(async () => {
      setError(null);
      const r = await rejectSenceEnrollmentAction(enrollment.id, reason);
      if (!r.ok) {
        setError(r.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className={styles.senceCard}>
      <header className={styles.senceCardHeader}>
        <div>
          <strong className={styles.userName}>{enrollment.user.name}</strong>
          <div className={styles.userEmail}>{enrollment.user.email}</div>
        </div>
        <div className={styles.senceCourseTitle}>{enrollment.course.title}</div>
      </header>

      <dl className={styles.senceMeta}>
        <div className={styles.senceMetaRow}>
          <dt>RUT alumno</dt>
          <dd className={styles.mono}>{enrollment.user.rut ?? '—'}</dd>
        </div>
        <div className={styles.senceMetaRow}>
          <dt>RUT empleador</dt>
          <dd className={styles.mono}>{enrollment.employerRut ?? '—'}</dd>
        </div>
        <div className={styles.senceMetaRow}>
          <dt>Empleador</dt>
          <dd>{enrollment.employerName ?? '—'}</dd>
        </div>
        <div className={styles.senceMetaRow}>
          <dt>Email RR.HH.</dt>
          <dd className={styles.mono}>{enrollment.employerHrEmail ?? '—'}</dd>
        </div>
      </dl>

      {error ? <p className={styles.senceError}>{error}</p> : null}

      {!rejectOpen ? (
        <div className={styles.senceActions}>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleApprove}
            loading={pending}
          >
            Aprobar
          </Button>
          <button
            type="button"
            className={styles.senceRejectTrigger}
            onClick={() => setRejectOpen(true)}
            disabled={pending}
          >
            Rechazar
          </button>
        </div>
      ) : (
        <div className={styles.senceRejectInline}>
          <textarea
            className={styles.senceRejectTextarea}
            placeholder="Motivo del rechazo (visible al alumno)…"
            rows={2}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={pending}
          />
          <div className={styles.senceRejectActions}>
            <button
              type="button"
              className={styles.senceCancel}
              onClick={() => {
                setRejectOpen(false);
                setReason('');
                setError(null);
              }}
              disabled={pending}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.senceConfirmReject}
              onClick={handleReject}
              disabled={pending || reason.trim().length === 0}
            >
              {pending ? 'Rechazando…' : 'Confirmar rechazo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
