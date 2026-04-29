import * as Sentry from '@sentry/nextjs';

/**
 * Endpoint TEMPORAL diagnóstico para Sentry.
 *
 * Devuelve JSON con qué ve el runtime (sin filtrar valores sensibles —
 * del DSN solo enseñamos los últimos 12 chars), y luego dispara un
 * captureMessage + flush manual para forzar el envío.
 *
 * Borrar tras confirmar que Sentry recibe.
 */
export async function GET() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const dsnTail = dsn ? dsn.slice(-12) : null;
  const dsnLength = dsn ? dsn.length : 0;
  const nodeEnv = process.env.NODE_ENV;
  const sentryClient = Sentry.getClient();
  const sentryEnabled = sentryClient ? sentryClient.getOptions().enabled : null;

  const eventId = Sentry.captureMessage(
    `[sentry-test] mensaje de diagnóstico ${new Date().toISOString()}`,
    'error',
  );

  const flushed = await Sentry.flush(3000);

  return new Response(
    JSON.stringify(
      {
        runtime: {
          NODE_ENV: nodeEnv,
          dsnPresent: Boolean(dsn),
          dsnLength,
          dsnTail,
        },
        sentryClient: {
          initialized: Boolean(sentryClient),
          enabledOption: sentryEnabled,
        },
        capture: {
          eventId,
          flushed,
        },
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
