'use client';

import { forwardRef, useState, type ComponentProps } from 'react';
import styles from '@/design-system/components/Input.module.scss';

type PasswordInputProps = Omit<ComponentProps<'input'>, 'type'> & {
  error?: boolean;
};

/**
 * Input de contraseña con toggle de visibilidad (icono de ojo). Reusa los
 * estilos `.input` y `.inputWrapper` / `.iconRight` / `.hasIconRight` del
 * design system existente — el ojo es un botón nativo posicionado encima
 * del input con el mismo padding-right que las clases ya prevén.
 *
 * forwardRef es necesario para que react-hook-form pueda registrar el ref
 * del input subyacente (los formularios actuales usan `register('password')`
 * que devuelve un ref).
 *
 * Accesibilidad:
 *  - aria-pressed en el botón refleja el estado mostrar/ocultar
 *  - El SVG es decorativo (aria-hidden); el aria-label del button comunica
 *    la acción "Mostrar/Ocultar contraseña" a lectores de pantalla.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ error, className, ...rest }, ref) {
    const [visible, setVisible] = useState(false);

    const wrapperClasses = [styles.inputWrapper, styles.hasIconRight].join(' ');
    const inputClasses = [styles.input, error ? styles.inputError : null, className]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        <input ref={ref} type={visible ? 'text' : 'password'} className={inputClasses} {...rest} />
        <button
          type="button"
          className={styles.passwordToggle}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          tabIndex={-1}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    );
  },
);

function EyeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
