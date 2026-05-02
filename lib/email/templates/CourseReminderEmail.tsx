import { Button, Heading, Section, Text } from '@react-email/components';
import { BaseLayout, COLORS } from './BaseLayout';

type Props = {
  name: string;
  courseTitle: string;
  startsAt: Date;
  venueName: string | null;
  venueAddress: string | null;
  myCoursesUrl: string;
};

const FORMATTER = new Intl.DateTimeFormat('es-CL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Santiago',
});

export function CourseReminderEmail({
  name,
  courseTitle,
  startsAt,
  venueName,
  venueAddress,
  myCoursesUrl,
}: Props) {
  const firstName = name.split(' ')[0] ?? name;
  return (
    <BaseLayout preview={`Tu curso "${courseTitle}" empieza en 48 h`}>
      <Heading style={{ fontSize: '22px', color: COLORS.brand, margin: '0 0 16px' }}>
        Tu curso empieza pasado mañana, {firstName}.
      </Heading>
      <Text style={{ fontSize: '16px', lineHeight: '24px', margin: '0 0 16px' }}>
        Te recordamos que <strong>{courseTitle}</strong> arranca el{' '}
        <strong>{FORMATTER.format(startsAt)}</strong>.
      </Text>

      {venueName ? (
        <Section
          style={{
            padding: '16px',
            backgroundColor: COLORS.surface,
            borderRadius: '8px',
            border: `1px solid ${COLORS.hairline}`,
            margin: '0 0 24px',
          }}
        >
          <Text
            style={{
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: COLORS.mute,
              margin: '0 0 4px',
            }}
          >
            Sede
          </Text>
          <Text
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: COLORS.ink,
              margin: '0 0 4px',
            }}
          >
            {venueName}
          </Text>
          {venueAddress ? (
            <Text style={{ fontSize: '13px', color: COLORS.mute, margin: 0, lineHeight: '20px' }}>
              {venueAddress}
            </Text>
          ) : null}
        </Section>
      ) : null}

      <Text style={{ fontSize: '15px', lineHeight: '22px', margin: '0 0 16px' }}>
        Llega 10 minutos antes para registrarte. Trae documento de identidad y, si tu curso lo
        requiere, ropa adecuada para taller (manga larga, calzado cerrado).
      </Text>

      <Section style={{ textAlign: 'center', margin: '0 0 24px' }}>
        <Button
          href={myCoursesUrl}
          style={{
            backgroundColor: COLORS.brand,
            color: COLORS.white,
            padding: '14px 28px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Ver detalles del curso
        </Button>
      </Section>

      <Text style={{ fontSize: '13px', lineHeight: '20px', margin: '0', color: COLORS.mute }}>
        ¿Necesitas cancelar? Hazlo desde tu panel de pagos cuanto antes — el reembolso depende
        de la antelación.
      </Text>
    </BaseLayout>
  );
}

export function courseReminderEmailText({
  name,
  courseTitle,
  startsAt,
  venueName,
  venueAddress,
  myCoursesUrl,
}: Props): string {
  const firstName = name.split(' ')[0] ?? name;
  const lines = [
    `Tu curso empieza pasado mañana, ${firstName}.`,
    '',
    `${courseTitle} arranca el ${FORMATTER.format(startsAt)}.`,
    '',
  ];
  if (venueName) {
    lines.push(`Sede: ${venueName}`);
    if (venueAddress) lines.push(venueAddress);
    lines.push('');
  }
  lines.push(
    'Llega 10 minutos antes para registrarte. Trae documento de identidad y ropa adecuada para taller.',
    '',
    `Detalles: ${myCoursesUrl}`,
    '',
    '— SecuritasEtSalus',
  );
  return lines.join('\n');
}
