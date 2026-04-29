import { Button, Heading, Section, Text } from '@react-email/components';
import { BaseLayout, COLORS } from './BaseLayout';

type Props = {
  name: string;
  courseTitle: string;
  diplomaCode: string;
  verifyUrl: string;
  myCoursesUrl: string;
};

export function DiplomaIssuedEmail({
  name,
  courseTitle,
  diplomaCode,
  verifyUrl,
  myCoursesUrl,
}: Props) {
  const firstName = name.split(' ')[0] ?? name;
  return (
    <BaseLayout
      preview={`Tu diploma de "${courseTitle}" está disponible — código ${diplomaCode}`}
    >
      <Heading style={{ fontSize: '22px', color: COLORS.brand, margin: '0 0 16px' }}>
        ¡Felicitaciones, {firstName}!
      </Heading>
      <Text style={{ fontSize: '16px', lineHeight: '24px', margin: '0 0 16px' }}>
        Tu diploma del curso <strong>{courseTitle}</strong> está emitido y disponible para
        descarga.
      </Text>
      <Text
        style={{
          fontSize: '14px',
          lineHeight: '20px',
          margin: '0 0 8px',
          color: COLORS.mute,
        }}
      >
        Código de verificación pública:
      </Text>
      <Text
        style={{
          fontSize: '20px',
          fontFamily: 'Courier, monospace',
          color: COLORS.brand,
          margin: '0 0 24px',
          letterSpacing: '2px',
        }}
      >
        {diplomaCode}
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
          Descargar mi diploma
        </Button>
      </Section>
      <Text
        style={{
          fontSize: '14px',
          lineHeight: '22px',
          margin: '0 0 8px',
          color: COLORS.mute,
        }}
      >
        Cualquier persona puede verificar la autenticidad de tu diploma en{' '}
        <a href={verifyUrl} style={{ color: COLORS.brand }}>
          {new URL(verifyUrl).host}
        </a>{' '}
        introduciendo el código.
      </Text>
    </BaseLayout>
  );
}

export function diplomaIssuedEmailText({
  name,
  courseTitle,
  diplomaCode,
  verifyUrl,
  myCoursesUrl,
}: Props): string {
  const firstName = name.split(' ')[0] ?? name;
  return [
    `¡Felicitaciones, ${firstName}!`,
    '',
    `Tu diploma del curso "${courseTitle}" está emitido y disponible para descarga.`,
    '',
    `Código de verificación pública: ${diplomaCode}`,
    '',
    `Descargar tu diploma: ${myCoursesUrl}`,
    '',
    `Verifica el diploma en: ${verifyUrl}`,
    '',
    '— SecuritasEtSalus',
  ].join('\n');
}
