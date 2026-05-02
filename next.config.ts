import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

// Cabeceras de seguridad aplicadas a todas las rutas. Política pensada
// para SES en producción: estricta por defecto, abriendo solo los
// orígenes que realmente usamos.
//
// `'unsafe-inline'` y `'unsafe-eval'` en script-src se mantienen porque
// Next.js inyecta scripts inline (router cache, hydration data) y el
// hot-reload de dev usa eval. La alternativa (nonce dinámico por
// request) requiere middleware Edge específico que rompería el cache
// de Vercel — para SES la trade-off no compensa por ahora.
//
// Si se añade analítica (Plausible, Vercel Analytics, etc.) hay que
// listar su dominio en `script-src` y `connect-src`.
const cspDirectives: Record<string, string> = {
  'default-src': "'self'",
  'script-src': "'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
  'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src': "'self' data: https://fonts.gstatic.com",
  'img-src': "'self' data: blob: https: https://*.r2.cloudflarestorage.com",
  'connect-src':
    "'self' https://*.supabase.co https://api.resend.com https://api.stripe.com https://*.upstash.io https://*.sentry.io https://*.ingest.sentry.io",
  'frame-src': 'https://js.stripe.com https://hooks.stripe.com',
  'frame-ancestors': "'none'",
  'base-uri': "'self'",
  'form-action': "'self' https://checkout.stripe.com",
  'object-src': "'none'",
  'upgrade-insecure-requests': '',
};

const cspHeaderValue = Object.entries(cspDirectives)
  .map(([key, value]) => (value ? `${key} ${value}` : key))
  .join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspHeaderValue },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
  },
  // Bloquea prefetch automático sobre dominios que aparecen en la
  // página — minimiza fingerprinting.
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  // Aísla la ventana del browser; previene window.opener y similares
  // (necesario para que Stripe Checkout abierto en pestaña no pueda
  // tocar nuestra ventana original).
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
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
