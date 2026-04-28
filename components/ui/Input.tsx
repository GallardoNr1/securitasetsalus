import type { ComponentProps, ReactNode } from 'react';
import styles from '@/design-system/components/Input.module.scss';

type FieldProps = {
  children: ReactNode;
  className?: string;
};

export function Field({ children, className }: FieldProps) {
  return <div className={[styles.field, className].filter(Boolean).join(' ')}>{children}</div>;
}

type LabelProps = ComponentProps<'label'> & { required?: boolean };

export function Label({ required, children, className, ...rest }: LabelProps) {
  return (
    <label className={[styles.label, className].filter(Boolean).join(' ')} {...rest}>
      {children}
      {required ? (
        <span className={styles.required} aria-hidden>
          *
        </span>
      ) : null}
    </label>
  );
}

type InputProps = ComponentProps<'input'> & { error?: boolean };

export function Input({ error, className, ...rest }: InputProps) {
  const classes = [styles.input, error && styles.inputError, className].filter(Boolean).join(' ');
  return <input className={classes} {...rest} />;
}

type TextareaProps = ComponentProps<'textarea'> & { error?: boolean };

export function Textarea({ error, className, ...rest }: TextareaProps) {
  const classes = [styles.input, styles.textarea, error && styles.inputError, className]
    .filter(Boolean)
    .join(' ');
  return <textarea className={classes} {...rest} />;
}

type SelectProps = ComponentProps<'select'> & { error?: boolean };

export function Select({ error, className, children, ...rest }: SelectProps) {
  const classes = [styles.input, styles.select, error && styles.inputError, className]
    .filter(Boolean)
    .join(' ');
  return (
    <select className={classes} {...rest}>
      {children}
    </select>
  );
}

type MessageProps = { children?: ReactNode; className?: string };

export function Hint({ children, className }: MessageProps) {
  return <span className={[styles.hint, className].filter(Boolean).join(' ')}>{children}</span>;
}

export function ErrorMessage({ children, className }: MessageProps) {
  if (!children) return null;
  return (
    <span className={[styles.errorMessage, className].filter(Boolean).join(' ')} role="alert">
      {children}
    </span>
  );
}
