import { Heading, Text } from '@react-email/components';
import { BaseLayout, COLORS } from './BaseLayout';

type Props = {
  name: string;
  courseTitle: string;
  refundAmount: number;
  currency: string;
  tier: string;
  percentage: number;
};

function formatMoney(amount: number, currency: string): string {
  const isZeroDecimal = ['CLP', 'JPY', 'KRW', 'CLF'].includes(currency.toUpperCase());
  const display = isZeroDecimal ? amount : amount / 100;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  }).format(display);
}

export function CancelationRefundEmail({
  name,
  courseTitle,
  refundAmount,
  currency,
  percentage,
}: Props) {
  const firstName = name.split(' ')[0] ?? name;
  const isFull = percentage === 100;
  const isZero = percentage === 0;

  return (
    <BaseLayout preview={`Cancelación procesada — ${courseTitle}`}>
      <Heading style={{ fontSize: '22px', color: COLORS.brand, margin: '0 0 16px' }}>
        Cancelación procesada
      </Heading>
      <Text style={{ fontSize: '16px', lineHeight: '24px', margin: '0 0 16px' }}>
        Hola {firstName}, tu inscripción a <strong>{courseTitle}</strong> ha sido cancelada
        correctamente.
      </Text>

      {!isZero ? (
        <>
          <Text
            style={{
              fontSize: '14px',
              lineHeight: '20px',
              margin: '0 0 4px',
              color: COLORS.mute,
            }}
          >
            Reembolso ({percentage}%):
          </Text>
          <Text
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: COLORS.brand,
              margin: '0 0 16px',
            }}
          >
            {formatMoney(refundAmount, currency)}
          </Text>
          <Text style={{ fontSize: '14px', lineHeight: '22px', margin: '0 0 16px' }}>
            {isFull
              ? 'Recibirás el reembolso íntegro en la misma tarjeta con la que pagaste, en 5-10 días hábiles según tu banco.'
              : `Recibirás el reembolso parcial en la misma tarjeta con la que pagaste, en 5-10 días hábiles según tu banco. El descuento se aplica según nuestra política de cancelación escalonada por antelación al curso.`}
          </Text>
        </>
      ) : (
        <Text style={{ fontSize: '14px', lineHeight: '22px', margin: '0 0 16px' }}>
          La cancelación se solicitó dentro del rango sin reembolso (menos de 24 h del inicio
          o curso ya iniciado). Tu cupo queda libre para otro alumno.
        </Text>
      )}

      <Text style={{ fontSize: '13px', lineHeight: '20px', margin: '0', color: COLORS.mute }}>
        Si tienes dudas sobre el reembolso, responde a este correo.
      </Text>
    </BaseLayout>
  );
}

export function cancelationRefundEmailText({
  name,
  courseTitle,
  refundAmount,
  currency,
  percentage,
}: Props): string {
  const firstName = name.split(' ')[0] ?? name;
  const lines = [
    `Cancelación procesada — ${courseTitle}`,
    '',
    `Hola ${firstName}, tu inscripción ha sido cancelada correctamente.`,
    '',
  ];
  if (percentage > 0) {
    lines.push(
      `Reembolso (${percentage}%): ${formatMoney(refundAmount, currency)}`,
      '',
      'Llegará a tu tarjeta en 5-10 días hábiles.',
      '',
    );
  } else {
    lines.push(
      'La cancelación está dentro del rango sin reembolso (<24 h o curso ya iniciado).',
      '',
    );
  }
  lines.push('— SecuritasEtSalus');
  return lines.join('\n');
}
