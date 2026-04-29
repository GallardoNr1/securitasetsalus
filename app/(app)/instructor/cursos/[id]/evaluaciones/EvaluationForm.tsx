'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useIsDirty } from '@/lib/hooks/use-dirty';
import { saveEvaluationsAction } from '@/app/(app)/instructor/actions';
import styles from './page.module.scss';

type EvaluationEntry = {
  enrollmentId: string;
  userId: string;
  name: string;
  avatarKey: string | null;
  attendedSessions: number;
  attendanceRatio: number;
  technicalScore: number | null;
  knowledgeScore: number | null;
  attitudeScore: number | null;
  participationScore: number | null;
  notes: string;
  previousFinalGrade: number | null;
  previousPassed: boolean | null;
};

type Props = {
  courseId: string;
  evaluatesAttitude: boolean;
  passingGrade: number;
  initialEntries: EvaluationEntry[];
};

const ATTENDANCE_THRESHOLD = 0.75;

function clampGrade(value: string): number | null {
  if (value === '') return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  if (n < 1) return 1;
  if (n > 7) return 7;
  return Number(n.toFixed(1));
}

export function EvaluationForm({
  courseId,
  evaluatesAttitude,
  passingGrade,
  initialEntries,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [entries, setEntries] = useState(initialEntries);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'error'; message: string } | null>(
    null,
  );

  // Snapshot ya guardado vs estado actual: comparamos solo los campos
  // editables (notas + comentarios). Tras guardar lo actualizamos y el
  // botón vuelve a quedar deshabilitado.
  const snapshotOf = (es: typeof initialEntries) =>
    es.map((e) => ({
      id: e.enrollmentId,
      t: e.technicalScore,
      k: e.knowledgeScore,
      a: e.attitudeScore,
      p: e.participationScore,
      n: e.notes,
    }));
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshotOf(initialEntries));
  const currentSnapshot = useMemo(() => snapshotOf(entries), [entries]);
  const isDirty = useIsDirty(savedSnapshot, currentSnapshot);

  function updateEntry<K extends keyof EvaluationEntry>(
    enrollmentId: string,
    field: K,
    value: EvaluationEntry[K],
  ) {
    setEntries((prev) =>
      prev.map((e) => (e.enrollmentId === enrollmentId ? { ...e, [field]: value } : e)),
    );
  }

  // Cálculo en vivo del promedio + estado por alumno (sin tocar BD).
  const computed = useMemo(() => {
    return entries.map((e) => {
      const dimensions: Array<number | null> = [
        e.technicalScore,
        e.knowledgeScore,
        evaluatesAttitude ? e.attitudeScore : null,
        e.participationScore,
      ];
      const filled = dimensions.filter((d): d is number => d !== null);
      const required = evaluatesAttitude ? 4 : 3;

      const finalGrade =
        filled.length === 0
          ? null
          : Number((filled.reduce((sum, n) => sum + n, 0) / filled.length).toFixed(2));

      const allFilled = filled.length === required;
      const meetsAttendance = e.attendanceRatio >= ATTENDANCE_THRESHOLD;

      let status: 'pending' | 'passed' | 'failed-grade' | 'failed-attendance' | 'failed-both' =
        'pending';
      if (allFilled && finalGrade !== null) {
        const lowGrade = finalGrade < passingGrade;
        if (lowGrade && !meetsAttendance) status = 'failed-both';
        else if (lowGrade) status = 'failed-grade';
        else if (!meetsAttendance) status = 'failed-attendance';
        else status = 'passed';
      }

      return { enrollmentId: e.enrollmentId, finalGrade, status };
    });
  }, [entries, evaluatesAttitude, passingGrade]);

  const computedMap = useMemo(
    () => new Map(computed.map((c) => [c.enrollmentId, c])),
    [computed],
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const result = await saveEvaluationsAction({
        courseId,
        entries: entries.map((entry) => ({
          enrollmentId: entry.enrollmentId,
          technicalScore: entry.technicalScore,
          knowledgeScore: entry.knowledgeScore,
          attitudeScore: entry.attitudeScore,
          participationScore: entry.participationScore,
          notes: entry.notes.trim() === '' ? null : entry.notes,
        })),
      });

      if (result.ok) {
        setFeedback({
          kind: 'ok',
          message: `${result.message} ${result.passedCount} aprueba${result.passedCount === 1 ? '' : 'n'}.`,
        });
        router.refresh();
        setSavedSnapshot(currentSnapshot);
      } else {
        setFeedback({ kind: 'error', message: result.message });
      }
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <ul className={styles.list}>
        {entries.map((entry) => {
          const c = computedMap.get(entry.enrollmentId);
          const finalGrade = c?.finalGrade ?? null;
          const status = c?.status ?? 'pending';

          return (
            <li key={entry.enrollmentId} className={styles.entry}>
              <header className={styles.entryHeader}>
                <Avatar
                  name={entry.name}
                  userId={entry.userId}
                  avatarKey={entry.avatarKey}
                  size="sm"
                />
                <div className={styles.entryHeaderText}>
                  <span className={styles.studentName}>{entry.name}</span>
                  <span className={styles.attendance}>
                    Asistencia: {Math.round(entry.attendanceRatio * 100)}%
                    {entry.attendanceRatio < ATTENDANCE_THRESHOLD ? ' (debajo del mínimo)' : ''}
                  </span>
                </div>
                <div className={styles.entrySummary}>
                  <span className={styles.finalGradeLabel}>Final</span>
                  <span
                    className={`${styles.finalGradeValue} ${status === 'passed' ? styles.gradePassed : ''} ${status.startsWith('failed') ? styles.gradeFailed : ''}`}
                  >
                    {finalGrade !== null ? finalGrade.toFixed(2) : '—'}
                  </span>
                  {status === 'passed' ? (
                    <span className={styles.statusPassed}>Aprueba</span>
                  ) : null}
                  {status === 'failed-grade' ? (
                    <span className={styles.statusFailed}>Suspende (nota)</span>
                  ) : null}
                  {status === 'failed-attendance' ? (
                    <span className={styles.statusFailed}>Suspende (asistencia)</span>
                  ) : null}
                  {status === 'failed-both' ? (
                    <span className={styles.statusFailed}>Suspende (nota + asistencia)</span>
                  ) : null}
                  {status === 'pending' ? (
                    <span className={styles.statusPending}>Pendiente</span>
                  ) : null}
                </div>
              </header>

              <div className={styles.grades}>
                <GradeInput
                  label="Técnica"
                  value={entry.technicalScore}
                  onChange={(v) => updateEntry(entry.enrollmentId, 'technicalScore', v)}
                  disabled={isPending}
                />
                <GradeInput
                  label="Conocimientos"
                  value={entry.knowledgeScore}
                  onChange={(v) => updateEntry(entry.enrollmentId, 'knowledgeScore', v)}
                  disabled={isPending}
                />
                {evaluatesAttitude ? (
                  <GradeInput
                    label="Actitud"
                    value={entry.attitudeScore}
                    onChange={(v) => updateEntry(entry.enrollmentId, 'attitudeScore', v)}
                    disabled={isPending}
                  />
                ) : null}
                <GradeInput
                  label="Participación"
                  value={entry.participationScore}
                  onChange={(v) => updateEntry(entry.enrollmentId, 'participationScore', v)}
                  disabled={isPending}
                />
              </div>

              <label className={styles.notesLabel}>
                <span>Comentarios (opcional)</span>
                <textarea
                  className={styles.notes}
                  value={entry.notes}
                  onChange={(e) => updateEntry(entry.enrollmentId, 'notes', e.target.value)}
                  rows={2}
                  maxLength={1000}
                  placeholder="Observaciones específicas del alumno…"
                  disabled={isPending}
                />
              </label>
            </li>
          );
        })}
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
        <Link href={`/instructor/cursos/${courseId}`} className={styles.cancelLink}>
          Cancelar
        </Link>
        <Button type="submit" loading={isPending} disabled={isPending || !isDirty}>
          Guardar evaluaciones
        </Button>
      </div>
    </form>
  );
}

type GradeInputProps = {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
};

function GradeInput({ label, value, onChange, disabled }: GradeInputProps) {
  return (
    <label className={styles.gradeInputLabel}>
      <span>{label}</span>
      <input
        type="number"
        min={1}
        max={7}
        step={0.1}
        className={styles.gradeInput}
        value={value === null ? '' : value}
        onChange={(e) => onChange(clampGrade(e.target.value))}
        disabled={disabled}
        placeholder="—"
      />
    </label>
  );
}
