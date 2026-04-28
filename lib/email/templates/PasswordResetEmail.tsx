import { Button, Heading, Link, Section, Text } from '@react-email/components';
import { BaseLayout, COLORS } from './BaseLayout';

type Props = {
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
};

export function PasswordResetEmail({ name, resetUrl, expiresInMinutes }: Props) {
  const firstName = name.split(' ')[0] ?? name;
  return (
    <BaseLayout preview="Restablece tu contraseña en SecuritasEtSalus.">
      <Heading style={{ fontSize: '22px', color: COLORS.brand, margin: '0 0 16px' }}>
        Restablece tu contraseña, {firstName}
      </Heading>
      <Text style={{ fontSize: '16px', lineHeight: '24px', margin: '0 0 16px' }}>
        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Si fuiste tú,
        pulsa el botón para crear una nueva:
      </Text>
      <Section style={{ textAlign: 'center', margin: '0 0 24px' }}>
        <Button
          href={resetUrl}
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
          Crear nueva contraseña
        </Button>
      </Section>
      <Text style={{ fontSize: '14px', color: COLORS.mute, lineHeight: '20px', margin: 0 }}>
        Este enlace caduca en {expiresInMinutes} minutos y solo se puede usar una vez.
      </Text>
      <Text style={{ fontSize: '14px', color: COLORS.mute, lineHeight: '20px', marginTop: '12px' }}>
        Si no fuiste tú, ignora este correo. Tu contraseña actual sigue intacta y nadie podrá
        cambiarla sin acceso a este enlace.
      </Text>
      <Text style={{ fontSize: '14px', color: COLORS.mute, lineHeight: '20px', marginTop: '12px' }}>
        ¿El botón no funciona? Copia este enlace en tu navegador:{' '}
        <Link href={resetUrl} style={{ color: COLORS.brand, wordBreak: 'break-all' }}>
          {resetUrl}
        </Link>
      </Text>
    </BaseLayout>
  );
}

export function passwordResetEmailText({ name, resetUrl, expiresInMinutes }: Props): string {
  const firstName = name.split(' ')[0] ?? name;
  return [
    `Hola ${firstName},`,
    '',
    'Hemos recibido una solicitud para restablecer tu contraseña. Si fuiste tú, abre este enlace:',
    '',
    resetUrl,
    '',
    `El enlace caduca en ${expiresInMinutes} minutos. Si no fuiste tú, ignora este correo.`,
    '',
    '—',
    'SecuritasEtSalus',
  ].join('\n');
}
