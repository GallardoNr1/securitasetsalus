import { Button, Heading, Section, Text } from '@react-email/components';
import { BaseLayout, COLORS } from './BaseLayout';

type Props = {
  name: string;
  courseTitle: string;
  amount: number;
  currency: string;
  myCoursesUrl: string;
};

function formatMoney(amount: number, currency: string): string {
  // Stripe usa la unidad mínima. CLP es zero-decimal → no dividir.
  const isZeroDecimal = ['CLP', 'JPY', 'KRW', 'CLF'].includes(currency.toUpperCase());
  const display = isZeroDecimal ? amount : amount / 100;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  }).format(display);
}

export function EnrollmentConfirmationEmail({
  name,
  courseTitle,
  amount,
  currency,
  myCoursesUrl,
}: Props) {
  const firstName = name.split(' ')[0] ?? name;
  return (
    <BaseLayout preview={`Inscripción confirmada — ${courseTitle}`}>
      <Heading style={{ fontSize: '22px', color: COLORS.brand, margin: '0 0 16px' }}>
        Inscripción confirmada, {firstName}.
      </Heading>
      <Text style={{ fontSize: '16px', lineHeight: '24px', margin: '0 0 16px' }}>
        Recibimos tu pago de <strong>{formatMoney(amount, currency)}</strong> por el curso{' '}
        <strong>{courseTitle}</strong>. Tu cupo está reservado.
      </Text>
      <Text style={{ fontSize: '15px', lineHeight: '22px', margin: '0 0 16px' }}>
        Te enviaremos un recordatorio 48 h antes del primer día con la dirección exacta de la
        sede y qué llevar. Puedes ver toda la información de tu curso en tu panel.
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
      <Text style={{ fontSize: '13px', lineHeight: '20px', margin: '0', color: COLORS.mute }}>
        ¿Necesitas factura? Responde a este correo con tus datos de facturación y te la
        emitimos.
      </Text>
    </BaseLayout>
  );
}

export function enrollmentConfirmationEmailText({
  name,
  courseTitle,
  amount,
  currency,
  myCoursesUrl,
}: Props): string {
  const firstName = name.split(' ')[0] ?? name;
  return [
    `Inscripción confirmada, ${firstName}.`,
    '',
    `Recibimos tu pago de ${formatMoney(amount, currency)} por el curso "${courseTitle}". Tu cupo está reservado.`,
    '',
    'Te enviaremos un recordatorio 48 h antes del primer día.',
    '',
    `Ver tu curso: ${myCoursesUrl}`,
    '',
    '— SecuritasEtSalus',
  ].join('\n');
}
