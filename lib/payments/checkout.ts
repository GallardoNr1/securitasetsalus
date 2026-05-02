import type Stripe from 'stripe';
import { env } from '@/lib/env';
import { getStripe } from '@/lib/stripe';

/**
 * Helpers para crear Stripe Checkout Sessions desde server actions.
 *
 * Decisión clave: SES usa `price_data` dinámico por curso (no Price IDs
 * pre-creados en Stripe). El motivo es que cada curso tiene su precio +
 * moneda + título propios y queremos evitar tener que sincronizar
 * productos cada vez que el admin edita un curso.
 *
 * `mode: 'payment'` (one-off, no subscriptions). El cliente regresa a
 * `${APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}` o a
 * `/billing/cancelled` si abandona.
 */

export type CreateCheckoutSessionInput = {
  enrollmentId: string;
  user: { email: string; name: string };
  course: {
    id: string;
    title: string;
    shortDescription: string;
    price: number; // en la unidad mínima (CLP es zero-decimal)
    currency: string; // ISO 4217 (CLP, USD, ...)
  };
};

/**
 * Crea una Checkout Session de Stripe para una inscripción concreta.
 * El `enrollmentId` viaja en `metadata` para que el webhook pueda
 * resolver de vuelta qué Enrollment confirmar.
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const successUrl = `${env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${env.NEXT_PUBLIC_APP_URL}/billing/cancelled?enrollment_id=${input.enrollmentId}`;

  return stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: input.user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.course.currency.toLowerCase(),
          unit_amount: input.course.price,
          product_data: {
            name: input.course.title,
            description: input.course.shortDescription.slice(0, 500),
          },
        },
      },
    ],
    metadata: {
      enrollmentId: input.enrollmentId,
      courseId: input.course.id,
    },
    payment_intent_data: {
      metadata: {
        enrollmentId: input.enrollmentId,
        courseId: input.course.id,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    // Stripe permite mínimo 30 minutos. Dejamos 60 para que el alumno
    // tenga margen si tiene que ir a buscar la tarjeta.
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
  });
}
