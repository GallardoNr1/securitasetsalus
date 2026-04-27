// Inicializa Sentry para errores capturados en el navegador del usuario.
// Los archivos sentry.{client,server,edge}.config.ts los detecta el plugin
// de @sentry/nextjs en build time.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // En dev no enviamos eventos: el SDK loguea en consola y ya. Evita
  // ensuciar el dashboard de Sentry con stacktraces de cuando estamos
  // tocando código.
  enabled: process.env.NODE_ENV === 'production',

  // Sample rate: capturamos el 100% de errores (volumen bajo) y 10% de
  // performance traces (basta para detectar lentitud sin saturar la cuota
  // del tier gratis: 5k errores/mes + 10k transacciones).
  tracesSampleRate: 0.1,

  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,
});
