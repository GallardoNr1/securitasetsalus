import { z } from 'zod';

/**
 * Validación de variables de entorno con Zod v4.
 *
 * - Fase 0 (actual): todas las variables de servicios externos son opcionales
 *   para permitir arrancar `npm run dev` antes de haber conectado nada.
 * - A partir de la Fase 2 (auth) se hará `NEXTAUTH_SECRET` obligatoria.
 * - A partir de la Fase 4 (pagos) se harán `STRIPE_*` obligatorias.
 *
 * Marcar como obligatoria significa: si falta, el arranque revienta con mensaje claro.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // App. Obligatoria para que server actions sepan a qué dominio
  // generar URLs absolutas (verificación pública del diploma, magic link,
  // links en emails). Si falta, fallar al arrancar es preferible a tener
  // diplomas en staging con QRs apuntando a producción.
  NEXT_PUBLIC_APP_URL: z.url(),

  // Base de datos (Fase 2+)
  DATABASE_URL: z.url().optional(),
  DIRECT_URL: z.url().optional(),

  // NextAuth (Fase 2+)
  NEXTAUTH_URL: z.url().optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),

  // Stripe (Fase 4+) — todas opcionales: si STRIPE_SECRET_KEY está vacía,
  // los flujos de pago se desactivan con graceful fallback (sin reventar).
  // No hay STRIPE_*_PRICE_ID — SES usa price_data dinámico por curso.
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Cloudflare R2 (Fase 5+) — un account, varios buckets.
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME_DIPLOMAS: z.string().optional(),
  R2_BUCKET_NAME_MATERIALS: z.string().optional(),
  R2_BUCKET_NAME_RECEIPTS: z.string().optional(),
  R2_BUCKET_NAME_AVATARS: z.string().optional(),
  R2_PUBLIC_URL: z.url().optional(),

  // Email — Resend (Fase 7+)
  RESEND_API_KEY: z.string().optional(),
  // EMAIL_FROM acepta tanto `foo@bar.com` como `"Display Name" <foo@bar.com>`,
  // así que validamos como string en lugar de z.email().
  EMAIL_FROM: z.string().optional(),
  // Protege endpoints de cron (recordatorios de curso). Vercel inyecta
  // `Authorization: Bearer <CRON_SECRET>` cuando dispara el schedule.
  CRON_SECRET: z.string().min(16).optional(),

  // Upstash Redis para rate limiting del endpoint público de verify
  // (`/api/diplomas/[code]/verify`). Si faltan, el rate limit se
  // degrada a no-op con un debug log — esto evita romper dev local.
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:');
  console.error(z.treeifyError(parsed.error));
  throw new Error('Variables de entorno inválidas — revisa tu .env.local');
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
