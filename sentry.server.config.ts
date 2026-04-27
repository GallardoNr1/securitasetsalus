// Inicializa Sentry para errores en el runtime Node de Next (server
// components, server actions, route handlers en runtime nodejs).
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.1,
});
