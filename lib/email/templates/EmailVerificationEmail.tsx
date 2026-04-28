import { Button, Heading, Link, Section, Text } from '@react-email/components';
import { BaseLayout, COLORS } from './BaseLayout';

type Props = {
  name: string;
  verifyUrl: string;
  expiresInHours: number;
};

export function EmailVerificationEmail({ name, verifyUrl, expiresInHours }: Props) {
  const firstName = name.split(' ')[0] ?? name;
  return (
    <BaseLayout preview="Confirma tu correo en SecuritasEtSalus para activar tu cuenta.">
      <Heading style={{ fontSize: '22px', color: COLORS.brand, margin: '0 0 16px' }}>
        Confirma tu correo, {firstName}
      </Heading>
      <Text style={{ fontSize: '16px', lineHeight: '24px', margin: '0 0 16px' }}>
        Para activar tu cuenta en SecuritasEtSalus y poder inscribirte en cursos, confirma tu
        dirección de correo pulsando el botón:
      </Text>
      <Section style={{ textAlign: 'center', margin: '0 0 24px' }}>
        <Button
          href={verifyUrl}
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
          Confirmar mi correo
        </Button>
      </Section>
      <Text style={{ fontSize: '14px', color: COLORS.mute, lineHeight: '20px', margin: 0 }}>
        Este enlace caduca en {expiresInHours} horas. Si caducó, vuelve a /login y pulsa
        “Reenviar email”.
      </Text>
      <Text style={{ fontSize: '14px', color: COLORS.mute, lineHeight: '20px', marginTop: '12px' }}>
        ¿El botón no funciona? Copia este enlace en tu navegador:{' '}
        <Link href={verifyUrl} style={{ color: COLORS.brand, wordBreak: 'break-all' }}>
          {verifyUrl}
        </Link>
      </Text>
    </BaseLayout>
  );
}

export function emailVerificationEmailText({ name, verifyUrl, expiresInHours }: Props): string {
  const firstName = name.split(' ')[0] ?? name;
  return [
    `Hola ${firstName},`,
    '',
    'Para activar tu cuenta en SecuritasEtSalus, confirma tu correo abriendo este enlace:',
    '',
    verifyUrl,
    '',
    `El enlace caduca en ${expiresInHours} horas.`,
    '',
    '—',
    'SecuritasEtSalus',
  ].join('\n');
}
