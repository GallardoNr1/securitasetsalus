import { Heading, Section, Text } from '@react-email/components';
import { BaseLayout, COLORS } from './BaseLayout';

type Props = {
  name: string;
  courseTitle: string;
  amount: number;
  currency: string;
  paidAt: Date;
  enrollmentId: string;
  /** Mostrar info de empleador si la inscripción usó SENCE. */
  employerName: string | null;
  employerRut: string | null;
  /** Datos formales de SES — los lee del env para que el admin los actualice sin tocar código. */
  payeeName: string;
  payeeRut: string | null;
  myBillingUrl: string;
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

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function PaymentReceiptEmail({
  name,
  courseTitle,
  amount,
  currency,
  paidAt,
  enrollmentId,
  employerName,
  employerRut,
  payeeName,
  payeeRut,
  myBillingUrl,
}: Props) {
  return (
    <BaseLayout preview={`Recibo de pago — ${courseTitle}`}>
      <Heading style={{ fontSize: '20px', color: COLORS.brand, margin: '0 0 4px' }}>
        Recibo de pago
      </Heading>
      <Text
        style={{
          fontSize: '11px',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: COLORS.mute,
          margin: '0 0 24px',
          fontWeight: 600,
        }}
      >
        Comprobante #{enrollmentId.slice(-10).toUpperCase()}
      </Text>

      <Section
        style={{
          padding: '20px',
          backgroundColor: COLORS.surface,
          borderRadius: '8px',
          border: `1px solid ${COLORS.hairline}`,
          margin: '0 0 20px',
        }}
      >
        <ReceiptRow label="Pagador" value={name} />
        <ReceiptRow label="Curso" value={courseTitle} />
        <ReceiptRow label="Fecha de pago" value={DATE_FORMATTER.format(paidAt)} />
        <ReceiptRow label="Monto" value={formatMoney(amount, currency)} bold />
      </Section>

      {employerName ? (
        <Section
          style={{
            padding: '16px',
            backgroundColor: '#f5f1e3',
            borderRadius: '8px',
            border: `1px solid ${COLORS.accent}`,
            margin: '0 0 20px',
          }}
        >
          <Text
            style={{
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.brand,
              margin: '0 0 8px',
              fontWeight: 600,
            }}
          >
            Franquicia SENCE
          </Text>
          <ReceiptRow label="Empleador" value={employerName} />
          {employerRut ? <ReceiptRow label="RUT empleador" value={employerRut} /> : null}
        </Section>
      ) : null}

      <Section
        style={{
          padding: '16px',
          margin: '0 0 24px',
          borderTop: `1px dashed ${COLORS.hairline}`,
          paddingTop: '16px',
        }}
      >
        <Text
          style={{
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.mute,
            margin: '0 0 6px',
            fontWeight: 600,
          }}
        >
          Emitido por
        </Text>
        <Text
          style={{ fontSize: '14px', color: COLORS.ink, margin: '0 0 2px', fontWeight: 600 }}
        >
          {payeeName}
        </Text>
        {payeeRut ? (
          <Text
            style={{ fontSize: '12px', color: COLORS.mute, margin: 0, fontFamily: 'Courier' }}
          >
            RUT {payeeRut}
          </Text>
        ) : null}
      </Section>

      <Text style={{ fontSize: '13px', lineHeight: '20px', margin: '0', color: COLORS.mute }}>
        Conserva este recibo. Para reimprimirlo o consultar el histórico, entra a{' '}
        <a href={myBillingUrl} style={{ color: COLORS.brand }}>tu panel de pagos</a>.
      </Text>
    </BaseLayout>
  );
}

function ReceiptRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <Text style={{ margin: '0 0 8px', fontSize: '13px', lineHeight: '20px' }}>
      <span
        style={{
          display: 'inline-block',
          width: '130px',
          color: COLORS.mute,
          fontSize: '11px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: COLORS.ink,
          fontWeight: bold ? 700 : 400,
          fontSize: bold ? '15px' : '13px',
        }}
      >
        {value}
      </span>
    </Text>
  );
}

export function paymentReceiptEmailText(props: Props): string {
  const lines = [
    `Recibo de pago — Comprobante #${props.enrollmentId.slice(-10).toUpperCase()}`,
    '',
    `Pagador: ${props.name}`,
    `Curso: ${props.courseTitle}`,
    `Fecha: ${DATE_FORMATTER.format(props.paidAt)}`,
    `Monto: ${formatMoney(props.amount, props.currency)}`,
    '',
  ];
  if (props.employerName) {
    lines.push(
      'Franquicia SENCE',
      `Empleador: ${props.employerName}`,
    );
    if (props.employerRut) lines.push(`RUT empleador: ${props.employerRut}`);
    lines.push('');
  }
  lines.push(
    `Emitido por: ${props.payeeName}`,
    ...(props.payeeRut ? [`RUT: ${props.payeeRut}`] : []),
    '',
    `Histórico de pagos: ${props.myBillingUrl}`,
    '',
    '— SecuritasEtSalus',
  );
  return lines.join('\n');
}
