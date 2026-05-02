import { Body, Container, Head, Hr, Html, Preview, Section, Text } from '@react-email/components';
import type { ReactNode } from 'react';

// Branding SES — los clientes de correo ignoran CSS externo, así que todo
// el estilo va inline. Colores alineados con design-system/tokens/_colors.scss.
const COLORS = {
  brand: '#2c5f4a',         // verde profundo (color-primary-700)
  brandDark: '#1f4836',     // hover (color-primary-800)
  accent: '#c9b87a',         // crema del sello (color-accent-400)
  ink: '#1a2622',            // texto (color-text-primary)
  mute: '#4a5450',           // secundario (color-neutral-600)
  surface: '#fafaf7',        // fondo cálido (color-bg-page)
  white: '#ffffff',
  hairline: '#d6d2c5',       // bordes
  danger: '#a64242',         // rojo aviso (color-danger)
  dangerLight: '#FBEDE9',    // fondo aviso (color-danger-light)
  dangerDark: '#5a2424',     // texto sobre aviso (color-danger-dark)
};

const baseStyle = {
  body: {
    backgroundColor: COLORS.surface,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    margin: 0,
    padding: '32px 12px',
    color: COLORS.ink,
  },
  container: {
    backgroundColor: COLORS.white,
    maxWidth: '560px',
    margin: '0 auto',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(26, 38, 34, 0.08)',
  },
  header: {
    backgroundColor: COLORS.brand,
    padding: '28px 32px',
    textAlign: 'center' as const,
  },
  brand: {
    color: COLORS.white,
    fontSize: '26px',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    margin: 0,
    fontFamily: "'Fraunces', Georgia, serif",
  },
  tagline: {
    color: COLORS.accent,
    fontSize: '12px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    margin: '4px 0 0 0',
    fontWeight: 500,
  },
  content: {
    padding: '32px',
  },
  footer: {
    padding: '24px 32px 28px',
    backgroundColor: COLORS.surface,
  },
  footerText: {
    fontSize: '12px',
    color: COLORS.mute,
    lineHeight: '18px',
    margin: 0,
  },
  hr: {
    borderColor: COLORS.hairline,
    margin: '24px 0',
  },
};

export { COLORS, baseStyle };

type Props = {
  preview: string;
  children: ReactNode;
};

export function BaseLayout({ preview, children }: Props) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={baseStyle.body}>
        <Container style={baseStyle.container}>
          <Section style={baseStyle.header}>
            <Text style={baseStyle.brand}>SecuritasEtSalus</Text>
            <Text style={baseStyle.tagline}>Escuela de cerrajería profesional</Text>
          </Section>
          <Section style={baseStyle.content}>{children}</Section>
          <Hr style={{ ...baseStyle.hr, margin: 0 }} />
          <Section style={baseStyle.footer}>
            <Text style={baseStyle.footerText}>
              SecuritasEtSalus — Formación profesional en cerrajería y seguridad para
              Latinoamérica.
            </Text>
            <Text style={{ ...baseStyle.footerText, marginTop: '6px' }}>
              Si recibiste este correo por error, puedes ignorarlo — tu dirección no queda
              registrada en ninguna lista.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
