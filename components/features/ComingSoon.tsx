import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import styles from './ComingSoon.module.scss';

type Props = {
  title: string;
  phase: string;
  description: string;
};

export function ComingSoon({ title, phase, description }: Props) {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={styles.eyebrow}>{phase}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className={styles.actions}>
          <Button href="/" variant="primary" size="md">
            Volver al inicio
          </Button>
          <Link href="/cursos" className={styles.secondaryLink}>
            Explorar cursos
          </Link>
        </div>
      </div>
    </main>
  );
}
