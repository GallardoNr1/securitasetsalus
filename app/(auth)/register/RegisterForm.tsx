'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, ErrorMessage, Select } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { REGION_LABELS, SUPPORTED_REGIONS } from '@/lib/regions';
import { registerAction } from './actions';
import styles from '../authForm.module.scss';

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      setFieldErrors({});
      const result = await registerAction(formData);
      if (!result.ok) {
        setError(result.message);
        if (result.error === 'invalid' && result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        return;
      }
      router.push(`/verify-email/sent?email=${encodeURIComponent(result.email)}`);
    });
  }

  function fieldError(name: string): string | undefined {
    return fieldErrors[name];
  }

  return (
    <div className={styles.card}>
      <span className={styles.eyebrow}>Crear cuenta</span>
      <h1>Regístrate</h1>
      <p>
        Crea tu cuenta de alumno para inscribirte en cursos. Recibirás un correo para confirmar
        tu dirección antes de poder pagar.
      </p>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <form action={handleSubmit} className={styles.form} noValidate>
        <Field>
          <Label htmlFor="name" required>
            Nombre completo
          </Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            error={Boolean(fieldError('name'))}
            placeholder="Juan Pérez González"
          />
          {fieldError('name') ? <ErrorMessage>{fieldError('name')}</ErrorMessage> : null}
        </Field>

        <Field>
          <Label htmlFor="email" required>
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            error={Boolean(fieldError('email'))}
            placeholder="tu@correo.com"
          />
          {fieldError('email') ? <ErrorMessage>{fieldError('email')}</ErrorMessage> : null}
        </Field>

        <div className={styles.row}>
          <Field>
            <Label htmlFor="region" required>
              País
            </Label>
            <Select
              id="region"
              name="region"
              required
              defaultValue="CL"
              error={Boolean(fieldError('region'))}
            >
              {SUPPORTED_REGIONS.map((code) => (
                <option key={code} value={code}>
                  {REGION_LABELS[code]}
                </option>
              ))}
            </Select>
            {fieldError('region') ? <ErrorMessage>{fieldError('region')}</ErrorMessage> : null}
          </Field>

          <Field>
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              error={Boolean(fieldError('phone'))}
              placeholder="+56 9 1234 5678"
            />
            {fieldError('phone') ? <ErrorMessage>{fieldError('phone')}</ErrorMessage> : null}
          </Field>
        </div>

        <Field>
          <Label htmlFor="rut">RUT (opcional, requerido para franquicia SENCE)</Label>
          <Input
            id="rut"
            name="rut"
            error={Boolean(fieldError('rut'))}
            placeholder="12.345.678-9"
          />
          {fieldError('rut') ? <ErrorMessage>{fieldError('rut')}</ErrorMessage> : null}
        </Field>

        <div className={styles.row}>
          <Field>
            <Label htmlFor="password" required>
              Contraseña
            </Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              error={Boolean(fieldError('password'))}
            />
            {fieldError('password') ? <ErrorMessage>{fieldError('password')}</ErrorMessage> : null}
          </Field>

          <Field>
            <Label htmlFor="passwordConfirm" required>
              Repite la contraseña
            </Label>
            <PasswordInput
              id="passwordConfirm"
              name="passwordConfirm"
              autoComplete="new-password"
              required
              minLength={8}
              error={Boolean(fieldError('passwordConfirm'))}
            />
            {fieldError('passwordConfirm') ? (
              <ErrorMessage>{fieldError('passwordConfirm')}</ErrorMessage>
            ) : null}
          </Field>
        </div>

        <label className={styles.checkbox}>
          <input type="checkbox" name="acceptTerms" required />
          <span>
            Acepto los <Link href="/legal/terms">términos y condiciones</Link> y la{' '}
            <Link href="/legal/privacy">política de privacidad</Link>.
          </span>
        </label>
        {fieldError('acceptTerms') ? (
          <ErrorMessage>{fieldError('acceptTerms')}</ErrorMessage>
        ) : null}

        <Button type="submit" variant="primary" size="lg" loading={pending} fullWidth>
          Crear cuenta
        </Button>
      </form>

      <p className={styles.footerLink}>
        ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
      </p>
    </div>
  );
}
