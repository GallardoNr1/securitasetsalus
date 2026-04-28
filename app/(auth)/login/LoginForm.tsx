'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, ErrorMessage } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { loginAction, magicLinkAction } from './actions';
import styles from '../authForm.module.scss';

type Mode = 'password' | 'magic-link' | 'magic-link-sent';

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('password');
  const [error, setError] = useState<string | null>(null);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [pending, startTransition] = useTransition();

  function handlePasswordSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const result = await loginAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push('/dashboard');
      router.refresh();
    });
  }

  function handleMagicLinkSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const result = await magicLinkAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMagicLinkEmail(result.email);
      setMode('magic-link-sent');
    });
  }

  if (mode === 'magic-link-sent') {
    return (
      <div className={styles.card}>
        <span className={styles.eyebrow}>Revisa tu correo</span>
        <h1>Te enviamos un enlace de acceso</h1>
        <div className={styles.successBanner}>
          Si <strong>{magicLinkEmail}</strong> tiene una cuenta en SecuritasEtSalus, te
          mandamos un enlace para iniciar sesión sin contraseña. Caduca en 24 h.
        </div>
        <p>
          Revisa también la carpeta de spam por si acaso. Si no aparece en unos minutos, vuelve
          a intentarlo.
        </p>
        <Button onClick={() => setMode('password')} variant="ghost" size="md" type="button">
          ← Volver al login
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <span className={styles.eyebrow}>Acceso</span>
      <h1>Inicia sesión</h1>
      <p>Bienvenido de vuelta. Accede con tu correo y contraseña, o pide un enlace de acceso.</p>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      {mode === 'password' ? (
        <form action={handlePasswordSubmit} className={styles.form} noValidate>
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
              placeholder="tu@correo.com"
            />
          </Field>

          <Field>
            <Label htmlFor="password" required>
              Contraseña
            </Label>
            <PasswordInput id="password" name="password" autoComplete="current-password" required />
            <p className={styles.footerLink} style={{ textAlign: 'left', marginTop: 4 }}>
              <Link href="/forgot-password">¿Olvidaste tu contraseña?</Link>
            </p>
          </Field>

          <Button type="submit" variant="primary" size="lg" loading={pending} fullWidth>
            Iniciar sesión
          </Button>

          <div className={styles.divider}>o</div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => {
              setError(null);
              setMode('magic-link');
            }}
          >
            Acceder con enlace al correo
          </Button>
        </form>
      ) : (
        <form action={handleMagicLinkSubmit} className={styles.form} noValidate>
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
              placeholder="tu@correo.com"
            />
            <ErrorMessage />
          </Field>

          <Button type="submit" variant="primary" size="lg" loading={pending} fullWidth>
            Enviarme un enlace
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => {
              setError(null);
              setMode('password');
            }}
          >
            ← Volver al login con contraseña
          </Button>
        </form>
      )}

      <p className={styles.footerLink}>
        ¿No tienes cuenta? <Link href="/register">Regístrate</Link>
      </p>
    </div>
  );
}
