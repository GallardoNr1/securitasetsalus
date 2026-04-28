import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Verificar diploma',
  description:
    'Comprueba la autenticidad de un diploma de SecuritasEtSalus introduciendo su código.',
};

async function verifyAction(formData: FormData) {
  'use server';
  const codeRaw = formData.get('code');
  const code = typeof codeRaw === 'string' ? codeRaw.trim() : '';
  if (!code) return;
  redirect(`/verify/${encodeURIComponent(code)}`);
}

export default function VerifyIndexPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={styles.eyebrow}>Verificación pública</span>
        <h1>Verificar un diploma</h1>
        <p>
          Introduce el código que aparece en el PDF del diploma o escanea el QR. La verificación
          es pública: cualquiera puede comprobar si un diploma de SecuritasEtSalus es legítimo.
        </p>

        <form action={verifyAction} className={styles.form}>
          <label htmlFor="code" className={styles.label}>
            Código del diploma
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            placeholder="ABC123XYZ"
            className={styles.input}
            autoComplete="off"
          />
          <Button type="submit" variant="primary" size="lg">
            Verificar
          </Button>
        </form>

        <p className={styles.help}>
          ¿No tienes el código a mano? Pídele al cerrajero que te muestre el QR del diploma —
          al escanearlo te lleva directamente a la página de verificación.
        </p>
      </div>

      <div className={styles.aside}>
        <h2>Sobre los diplomas SES</h2>
        <p>
          Cada diploma emitido por SecuritasEtSalus lleva un código alfanumérico único y un QR
          firmado. El diploma no caduca — acredita que su titular completó un curso de
          formación específico en una fecha determinada.
        </p>
        <p>
          Para certificación profesional integral (que sí caduca y exige requisitos legales y
          éticos adicionales), consulta el registro de{' '}
          <Link href="https://clavero.agsint.cl" className={styles.externalLink}>
            ClaveroCerrajero
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
