import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
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

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SecuritasEtSalus — Escuela de cerrajería profesional',
    description:
      'Cursos presenciales de cerrajería y seguridad con diplomas verificables.',
  },
  robots: {
    index: true,
    follow: true,
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
      <body>{children}</body>
    </html>
  );
}
