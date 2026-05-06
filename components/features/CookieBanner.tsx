'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './CookieBanner.module.scss';

/**
 * Aviso informativo de cookies. NO es un opt-in con switches porque SES
 * solo usa cookies estrictamente necesarias:
 *
 *   - Sesión NextAuth (login, JWT en cookie httpOnly).
 *   - Stripe Checkout (cookies del propio iframe de Stripe, opcionales
 *     para anti-fraude — corren en el dominio de Stripe, no aquí).
 *   - Sentry (no cookies — usa fingerprinting de session_id en localStorage).
 *
 * Bajo la Ley 19.628 + 21.719 chilena y el GDPR EU, las cookies
 * estrictamente necesarias no requieren consentimiento previo. Por eso
 * el banner es **informativo**: aparece, da contexto y permite
 * dismissear ("Entendido"). El estado se persiste en localStorage para
 * que no vuelva a aparecer.
 *
 * Si más adelante añadimos analítica (Plausible, Vercel Analytics) o
 * ads, esto se convierte en opt-in real con switches y este comentario
 * será obsoleto.
 */

const STORAGE_KEY = 'ses-cookie-notice-dismissed-v1';

export function CookieBanner() {
  // Empezamos `null` para evitar mismatch de hidratación (el server no
  // sabe el estado de localStorage). Mostramos solo después del primer
  // useEffect.
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== '1');
    } catch {
      // Si localStorage está bloqueado (Safari privado, etc.), no
      // mostramos para no ser molestos sin poder recordar el dismiss.
      setVisible(false);
    }
  }, []);

  function handleDismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignored
    }
    setVisible(false);
  }

  if (visible !== true) return null;

  return (
    <div
      className={styles.banner}
      role="region"
      aria-label="Aviso de cookies"
    >
      <div className={styles.inner}>
        <div className={styles.text}>
          <strong className={styles.title}>Solo usamos cookies necesarias.</strong>
          <p className={styles.body}>
            Las que mantienen tu sesión iniciada y procesan los pagos. No usamos analítica
            ni publicidad. Más detalles en nuestra{' '}
            <Link href="/legal/privacy" className={styles.link}>
              política de privacidad
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          className={styles.button}
          onClick={handleDismiss}
          aria-label="Entendido, cerrar el aviso de cookies"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
