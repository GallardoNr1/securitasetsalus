import { Button, Heading, Section, Text } from '@react-email/components';
import { BaseLayout, COLORS } from './BaseLayout';

type Props = {
  name: string;
  courseTitle: string;
  myCoursesUrl: string;
};

export function EnrollmentSenceApprovedEmail({ name, courseTitle, myCoursesUrl }: Props) {
  const firstName = name.split(' ')[0] ?? name;
  return (
    <BaseLayout preview={`Solicitud SENCE aprobada — ${courseTitle}`}>
      <Heading style={{ fontSize: '22px', color: COLORS.brand, margin: '0 0 16px' }}>
        Tu inscripción SENCE está aprobada, {firstName}.
      </Heading>
      <Text style={{ fontSize: '16px', lineHeight: '24px', margin: '0 0 16px' }}>
        Confirmamos tu cupo en <strong>{courseTitle}</strong> con franquicia SENCE. Tu
        empleador ya tiene los datos para gestionar el pago a través de la OTEC.
      </Text>
      <Text style={{ fontSize: '15px', lineHeight: '22px', margin: '0 0 16px' }}>
        No tienes que hacer nada más por ahora — te enviaremos los detalles de la sede y qué
        llevar 48 h antes del primer día.
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
          Ver mi curso
        </Button>
      </Section>
    </BaseLayout>
  );
}

export function enrollmentSenceApprovedEmailText({
  name,
  courseTitle,
  myCoursesUrl,
}: Props): string {
  const firstName = name.split(' ')[0] ?? name;
  return [
    `Tu inscripción SENCE está aprobada, ${firstName}.`,
    '',
    `Confirmamos tu cupo en "${courseTitle}" con franquicia SENCE.`,
    '',
    `Ver tu curso: ${myCoursesUrl}`,
    '',
    '— SecuritasEtSalus',
  ].join('\n');
}
