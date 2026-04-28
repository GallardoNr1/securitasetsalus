import { render } from '@react-email/components';
import { sendEmail, type SendResult } from './client';
import { WelcomeEmail, welcomeEmailText } from './templates/WelcomeEmail';
import {
  EmailVerificationEmail,
  emailVerificationEmailText,
} from './templates/EmailVerificationEmail';
import { PasswordResetEmail, passwordResetEmailText } from './templates/PasswordResetEmail';

/**
 * API de alto nivel para enviar emails transaccionales de SES.
 *
 * Cada función:
 *  - Compone el HTML (React Email → HTML inline).
 *  - Compone el texto plano (fallback de clientes que bloquean HTML).
 *  - Delega en `sendEmail` que ya tiene graceful fallback (si no hay
 *    RESEND_API_KEY, loguea en consola y devuelve éxito silencioso).
 */

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

export async function sendWelcomeEmail(to: string, name: string): Promise<SendResult> {
  const url = appUrl();
  const html = await render(WelcomeEmail({ name, appUrl: url }));
  const text = welcomeEmailText({ name, appUrl: url });
  return sendEmail({
    to,
    subject: `Bienvenido a SecuritasEtSalus, ${name.split(' ')[0] ?? name}`,
    html,
    text,
  });
}

type EmailVerificationArgs = {
  to: string;
  name: string;
  token: string;
  expiresInHours: number;
};

export async function sendEmailVerificationEmail(args: EmailVerificationArgs): Promise<SendResult> {
  const url = appUrl();
  const verifyUrl = `${url}/verify-email/${args.token}`;
  const props = {
    name: args.name,
    verifyUrl,
    expiresInHours: args.expiresInHours,
  };
  const html = await render(EmailVerificationEmail(props));
  const text = emailVerificationEmailText(props);
  return sendEmail({
    to: args.to,
    subject: 'Confirma tu correo en SecuritasEtSalus',
    html,
    text,
  });
}

type PasswordResetArgs = {
  to: string;
  name: string;
  token: string;
  expiresInMinutes: number;
};

export async function sendPasswordResetEmail(args: PasswordResetArgs): Promise<SendResult> {
  const url = appUrl();
  const resetUrl = `${url}/reset-password/${args.token}`;
  const props = {
    name: args.name,
    resetUrl,
    expiresInMinutes: args.expiresInMinutes,
  };
  const html = await render(PasswordResetEmail(props));
  const text = passwordResetEmailText(props);
  return sendEmail({
    to: args.to,
    subject: 'Restablece tu contraseña de SecuritasEtSalus',
    html,
    text,
  });
}

export { isEmailAvailable } from './client';
export type { SendResult } from './client';
