import { Resend } from 'resend';

/**
 * Cliente de Resend con graceful fallback.
 *
 * Si no hay RESEND_API_KEY configurada, `isEmailAvailable()` devuelve false
 * y cualquier llamada a `sendEmail` se loguea en consola en lugar de
 * lanzar una petición real. Permite desarrollo sin API key, despliegues
 * tempranos y tests sin tráfico externo accidental.
 */

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? 'SecuritasEtSalus <noreply@example.invalid>';

export function isEmailAvailable(): boolean {
  return Boolean(apiKey && apiKey.length > 0);
}

export function getFromAddress(): string {
  return from;
}

let cachedClient: Resend | null = null;

function getClient(): Resend {
  if (!apiKey) {
    throw new Error('RESEND_API_KEY no configurada.');
  }
  if (cachedClient) return cachedClient;
  cachedClient = new Resend(apiKey);
  return cachedClient;
}

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SendResult =
  | { ok: true; id: string; skipped?: false }
  | { ok: true; skipped: true }
  | { ok: false; error: string };

/**
 * Envía un email. Nunca lanza: cualquier fallo se captura y devuelve
 * `{ ok: false }` para que el caller decida cómo reaccionar.
 * Si Resend no está configurado devuelve `{ ok: true, skipped: true }`
 * — el caller trata eso como éxito silencioso.
 */
export async function sendEmail(args: SendArgs): Promise<SendResult> {
  if (!isEmailAvailable()) {
    console.info(`[email skipped] → ${args.to} (${args.subject})`);
    return { ok: true, skipped: true };
  }

  try {
    const client = getClient();
    const result = await client.emails.send({
      from,
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      ...(args.replyTo ? { replyTo: args.replyTo } : {}),
    });

    if (result.error) {
      console.error('[email failed]', result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? 'unknown' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido al enviar email.';
    console.error('[email exception]', error);
    return { ok: false, error: message };
  }
}
