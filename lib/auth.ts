import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Resend from 'next-auth/providers/resend';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { authConfig } from '@/auth.config';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { loginSchema } from '@/lib/validations/auth';
import { renderMagicLinkEmail, magicLinkEmailText } from '@/lib/email/templates/MagicLinkEmail';

/**
 * Error personalizado para distinguir "credenciales OK pero email no
 * verificado" de "credenciales inválidas". NextAuth v5 permite extender
 * CredentialsSignin con un `code` que el cliente puede leer en `error.code`.
 */
export class EmailNotVerifiedError extends CredentialsSignin {
  override code = 'email-not-verified';
}

/**
 * Configuración completa de NextAuth v5 (runtime Node).
 *
 * El middleware (proxy.ts) usa solo `authConfig` del fichero raíz
 * `auth.config.ts` porque corre en Edge y no puede cargar Prisma ni bcrypt.
 *
 * Estrategia de sesión: JWT. Con Credentials no tendría sentido el adapter
 * (gestionamos el registro nosotros), pero al añadir Magic Link sí lo
 * necesitamos: NextAuth crea automáticamente registros en VerificationToken
 * para validar el token del email.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user || !user.passwordHash) return null;

        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        // Bloqueo de email no verificado solo para STUDENT (los demás roles
        // los crea el admin manualmente y se asume su identidad garantizada).
        if (user.role === 'STUDENT' && !user.emailVerifiedAt) {
          throw new EmailNotVerifiedError();
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          region: user.region,
        };
      },
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM ?? 'SecuritasEtSalus <noreply@example.invalid>',
      // Personalización del email para que no parezca un mensaje genérico de
      // NextAuth — usa nuestra plantilla con branding SES.
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        const html = await renderMagicLinkEmail({ url });
        const text = magicLinkEmailText({ url });

        // Si la API key no está configurada (entorno sin Resend), logueamos
        // y devolvemos OK silencioso. Útil para desarrollo a ciegas.
        if (!provider.apiKey) {
          console.info(`[magic-link skipped] → ${email} (URL: ${url})`);
          return;
        }

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${provider.apiKey}`,
          },
          body: JSON.stringify({
            from: provider.from,
            to: email,
            subject: 'Tu enlace de acceso a SecuritasEtSalus',
            html,
            text,
          }),
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(`Resend error: ${res.status} ${error}`);
        }
      },
    }),
  ],
});
