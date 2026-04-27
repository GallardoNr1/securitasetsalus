// Hook que Next.js invoca al arrancar el server para inicializar SDKs
// que necesitan engancharse antes de servir requests. Sentry necesita
// esto para el runtime Node y el Edge.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Captura errores no manejados en server components / server actions
// y los envía a Sentry con contexto útil (request URL, headers, etc.).
export { captureRequestError as onRequestError } from '@sentry/nextjs';
