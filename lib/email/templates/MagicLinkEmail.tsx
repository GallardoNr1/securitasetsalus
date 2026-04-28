import { render } from '@react-email/components';
import { Button, Heading, Link, Section, Text } from '@react-email/components';
import { BaseLayout, COLORS } from './BaseLayout';

type Props = {
  url: string;
};

export function MagicLinkEmail({ url }: Props) {
  return (
    <BaseLayout preview="Tu enlace de acceso a SecuritasEtSalus.">
      <Heading style={{ fontSize: '22px', color: COLORS.brand, margin: '0 0 16px' }}>
        Tu enlace de acceso
      </Heading>
      <Text style={{ fontSize: '16px', lineHeight: '24px', margin: '0 0 16px' }}>
        Pulsa el botón para iniciar sesión en SecuritasEtSalus. Es un enlace de un solo uso —
        no necesitas contraseña.
      </Text>
      <Section style={{ textAlign: 'center', margin: '0 0 24px' }}>
        <Button
          href={url}
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
          Iniciar sesión
        </Button>
      </Section>
      <Text style={{ fontSize: '14px', color: COLORS.mute, lineHeight: '20px', margin: 0 }}>
        Este enlace caduca en 24 horas y solo funciona una vez.
      </Text>
      <Text style={{ fontSize: '14px', color: COLORS.mute, lineHeight: '20px', marginTop: '12px' }}>
        Si no solicitaste este enlace, ignora este correo. Nadie podrá entrar a tu cuenta sin
        acceso a este enlace.
      </Text>
      <Text style={{ fontSize: '14px', color: COLORS.mute, lineHeight: '20px', marginTop: '12px' }}>
        ¿El botón no funciona? Copia este enlace en tu navegador:{' '}
        <Link href={url} style={{ color: COLORS.brand, wordBreak: 'break-all' }}>
          {url}
        </Link>
      </Text>
    </BaseLayout>
  );
}

export function magicLinkEmailText({ url }: Props): string {
  return [
    'Tu enlace de acceso a SecuritasEtSalus:',
    '',
    url,
    '',
    'El enlace caduca en 24 horas y solo funciona una vez.',
    'Si no lo solicitaste, ignora este correo.',
    '',
    '—',
    'SecuritasEtSalus',
  ].join('\n');
}

// Helper para que lib/auth.ts pueda obtener el HTML sin importar `render`
// directamente (mantiene la frontera entre el cliente Resend y la plantilla).
export async function renderMagicLinkEmail(props: Props): Promise<string> {
  return render(MagicLinkEmail(props));
}
