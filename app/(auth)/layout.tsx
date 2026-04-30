import Link from 'next/link';
import Image from 'next/image';
import { SiteFooter } from '@/components/features/SiteFooter';
import styles from './layout.module.scss';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Inicio — SecuritasEtSalus">
          <Image
            src="/brand/logo-mark.png"
            alt=""
            width={32}
            height={32}
            className={styles.logoMark}
          />
          <span className={styles.brandName}>
            Securitas<span className={styles.brandItalic}>Et</span>Salus
          </span>
        </Link>
        <Link href="/" className={styles.backLink}>
          ← Volver al inicio
        </Link>
      </header>
      <main className={styles.main}>{children}</main>
      <SiteFooter />
    </>
  );
}
