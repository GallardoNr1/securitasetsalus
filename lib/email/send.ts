import { render } from '@react-email/components';
import { sendEmail, type SendResult } from './client';
import { WelcomeEmail, welcomeEmailText } from './templates/WelcomeEmail';
import {
  EmailVerificationEmail,
  emailVerificationEmailText,
} from './templates/EmailVerificationEmail';
import { PasswordResetEmail, passwordResetEmailText } from './templates/PasswordResetEmail';
import {
  DiplomaIssuedEmail,
  diplomaIssuedEmailText,
} from './templates/DiplomaIssuedEmail';
import {
  EnrollmentConfirmationEmail,
  enrollmentConfirmationEmailText,
} from './templates/EnrollmentConfirmationEmail';
import {
  EnrollmentSenceApprovedEmail,
  enrollmentSenceApprovedEmailText,
} from './templates/EnrollmentSenceApprovedEmail';
import {
  EnrollmentSenceRejectedEmail,
  enrollmentSenceRejectedEmailText,
} from './templates/EnrollmentSenceRejectedEmail';
import {
  CancelationRefundEmail,
  cancelationRefundEmailText,
} from './templates/CancelationRefundEmail';

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

type DiplomaIssuedArgs = {
  to: string;
  name: string;
  courseTitle: string;
  diplomaCode: string;
};

export async function sendDiplomaIssuedEmail(args: DiplomaIssuedArgs): Promise<SendResult> {
  const url = appUrl();
  const verifyUrl = `${url}/verify/${args.diplomaCode}`;
  const myCoursesUrl = `${url}/my-courses`;
  const props = {
    name: args.name,
    courseTitle: args.courseTitle,
    diplomaCode: args.diplomaCode,
    verifyUrl,
    myCoursesUrl,
  };
  const html = await render(DiplomaIssuedEmail(props));
  const text = diplomaIssuedEmailText(props);
  return sendEmail({
    to: args.to,
    subject: `Tu diploma de "${args.courseTitle}" está listo`,
    html,
    text,
  });
}

// ============================================================
// Pagos / inscripciones (Fase 4)
// ============================================================

type EnrollmentConfirmationArgs = {
  to: string;
  name: string;
  courseTitle: string;
  courseSlug: string;
  amount: number;
  currency: string;
};

export async function sendEnrollmentConfirmationEmail(
  args: EnrollmentConfirmationArgs,
): Promise<SendResult> {
  const url = appUrl();
  const props = {
    name: args.name,
    courseTitle: args.courseTitle,
    amount: args.amount,
    currency: args.currency,
    myCoursesUrl: `${url}/my-courses`,
  };
  const html = await render(EnrollmentConfirmationEmail(props));
  const text = enrollmentConfirmationEmailText(props);
  return sendEmail({
    to: args.to,
    subject: `Inscripción confirmada — ${args.courseTitle}`,
    html,
    text,
  });
}

type EnrollmentSenceApprovedArgs = {
  to: string;
  name: string;
  courseTitle: string;
};

export async function sendEnrollmentSenceApprovedEmail(
  args: EnrollmentSenceApprovedArgs,
): Promise<SendResult> {
  const url = appUrl();
  const props = {
    name: args.name,
    courseTitle: args.courseTitle,
    myCoursesUrl: `${url}/my-courses`,
  };
  const html = await render(EnrollmentSenceApprovedEmail(props));
  const text = enrollmentSenceApprovedEmailText(props);
  return sendEmail({
    to: args.to,
    subject: `Solicitud SENCE aprobada — ${args.courseTitle}`,
    html,
    text,
  });
}

type EnrollmentSenceRejectedArgs = {
  to: string;
  name: string;
  courseTitle: string;
  courseSlug: string;
  reason: string;
};

export async function sendEnrollmentSenceRejectedEmail(
  args: EnrollmentSenceRejectedArgs,
): Promise<SendResult> {
  const url = appUrl();
  const props = {
    name: args.name,
    courseTitle: args.courseTitle,
    reason: args.reason,
    enrollAgainUrl: `${url}/courses/${args.courseSlug}`,
  };
  const html = await render(EnrollmentSenceRejectedEmail(props));
  const text = enrollmentSenceRejectedEmailText(props);
  return sendEmail({
    to: args.to,
    subject: `Solicitud SENCE no aprobada — ${args.courseTitle}`,
    html,
    text,
  });
}

type CancelationRefundArgs = {
  to: string;
  name: string;
  courseTitle: string;
  refundAmount: number;
  currency: string;
  tier: string;
  percentage: number;
};

export async function sendCancelationRefundEmail(
  args: CancelationRefundArgs,
): Promise<SendResult> {
  const props = {
    name: args.name,
    courseTitle: args.courseTitle,
    refundAmount: args.refundAmount,
    currency: args.currency,
    tier: args.tier,
    percentage: args.percentage,
  };
  const html = await render(CancelationRefundEmail(props));
  const text = cancelationRefundEmailText(props);
  return sendEmail({
    to: args.to,
    subject: `Cancelación procesada — ${args.courseTitle}`,
    html,
    text,
  });
}

export { isEmailAvailable } from './client';
export type { SendResult } from './client';
