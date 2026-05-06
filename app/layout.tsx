import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import { CookieBanner } from '@/components/features/CookieBanner';
import { env } from '@/lib/env';
import '@/design-system/index.scss';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

const siteUrl = env.NEXT_PUBLIC_APP_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'SecuritasEtSalus — Escuela de cerrajería profesional',
    template: '%s · SecuritasEtSalus',
  },
  description:
    'Escuela de formación profesional en cerrajería y seguridad para Latinoamérica. Cursos presenciales con instructores cualificados y diplomas verificables por QR.',
  keywords: [
    'cerrajería',
    'formación profesional',
    'OTEC SENCE',
    'cursos presenciales',
    'diplomas',
    'seguridad',
    'Latinoamérica',
    'Chile',
  ],
  authors: [{ name: 'SecuritasEtSalus' }],
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: siteUrl,
    siteName: 'SecuritasEtSalus',
    title: 'SecuritasEtSalus — Escuela de cerrajería profesional',
    description:
      'Cursos presenciales de cerrajería y seguridad con diplomas verificables. Formación rigurosa para profesionales en Latinoamérica.',
    images: [
      {
        url: `${siteUrl}/brand/logo-seal.png`,
        width: 1200,
        height: 1200,
        alt: 'Sello SecuritasEtSalus',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SecuritasEtSalus — Escuela de cerrajería profesional',
    description:
      'Cursos presenciales de cerrajería y seguridad con diplomas verificables.',
    images: [`${siteUrl}/brand/logo-seal.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
  // Iconos del sitio. logo-mark.png es la C/sello pequeño, optimizado
  // para favicon y app icons.
  icons: {
    icon: '/brand/logo-mark.png',
    apple: '/brand/logo-mark.png',
  },
};

/**
 * JSON-LD Organization schema — ayuda a buscadores a entender que SES
 * es una organización educativa con cursos publicados. Se inyecta en
 * el `<head>` de toda la app vía `<script type="application/ld+json">`.
 */
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'SecuritasEtSalus',
  alternateName: 'SES',
  url: siteUrl,
  logo: `${siteUrl}/brand/logo-seal.png`,
  description:
    'Escuela de formación profesional en cerrajería y seguridad para Latinoamérica. Cursos presenciales con diplomas verificables.',
  sameAs: [
    // Cuando haya redes sociales, añadirlas aquí.
  ],
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'CL',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'hola@securitasetsalus.cl',
    availableLanguage: ['Spanish'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2c5f4a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontClasses = [fraunces.variable, inter.variable, jetbrainsMono.variable].join(' ');
  return (
    <html lang="es" className={fontClasses}>
      <body>
        {children}
        <CookieBanner />
        <script
          type="application/ld+json"
          // JSON-LD inline es la forma estándar de inyectar structured
          // data; el contenido es JSON serializado, no HTML del usuario.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </body>
    </html>
  );
}
