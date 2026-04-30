'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/features/AuthShell';
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
      // Redirigimos al panel correcto según el rol — evitamos que un
      // SUPER_ADMIN aterrice en /dashboard (vista de alumno) tras login.
      const dest =
        result.role === 'SUPER_ADMIN'
          ? '/admin'
          : result.role === 'INSTRUCTOR'
            ? '/instructor'
            : '/dashboard';
      router.push(dest);
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
      <AuthShell
        side="login"
        title={
          <>
            Revisa
            <br />
            tu <span style={{ fontStyle: 'italic' }}>correo.</span>
          </>
        }
        subtitle="Te enviamos un enlace para iniciar sesión sin contraseña."
      >
        <div className={styles.body}>
          <div className={styles.successBanner}>
            Si <strong>{magicLinkEmail}</strong> tiene una cuenta en SecuritasEtSalus, te
            mandamos un enlace para iniciar sesión sin contraseña. Caduca en 24 h.
          </div>
          <p>
            Revisa también la carpeta de spam por si acaso. Si no aparece en unos minutos,
            vuelve a intentarlo.
          </p>
          <Button onClick={() => setMode('password')} variant="ghost" size="md" type="button">
            ← Volver al login
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      side="login"
      title={
        <>
          Iniciar
          <br />
          sesión.
        </>
      }
      subtitle="Accede a tu panel, tus diplomas y tus cohortes activas."
      banner={error ? <div className={styles.errorBanner}>{error}</div> : undefined}
    >
      <div className={styles.body}>
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
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                required
              />
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
    </AuthShell>
  );
}
