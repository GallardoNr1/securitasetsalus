import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

// Cabeceras de seguridad aplicadas a todas las rutas.
// La CSP definitiva se afinará cuando añadamos scripts de terceros (Stripe, analytics).
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  // @react-pdf/renderer trae Yoga (layout engine en WASM) y dependencias
  // Node que Turbopack no debe bundlear. Las dejamos como externals del
  // servidor para que las resuelva en runtime como paquetes normales.
  serverExternalPackages: ['@react-pdf/renderer'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

// Sentry envuelve la config para inyectar el plugin de Webpack/Turbopack
// que sube los source maps y oculta los archivos del SDK al cliente.
export default withSentryConfig(nextConfig, {
  org: 'agsint',
  project: 'securitasetsalus',
  silent: !process.env.CI,
  tunnelRoute: '/monitoring',
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  disableLogger: true,
});
