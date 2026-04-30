'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Label, Textarea, Select } from '@/components/ui/Input';
import styles from './contact.module.scss';

type Topic = 'individual' | 'empresa' | 'instructor' | 'otro';

const TOPIC_LABELS: Record<Topic, string> = {
  individual: 'Inscribirme en un curso',
  empresa: 'Curso para mi empresa (SENCE)',
  instructor: 'Postularme como instructor',
  otro: 'Otra consulta',
};

/**
 * Form de contacto público. Por ahora simulado — el envío real (vía
 * Resend al buzón hola@) se cablea cuando la SpA esté formalizada y
 * tengamos dominio verificado en Resend para el subdominio público.
 */
export function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleSubmit(_formData: FormData) {
    startTransition(async () => {
      // Placeholder: simulamos un delay y mostramos el banner de éxito.
      // Cuando exista el endpoint real cambiamos esto por una server
      // action que envíe el email vía Resend.
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className={styles.successBox}>
        <div className={styles.successIcon} aria-hidden>
          <svg
            viewBox="0 0 24 24"
            width={28}
            height={28}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h3 className={styles.successTitle}>Mensaje enviado.</h3>
        <p className={styles.successBody}>
          Te respondemos en menos de 24h hábiles al correo que indicaste. Si es
          urgente, escríbenos por WhatsApp en horario de oficina.
        </p>
        <button
          type="button"
          className={styles.successResetButton}
          onClick={() => setSent(false)}
        >
          Enviar otro mensaje
        </button>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className={styles.form} noValidate>
      <div className={styles.formRow}>
        <Field>
          <Label htmlFor="contact-name" required>
            Nombre completo
          </Label>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            placeholder="Juan Pérez"
          />
        </Field>

        <Field>
          <Label htmlFor="contact-email" required>
            Email
          </Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tu@correo.com"
          />
        </Field>
      </div>

      <div className={styles.formRow}>
        <Field>
          <Label htmlFor="contact-phone">Teléfono (opcional)</Label>
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+56 9 1234 5678"
          />
        </Field>

        <Field>
          <Label htmlFor="contact-topic" required>
            Motivo
          </Label>
          <Select id="contact-topic" name="topic" required defaultValue="individual">
            {(Object.keys(TOPIC_LABELS) as Topic[]).map((t) => (
              <option key={t} value={t}>
                {TOPIC_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field>
        <Label htmlFor="contact-message" required>
          Mensaje
        </Label>
        <Textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          placeholder="Cuéntanos qué necesitas. Si es para empresa, indícanos cuántas personas y la sede preferida."
        />
      </Field>

      <Button type="submit" variant="primary" size="lg" loading={pending}>
        Enviar mensaje
      </Button>

      <p className={styles.formNote}>
        Al enviar aceptas nuestra{' '}
        <a href="/legal/privacy" className={styles.formNoteLink}>
          política de privacidad
        </a>
        . No comparte tu correo con terceros.
      </p>
    </form>
  );
}
