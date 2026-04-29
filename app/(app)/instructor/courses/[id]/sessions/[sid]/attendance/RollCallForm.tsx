'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useIsDirty } from '@/lib/hooks/use-dirty';
import { markAttendanceAction } from '@/app/(app)/instructor/actions';
import styles from './page.module.scss';

type RosterEntry = {
  enrollmentId: string;
  userId: string;
  name: string;
  avatarKey: string | null;
  attended: boolean;
  previouslyMarked: boolean;
};

type Props = {
  sessionId: string;
  courseId: string;
  initialRoster: RosterEntry[];
};

export function RollCallForm({ sessionId, courseId, initialRoster }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [roster, setRoster] = useState(initialRoster);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; message: string } | null>(
    null,
  );

  // Snapshot "ya guardado" — comparamos contra él para decidir si el
  // botón Guardar está activo. Tras un guardado exitoso lo actualizamos
  // al estado actual y el botón vuelve a quedar deshabilitado.
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    initialRoster.map((r) => ({ id: r.enrollmentId, attended: r.attended })),
  );
  const currentSnapshot = useMemo(
    () => roster.map((r) => ({ id: r.enrollmentId, attended: r.attended })),
    [roster],
  );
  const isDirty = useIsDirty(savedSnapshot, currentSnapshot);

  function toggle(enrollmentId: string, attended: boolean) {
    setRoster((prev) =>
      prev.map((r) => (r.enrollmentId === enrollmentId ? { ...r, attended } : r)),
    );
  }

  function markAll(attended: boolean) {
    setRoster((prev) => prev.map((r) => ({ ...r, attended })));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const result = await markAttendanceAction({
        sessionId,
        entries: roster.map((r) => ({
          enrollmentId: r.enrollmentId,
          attended: r.attended,
        })),
      });

      if (result.ok) {
        setFeedback({ kind: 'ok', message: result.message });
        // Refresca SSR para que el detalle del curso vea los counts nuevos.
        router.refresh();
        // Marca todo el roster como "previamente marcado" para mostrar bien el estado.
        setRoster((prev) => prev.map((r) => ({ ...r, previouslyMarked: true })));
        // Actualizamos el snapshot "ya guardado" para que el botón
        // vuelva a quedar gris hasta que haya cambios nuevos.
        setSavedSnapshot(currentSnapshot);
      } else {
        setFeedback({ kind: 'error', message: result.message });
      }
    });
  }

  const presentCount = roster.filter((r) => r.attended).length;
  const totalCount = roster.length;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.summary}>
        <div className={styles.counter}>
          <strong>{presentCount}</strong> de <strong>{totalCount}</strong> presentes
        </div>
        <div className={styles.bulkActions}>
          <button
            type="button"
            className={styles.bulkButton}
            onClick={() => markAll(true)}
            disabled={isPending}
          >
            Marcar todos presentes
          </button>
          <button
            type="button"
            className={styles.bulkButton}
            onClick={() => markAll(false)}
            disabled={isPending}
          >
            Limpiar
          </button>
        </div>
      </div>

      <ul className={styles.roster}>
        {roster.map((r) => (
          <li key={r.enrollmentId} className={styles.row}>
            <label className={styles.rowLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={r.attended}
                onChange={(e) => toggle(r.enrollmentId, e.target.checked)}
                disabled={isPending}
              />
              <Avatar
                name={r.name}
                userId={r.userId}
                avatarKey={r.avatarKey}
                size="sm"
              />
              <span className={styles.studentName}>{r.name}</span>
              {r.previouslyMarked ? (
                <span className={styles.previouslyMarked}>Ya marcado</span>
              ) : null}
            </label>
          </li>
        ))}
      </ul>

      {feedback ? (
        <p
          className={feedback.kind === 'ok' ? styles.feedbackOk : styles.feedbackError}
          role="status"
        >
          {feedback.message}
        </p>
      ) : null}

      <div className={styles.actions}>
        <Link href={`/instructor/courses/${courseId}`} className={styles.cancelLink}>
          Cancelar
        </Link>
        <Button type="submit" loading={isPending} disabled={isPending || !isDirty}>
          Guardar asistencia
        </Button>
      </div>
    </form>
  );
}
