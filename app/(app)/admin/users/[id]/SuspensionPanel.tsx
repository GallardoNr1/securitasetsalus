'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Field, Label, Textarea } from '@/components/ui/Input';
import { reactivateUserAction, suspendUserAction } from '../actions';
import styles from './SuspensionPanel.module.scss';

type Props = {
  userId: string;
  userName: string;
  isSelf: boolean;
  suspendedAt: Date | null;
  suspendedReason: string | null;
};

/**
 * Panel para suspender/reactivar la cuenta de un usuario desde el
 * detalle admin. Es la única acción destructiva sobre la cuenta que
 * tiene el admin — no puede borrar ni editar PII.
 *
 * Suspender invalida las sesiones activas vía `db.session.deleteMany`
 * en la server action; el usuario tiene que re-loguearse y NextAuth
 * lo bloquea por el `suspendedAt` no nulo.
 */
export function SuspensionPanel({
  userId,
  userName,
  isSelf,
  suspendedAt,
  suspendedReason,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState('');

  const isSuspended = suspendedAt !== null;

  function handleSuspend(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const r = (formData.get('reason') as string) || null;
      const result = await suspendUserAction(userId, r);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setConfirmOpen(false);
      setReason('');
      router.refresh();
    });
  }

  function handleReactivate() {
    startTransition(async () => {
      setError(null);
      const result = await reactivateUserAction(userId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  }

  if (isSelf) {
    return (
      <section className={`${styles.panel} ${styles.panelMuted}`}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Suspensión</span>
          <h2 className={styles.title}>Tu propia cuenta</h2>
        </header>
        <p className={styles.body}>
          No puedes suspenderte a ti mismo desde aquí. Otro administrador tendría que
          hacerlo.
        </p>
      </section>
    );
  }

  if (isSuspended) {
    return (
      <section className={`${styles.panel} ${styles.panelDanger}`}>
        <header className={styles.header}>
          <span className={`${styles.eyebrow} ${styles.eyebrowDanger}`}>
            Cuenta suspendida
          </span>
          <h2 className={styles.title}>{userName} no puede iniciar sesión</h2>
        </header>

        <dl className={styles.meta}>
          <div className={styles.metaRow}>
            <dt>Suspendida el</dt>
            <dd>
              {suspendedAt!.toLocaleString('es-CL', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
            </dd>
          </div>
          {suspendedReason ? (
            <div className={styles.metaRow}>
              <dt>Motivo</dt>
              <dd>{suspendedReason}</dd>
            </div>
          ) : null}
        </dl>

        {error ? <div className={styles.error}>{error}</div> : null}

        <Button
          type="button"
          variant="primary"
          size="md"
          loading={pending}
          onClick={handleReactivate}
        >
          Reactivar cuenta
        </Button>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Suspensión</span>
        <h2 className={styles.title}>Bloquear el acceso de {userName}</h2>
      </header>

      <p className={styles.body}>
        Suspender la cuenta impide al usuario iniciar sesión y cierra cualquier sesión
        activa. Sus inscripciones y diplomas se conservan intactos para no romper la
        verificación pública. Puedes reactivarla cuando quieras.
      </p>

      {error ? <div className={styles.error}>{error}</div> : null}

      {confirmOpen ? (
        <form action={handleSuspend} className={styles.confirmForm}>
          <Field>
            <Label htmlFor="reason">Motivo (opcional, queda guardado)</Label>
            <Textarea
              id="reason"
              name="reason"
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: incumplimiento del código de conducta — incidente del 2026-04-28"
            />
          </Field>
          <div className={styles.confirmActions}>
            <Button type="submit" variant="primary" size="md" loading={pending}>
              Confirmar suspensión
            </Button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => {
                setConfirmOpen(false);
                setReason('');
                setError(null);
              }}
              disabled={pending}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className={styles.dangerButton}
          onClick={() => setConfirmOpen(true)}
        >
          Suspender cuenta
        </button>
      )}
    </section>
  );
}
