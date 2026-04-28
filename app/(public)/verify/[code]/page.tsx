import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import styles from './page.module.scss';

type Props = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Verificación · ${code}`,
    description: `Verificación pública del diploma ${code} emitido por SecuritasEtSalus.`,
    robots: { index: false, follow: false },
  };
}

export default async function VerifyCodePage({ params }: Props) {
  const { code } = await params;
  // Fase 1: placeholder — la lógica real de búsqueda en BD va en Fase 6
  // (verificación pública + endpoint /api/diplomas/[code]/verify).
  // Para que la página exista y sea linkeable desde QR, mostramos un
  // mensaje claro de "verificación en desarrollo".

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={styles.eyebrow}>Verificación de diploma</span>
        <p className={styles.codeLabel}>Código consultado</p>
        <p className={styles.code}>{code}</p>

        <div className={styles.placeholder}>
          <h1>Verificación en desarrollo</h1>
          <p>
            El sistema de verificación pública de diplomas SES estará disponible cuando
            cerremos la Fase 6 del desarrollo. En ese momento, esta página mostrará el estado,
            el alumno, el curso y la fecha de emisión del diploma asociado al código.
          </p>
          <p>
            Si necesitas verificar un diploma con urgencia, escríbenos a{' '}
            <a href="mailto:contacto@ses.agsint.cl">contacto@ses.agsint.cl</a> y lo confirmamos
            manualmente.
          </p>
        </div>

        <div className={styles.actions}>
          <Button href="/verify" variant="secondary" size="md">
            Probar otro código
          </Button>
          <Link href="/" className={styles.homeLink}>
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
