import { Heading, Text } from '@react-email/components';
import { BaseLayout, COLORS } from './BaseLayout';

type Props = {
  name: string;
  courseTitle: string;
  reason: 'attendance' | 'evaluation' | 'both';
  finalGrade: number | null;
  attendancePercentage: number | null;
  catalogUrl: string;
};

const REASON_COPY: Record<Props['reason'], { title: string; lead: string }> = {
  attendance: {
    title: 'No alcanzaste el mínimo de asistencia',
    lead: 'El SENCE exige al menos 75% de asistencia para emitir diploma. Tu evaluación quedó registrada, pero sin el aforo cumplido no podemos certificar.',
  },
  evaluation: {
    title: 'Tu evaluación final no alcanzó la nota mínima',
    lead: 'Aprobaste la asistencia, pero la evaluación quedó por debajo del umbral del curso (4.0 / 7.0). El instructor dejó retroalimentación detallada que puedes consultar al inscribirte de nuevo.',
  },
  both: {
    title: 'No alcanzaste asistencia ni nota mínimas',
    lead: 'Para emitir diploma SES exigimos 75% de asistencia y nota ≥ 4.0 / 7.0. Esta vez no se cumplió ninguno de los dos.',
  },
};

export function DiplomaFailedEmail({
  name,
  courseTitle,
  reason,
  finalGrade,
  attendancePercentage,
  catalogUrl,
}: Props) {
  const firstName = name.split(' ')[0] ?? name;
  const copy = REASON_COPY[reason];
  return (
    <BaseLayout preview={`Tu curso "${courseTitle}" no concluyó con diploma`}>
      <Heading style={{ fontSize: '22px', color: COLORS.brand, margin: '0 0 16px' }}>
        Hola {firstName},
      </Heading>
      <Text style={{ fontSize: '16px', lineHeight: '24px', margin: '0 0 16px' }}>
        El curso <strong>{courseTitle}</strong> ha cerrado y, esta vez, no podemos emitirte
        diploma.
      </Text>

      <Heading
        style={{
          fontSize: '16px',
          color: COLORS.dangerDark,
          margin: '0 0 8px',
          fontWeight: 600,
        }}
      >
        {copy.title}
      </Heading>
      <Text
        style={{
          fontSize: '14px',
          lineHeight: '22px',
          padding: '14px 16px',
          backgroundColor: COLORS.dangerLight,
          borderLeft: `3px solid ${COLORS.danger}`,
          borderRadius: '4px',
          margin: '0 0 20px',
          color: COLORS.dangerDark,
        }}
      >
        {copy.lead}
      </Text>

      {finalGrade !== null || attendancePercentage !== null ? (
        <Text style={{ fontSize: '14px', lineHeight: '22px', margin: '0 0 16px' }}>
          Tus datos del curso:
          <br />
          {finalGrade !== null ? (
            <>
              <strong>Nota final:</strong> {finalGrade.toFixed(1)} / 7.0
              <br />
            </>
          ) : null}
          {attendancePercentage !== null ? (
            <>
              <strong>Asistencia:</strong> {attendancePercentage}%
            </>
          ) : null}
        </Text>
      ) : null}

      <Text style={{ fontSize: '15px', lineHeight: '22px', margin: '0 0 16px' }}>
        Puedes inscribirte de nuevo en la próxima cohorte cuando esté disponible. Si crees que
        hay un error, responde a este correo y revisamos.
      </Text>

      <Text style={{ fontSize: '13px', lineHeight: '20px', margin: '0', color: COLORS.mute }}>
        Catálogo de cursos: <a href={catalogUrl} style={{ color: COLORS.brand }}>{new URL(catalogUrl).host}/courses</a>
      </Text>
    </BaseLayout>
  );
}

export function diplomaFailedEmailText({
  name,
  courseTitle,
  reason,
  finalGrade,
  attendancePercentage,
  catalogUrl,
}: Props): string {
  const firstName = name.split(' ')[0] ?? name;
  const copy = REASON_COPY[reason];
  const lines = [
    `Hola ${firstName},`,
    '',
    `El curso "${courseTitle}" ha cerrado y, esta vez, no podemos emitirte diploma.`,
    '',
    copy.title,
    copy.lead,
    '',
  ];
  if (finalGrade !== null) lines.push(`Nota final: ${finalGrade.toFixed(1)} / 7.0`);
  if (attendancePercentage !== null) lines.push(`Asistencia: ${attendancePercentage}%`);
  if (finalGrade !== null || attendancePercentage !== null) lines.push('');
  lines.push(
    'Puedes inscribirte de nuevo cuando se publique la próxima cohorte. Si crees que hay un error, responde a este correo.',
    '',
    `Catálogo: ${catalogUrl}`,
    '',
    '— SecuritasEtSalus',
  );
  return lines.join('\n');
}
