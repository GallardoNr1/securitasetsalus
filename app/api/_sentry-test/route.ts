/**
 * Endpoint TEMPORAL para verificar que Sentry captura errores en prod.
 *
 * Tirar curl una vez tras configurar el DSN, comprobar que aparece en
 * el dashboard de Sentry, y borrar este archivo.
 *
 * NO dejar en producción más allá del smoke test.
 */
export async function GET() {
  throw new Error('[sentry-smoke-test] error inducido — si ves esto en Sentry, funciona');
}
