'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, ErrorMessage } from '@/components/ui/Input';
import { enrollAction } from './actions';
import styles from './EnrollPanel.module.scss';

// `router.push` con typedRoutes exige una Route literal o un cast
// explícito. Usamos un cast aquí porque la query string es dinámica.
const SUCCESS_NO_STRIPE_URL = '/billing/success?mode=no-stripe' as Route;

type Props = {
  courseSlug: string;
  isLogged: boolean;
  isFull: boolean;
  emailVerified: boolean;
  senceEligible: boolean;
};

/**
 * Panel de inscripción que reemplaza al botón estático en /courses/[slug].
 *
 * Estados:
 *  - No logueado: link a /login con redirect post-login.
 *  - Curso lleno: botón disabled.
 *  - Email no verificado: aviso + link a reenviar verificación.
 *  - Logueado y verificado: form con checkbox SENCE opcional. Si marca
 *    SENCE, se expanden los campos de empleador.
 *
 * El submit llama a `enrollAction`. Según el modo devuelto:
 *  - `stripe-checkout` → window.location = checkoutUrl (Stripe).
 *  - `sence-pending` → router.push('/my-courses?sence=submitted').
 *  - `no-stripe-confirmed` → router.push('/billing/success?mode=no-stripe').
 */
export function EnrollPanel({
  courseSlug,
  isLogged,
  isFull,
  emailVerified,
  senceEligible,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [useSence, setUseSence] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (isFull) {
    return (
      <button type="button" className={styles.disabledButton} disabled>
        Curso lleno — sin cupos
      </button>
    );
  }

  if (!isLogged) {
    const redirect = `/courses/${courseSlug}` as Route;
    return (
      <>
        <Link
          href={{ pathname: '/login', query: { redirect } }}
          className={styles.primaryLink}
        >
          Iniciar sesión para inscribirme
          <ArrowRight />
        </Link>
        <p className={styles.note}>
          Si todavía no tienes cuenta, puedes <Link href="/register">crearla aquí</Link> en
          dos minutos.
        </p>
      </>
    );
  }

  if (!emailVerified) {
    return (
      <>
        <p className={styles.warning}>
          Tu correo aún no está verificado. Revisa tu bandeja para confirmar la cuenta antes
          de poder inscribirte.
        </p>
        <Link href="/profile" className={styles.secondaryLink}>
          Ir a mi perfil
        </Link>
      </>
    );
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      setFieldErrors({});
      const result = await enrollAction({
        courseSlug,
        useSence,
        employerRut: (formData.get('employerRut') as string) || undefined,
        employerName: (formData.get('employerName') as string) || undefined,
        employerHrEmail: (formData.get('employerHrEmail') as string) || undefined,
      });

      if (!result.ok) {
        setError(result.message);
        if (result.error === 'invalid' && result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }

      if (result.mode === 'stripe-checkout') {
        window.location.href = result.checkoutUrl;
        return;
      }
      if (result.mode === 'sence-pending') {
        router.push('/my-courses?sence=submitted');
        return;
      }
      // no-stripe-confirmed
      router.push(SUCCESS_NO_STRIPE_URL);
    });
  }

  return (
    <form action={handleSubmit} className={styles.form} noValidate>
      {error ? <div className={styles.error}>{error}</div> : null}

      {senceEligible ? (
        <label className={styles.senceToggle}>
          <input
            type="checkbox"
            checked={useSence}
            onChange={(e) => setUseSence(e.target.checked)}
            disabled={pending}
          />
          <span>
            <strong>Pagar con franquicia SENCE</strong>
            <span className={styles.senceHint}>
              Si tu empresa cubre el curso vía OTEC. La inscripción queda pendiente hasta que
              SES apruebe los datos de tu empleador.
            </span>
          </span>
        </label>
      ) : null}

      {useSence ? (
        <div className={styles.senceFields}>
          <Field>
            <Label htmlFor="employerRut" required>
              RUT del empleador
            </Label>
            <Input
              id="employerRut"
              name="employerRut"
              required
              error={Boolean(fieldErrors.employerRut)}
              placeholder="76.123.456-7"
            />
            {fieldErrors.employerRut ? (
              <ErrorMessage>{fieldErrors.employerRut}</ErrorMessage>
            ) : null}
          </Field>
          <Field>
            <Label htmlFor="employerName" required>
              Razón social del empleador
            </Label>
            <Input
              id="employerName"
              name="employerName"
              required
              error={Boolean(fieldErrors.employerName)}
              placeholder="Empresa SpA"
            />
            {fieldErrors.employerName ? (
              <ErrorMessage>{fieldErrors.employerName}</ErrorMessage>
            ) : null}
          </Field>
          <Field>
            <Label htmlFor="employerHrEmail" required>
              Email de RR.HH.
            </Label>
            <Input
              id="employerHrEmail"
              name="employerHrEmail"
              type="email"
              required
              error={Boolean(fieldErrors.employerHrEmail)}
              placeholder="rrhh@empresa.cl"
            />
            {fieldErrors.employerHrEmail ? (
              <ErrorMessage>{fieldErrors.employerHrEmail}</ErrorMessage>
            ) : null}
          </Field>
        </div>
      ) : null}

      <Button type="submit" variant="primary" size="lg" loading={pending} fullWidth>
        {useSence ? 'Solicitar inscripción SENCE' : 'Inscribirme y pagar'}
      </Button>
    </form>
  );
}

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}
