import Link from 'next/link';
import Image from 'next/image';
import { SiteFooter } from '@/components/features/SiteFooter';
import styles from './layout.module.scss';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/brand/logo-mark.png"
            alt=""
            width={36}
            height={36}
            className={styles.logoMark}
          />
          <span className={styles.logoText}>SecuritasEtSalus</span>
        </Link>
      </header>
      <main className={styles.main}>{children}</main>
      <SiteFooter />
    </>
  );
}
