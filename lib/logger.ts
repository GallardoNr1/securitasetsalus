import * as Sentry from '@sentry/nextjs';

/**
 * Wrapper de logging con guard de entorno + integración Sentry.
 *
 * - `debug` → solo se imprime cuando `DEBUG=1` o `NODE_ENV !== 'production'`.
 * - `info` / `warn` → siempre, vía console (Vercel los recoge).
 * - `error` → siempre, vía console + envía a Sentry con tags/extra.
 *
 * Reemplaza el patrón `console.log/info/warn/error` directo en `lib/` y
 * `app/` para evitar exponer información sensible en logs de producción
 * y para asegurar que los errores recuperables que el usuario "no ve"
 * (catch en server actions) lleguen a Sentry.
 */

const isDebugMode =
  process.env.DEBUG === '1' || process.env.NODE_ENV !== 'production';

type LogContext = Record<string, unknown>;

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (!isDebugMode) return;
    if (context) {
      console.log(`[debug] ${message}`, context);
    } else {
      console.log(`[debug] ${message}`);
    }
  },

  info(message: string, context?: LogContext): void {
    if (context) {
      console.info(message, context);
    } else {
      console.info(message);
    }
  },

  warn(message: string, context?: LogContext): void {
    if (context) {
      console.warn(message, context);
    } else {
      console.warn(message);
    }
    // Mensajes de warning también a Sentry como breadcrumb — útil cuando
    // un error posterior necesita contexto de qué iba mal.
    Sentry.addBreadcrumb({
      level: 'warning',
      message,
      data: context,
    });
  },

  /**
   * Loggea un error y lo envía a Sentry con tags/extra para poder filtrar
   * por feature en el dashboard. `context.tags` van como tags primarios;
   * el resto del objeto va como `extra`.
   */
  error(message: string, error: unknown, context?: LogContext & { tags?: Record<string, string> }): void {
    console.error(`[error] ${message}`, error);

    const { tags, ...extra } = context ?? {};
    Sentry.captureException(error, {
      tags: { logger_message: message, ...(tags ?? {}) },
      extra,
    });
  },
};
