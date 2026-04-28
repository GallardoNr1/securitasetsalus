/**
 * Helpers de formato para UI pública.
 * - Precios en CLP usan separador de miles con punto (estilo chileno).
 * - Fechas se formatean en es-CL.
 */

const CLP_FORMATTER = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);

export function formatPrice(amount: number, currency: string = 'CLP'): string {
  if (currency === 'CLP') {
    return CLP_FORMATTER.format(amount);
  }
  // Stripe usa unidades mínimas. CLP es zero-decimal: el `amount` ya
  // está en pesos. Para otras monedas (USD, EUR...) habría que dividir
  // por 100 antes de formatear.
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase());
  const value = isZeroDecimal ? amount : amount / 100;
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  }).format(value);
}

const DATE_FORMATTER_LONG = new Intl.DateTimeFormat('es-CL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const DATE_FORMATTER_SHORT = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const TIME_FORMATTER = new Intl.DateTimeFormat('es-CL', {
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(date: Date, variant: 'long' | 'short' = 'short'): string {
  return variant === 'long'
    ? DATE_FORMATTER_LONG.format(date)
    : DATE_FORMATTER_SHORT.format(date);
}

export function formatTime(date: Date): string {
  return TIME_FORMATTER.format(date);
}

export function formatDateRange(starts: Date, ends: Date): string {
  // Si las dos fechas son el mismo día: "12 may 2026, 09:00 – 17:00"
  // Si son distintos: "12 – 14 may 2026"
  const sameDay =
    starts.getFullYear() === ends.getFullYear() &&
    starts.getMonth() === ends.getMonth() &&
    starts.getDate() === ends.getDate();

  if (sameDay) {
    return `${formatDate(starts, 'short')}, ${formatTime(starts)} – ${formatTime(ends)}`;
  }
  return `${formatDate(starts, 'short')} – ${formatDate(ends, 'short')}`;
}
