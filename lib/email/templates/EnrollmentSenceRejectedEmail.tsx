import { Button, Heading, Section, Text } from '@react-email/components';
import { BaseLayout, COLORS } from './BaseLayout';

type Props = {
  name: string;
  courseTitle: string;
  reason: string;
  enrollAgainUrl: string;
};

export function EnrollmentSenceRejectedEmail({
  name,
  courseTitle,
  reason,
  enrollAgainUrl,
}: Props) {
  const firstName = name.split(' ')[0] ?? name;
  return (
    <BaseLayout preview={`Solicitud SENCE no aprobada — ${courseTitle}`}>
      <Heading style={{ fontSize: '22px', color: COLORS.brand, margin: '0 0 16px' }}>
        Tu solicitud SENCE no fue aprobada
      </Heading>
      <Text style={{ fontSize: '16px', lineHeight: '24px', margin: '0 0 16px' }}>
        Hola {firstName}, no pudimos confirmar tu inscripción a{' '}
        <strong>{courseTitle}</strong> con franquicia SENCE.
      </Text>
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
        <strong>Motivo:</strong> {reason}
      </Text>
      <Text style={{ fontSize: '15px', lineHeight: '22px', margin: '0 0 16px' }}>
        Si quieres, puedes inscribirte pagando de tu bolsillo desde el catálogo. Tu cupo
        original ya se liberó.
      </Text>
      <Section style={{ textAlign: 'center', margin: '0 0 24px' }}>
        <Button
          href={enrollAgainUrl}
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
          Volver al curso
        </Button>
      </Section>
      <Text style={{ fontSize: '13px', lineHeight: '20px', margin: '0', color: COLORS.mute }}>
        Si crees que es un error, responde a este correo y revisamos.
      </Text>
    </BaseLayout>
  );
}

export function enrollmentSenceRejectedEmailText({
  name,
  courseTitle,
  reason,
  enrollAgainUrl,
}: Props): string {
  const firstName = name.split(' ')[0] ?? name;
  return [
    `Tu solicitud SENCE no fue aprobada — ${courseTitle}`,
    '',
    `Hola ${firstName}, no pudimos confirmar tu inscripción con franquicia SENCE.`,
    '',
    `Motivo: ${reason}`,
    '',
    'Tu cupo original ya se liberó. Si quieres, puedes inscribirte pagando de tu bolsillo:',
    enrollAgainUrl,
    '',
    '— SecuritasEtSalus',
  ].join('\n');
}
