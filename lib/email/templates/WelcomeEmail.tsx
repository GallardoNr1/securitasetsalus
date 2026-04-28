import { Button, Heading, Link, Section, Text } from '@react-email/components';
import { BaseLayout, COLORS } from './BaseLayout';

type Props = {
  name: string;
  appUrl: string;
};

export function WelcomeEmail({ name, appUrl }: Props) {
  const firstName = name.split(' ')[0] ?? name;
  return (
    <BaseLayout preview={`Bienvenido a SecuritasEtSalus, ${firstName}. Tu cuenta está lista.`}>
      <Heading style={{ fontSize: '22px', color: COLORS.brand, margin: '0 0 16px' }}>
        Bienvenido, {firstName}
      </Heading>
      <Text style={{ fontSize: '16px', lineHeight: '24px', margin: '0 0 16px' }}>
        Tu cuenta en SecuritasEtSalus está lista. Desde ahora puedes inscribirte en cualquiera
        de nuestros cursos presenciales y obtener tu diploma verificable.
      </Text>
      <Text style={{ fontSize: '16px', lineHeight: '24px', margin: '0 0 24px' }}>
        Al completar un curso recibirás un diploma con código QR público. Cualquier cliente,
        empresa o autoridad puede comprobar su autenticidad en segundos.
      </Text>
      <Section style={{ textAlign: 'center', margin: '0 0 24px' }}>
        <Button
          href={`${appUrl}/cursos`}
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
          Ver cursos disponibles
        </Button>
      </Section>
      <Text style={{ fontSize: '14px', color: COLORS.mute, lineHeight: '20px', margin: 0 }}>
        O abre este enlace en tu navegador:{' '}
        <Link href={`${appUrl}/cursos`} style={{ color: COLORS.brand }}>
          {appUrl}/cursos
        </Link>
      </Text>
    </BaseLayout>
  );
}

export function welcomeEmailText({ name, appUrl }: Props): string {
  const firstName = name.split(' ')[0] ?? name;
  return [
    `Bienvenido a SecuritasEtSalus, ${firstName}.`,
    '',
    'Tu cuenta está lista. Desde ahora puedes inscribirte en cualquiera de nuestros cursos presenciales y obtener tu diploma verificable.',
    '',
    'Al completar un curso recibirás un diploma con código QR público. Cualquier cliente, empresa o autoridad puede comprobar su autenticidad en segundos.',
    '',
    `Ver cursos disponibles: ${appUrl}/cursos`,
    '',
    '—',
    'SecuritasEtSalus — Formación profesional en cerrajería y seguridad',
  ].join('\n');
}
