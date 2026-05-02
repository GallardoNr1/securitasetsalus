import Stripe from 'stripe';
import { logger } from '@/lib/logger';

/**
 * Cliente de Stripe con graceful fallback.
 *
 * Si STRIPE_SECRET_KEY no está configurada, `isStripeAvailable()` devuelve
 * false y los flujos de pago se desactivan en la UI sin reventar.
 *
 * Diferencia clave con Clavero: SES usa `price_data` dinámico por curso
 * (no Price IDs hardcoded), por lo que aquí no hay variables de Price.
 * El precio y la moneda viven en el modelo `Course`.
 */

const secretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

export function isStripeAvailable(): boolean {
  return Boolean(secretKey && secretKey.length > 0);
}

export function isStripeWebhookConfigured(): boolean {
  return Boolean(webhookSecret && webhookSecret.length > 0);
}

export function getPublishableKey(): string | null {
  return publishableKey && publishableKey.length > 0 ? publishableKey : null;
}

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY no configurada.');
  }
  if (cached) return cached;
  cached = new Stripe(secretKey);
  return cached;
}

/** Verifica firma del webhook y devuelve el evento parseado, o null si falla. */
export function parseWebhookEvent(
  payload: string | Buffer,
  signature: string,
): Stripe.Event | null {
  if (!webhookSecret) return null;
  try {
    return getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    logger.error('stripe webhook: firma inválida o malformada', error, {
      tags: { feature: 'webhook', step: 'verify-signature' },
    });
    return null;
  }
}
