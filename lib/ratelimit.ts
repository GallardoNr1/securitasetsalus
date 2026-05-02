import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Rate limiter sliding window basado en Upstash Redis.
 *
 * Si las env vars de Upstash no están rellenas (dev local, primer
 * deploy), `limit()` se degrada a no-op (siempre `success: true`)
 * con un debug log. Así el código del endpoint puede usar siempre el
 * mismo path sin checks condicionales — y al rellenar las env vars en
 * Vercel, el rate limit empieza a aplicar sin redeploy de código.
 *
 * Buckets:
 * - `verifyDiploma` — 30 req/min por IP en `/api/diplomas/[code]/verify`.
 *   Justificación: un cliente legítimo (Clavero, navegador del
 *   verificador) consulta como mucho 1-2 códigos por minuto. 30 deja
 *   margen y bloquea enumeración.
 */

type LimitResult = {
  success: boolean;
  remaining: number;
  reset: number; // epoch ms
  limit: number;
};

const NOOP_RESULT: LimitResult = {
  success: true,
  remaining: Number.POSITIVE_INFINITY,
  reset: 0,
  limit: Number.POSITIVE_INFINITY,
};

let cachedRedis: Redis | null = null;
function getRedis(): Redis | null {
  // La integración Vercel-Upstash inyecta `KV_REST_API_URL` y
  // `KV_REST_API_TOKEN` automáticamente — son los mismos valores que el
  // dashboard de Upstash llamaría `UPSTASH_REDIS_REST_*` pero con el
  // prefijo legacy de Vercel KV.
  const url = env.KV_REST_API_URL;
  const token = env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  if (cachedRedis) return cachedRedis;
  cachedRedis = new Redis({ url, token });
  return cachedRedis;
}

/**
 * Factory para crear limiters perezosos. Cada bucket tiene su prefijo
 * propio para que las cuotas no se mezclen — alguien que satura el
 * verify endpoint no debería bloquear sus intentos de login.
 */
function makeLimiter(
  cache: { value: Ratelimit | null },
  config: { limit: number; window: `${number} s` | `${number} m` | `${number} h`; prefix: string },
): Ratelimit | null {
  if (cache.value) return cache.value;
  const redis = getRedis();
  if (!redis) return null;
  cache.value = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    analytics: true,
    prefix: `ses:rl:${config.prefix}`,
  });
  return cache.value;
}

const verifyCache = { value: null as Ratelimit | null };
const loginCache = { value: null as Ratelimit | null };
const signupCache = { value: null as Ratelimit | null };
const passwordResetCache = { value: null as Ratelimit | null };
const enrollCache = { value: null as Ratelimit | null };

async function applyLimit(
  limiter: Ratelimit | null,
  key: string,
): Promise<LimitResult> {
  if (!limiter) {
    logger.debug('ratelimit no-op (Upstash env vars missing)', { key });
    return NOOP_RESULT;
  }
  const r = await limiter.limit(key);
  return { success: r.success, remaining: r.remaining, reset: r.reset, limit: r.limit };
}

/**
 * Endpoint público de verificación de diplomas — 30 req/min/IP.
 * Justificación: cliente legítimo (Clavero, navegador del verificador)
 * pide 1-2 códigos por minuto; 30 deja margen y bloquea enumeración.
 */
export async function limitVerifyDiploma(ip: string): Promise<LimitResult> {
  return applyLimit(
    makeLimiter(verifyCache, { limit: 30, window: '60 s', prefix: 'verify' }),
    ip,
  );
}

/**
 * Login (Credentials + Magic Link request) — 5 intentos/min/IP.
 * Justificación: usuario humano necesita 1-2; 5 cubre typos. Bloquea
 * brute force de contraseñas y abuso del envío de magic links.
 * Clave: `${ip}:${email}` — un atacante con muchas IPs podría rotar,
 * pero también limitamos por email para que no spamee al mismo
 * usuario desde IPs distintas.
 */
export async function limitLogin(ip: string, email: string): Promise<LimitResult> {
  const key = `${ip}:${email.toLowerCase()}`;
  return applyLimit(
    makeLimiter(loginCache, { limit: 5, window: '60 s', prefix: 'login' }),
    key,
  );
}

/**
 * Signup (creación de cuenta) — 3 cuentas/hora/IP.
 * Justificación: detiene spam de cuentas falsas. Un usuario legítimo
 * registra como mucho 1-2 cuentas (ej. corregir typo en email).
 */
export async function limitSignup(ip: string): Promise<LimitResult> {
  return applyLimit(
    makeLimiter(signupCache, { limit: 3, window: '60 m', prefix: 'signup' }),
    ip,
  );
}

/**
 * Solicitud de password reset — 3/h/email.
 * Mismo razonamiento que login pero la clave es solo el email para no
 * dejar que un atacante con IPs rotativas acose a un usuario concreto
 * con emails de reset.
 */
export async function limitPasswordReset(email: string): Promise<LimitResult> {
  return applyLimit(
    makeLimiter(passwordResetCache, { limit: 3, window: '60 m', prefix: 'pwreset' }),
    email.toLowerCase(),
  );
}

/**
 * Inscripción a curso — 5/h/usuario. Bloquea creación masiva de
 * Enrollments PENDING_PAYMENT que ocuparían cupo y forzarían al cron
 * de cleanup a trabajar de más.
 */
export async function limitEnrollment(userId: string): Promise<LimitResult> {
  return applyLimit(
    makeLimiter(enrollCache, { limit: 5, window: '60 m', prefix: 'enroll' }),
    userId,
  );
}
