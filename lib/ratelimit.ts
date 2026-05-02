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
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (cachedRedis) return cachedRedis;
  cachedRedis = new Redis({ url, token });
  return cachedRedis;
}

let cachedVerifyLimiter: Ratelimit | null = null;
function getVerifyLimiter(): Ratelimit | null {
  if (cachedVerifyLimiter) return cachedVerifyLimiter;
  const redis = getRedis();
  if (!redis) return null;
  cachedVerifyLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '60 s'),
    analytics: true,
    prefix: 'ses:rl:verify',
  });
  return cachedVerifyLimiter;
}

/**
 * Rate-limita el endpoint público de verificación de diplomas por IP.
 * Devuelve `success: false` cuando se supera la cuota (el endpoint
 * debe responder 429 con `Retry-After`).
 */
export async function limitVerifyDiploma(ip: string): Promise<LimitResult> {
  const limiter = getVerifyLimiter();
  if (!limiter) {
    logger.debug('ratelimit no-op (Upstash env vars missing)', { ip });
    return NOOP_RESULT;
  }
  const r = await limiter.limit(ip);
  return {
    success: r.success,
    remaining: r.remaining,
    reset: r.reset,
    limit: r.limit,
  };
}
