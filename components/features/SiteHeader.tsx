import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import styles from './SiteHeader.module.scss';

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="Inicio — SecuritasEtSalus">
          <Image
            src="/brand/logo-mark.png"
            alt=""
            width={40}
            height={40}
            className={styles.logo}
            priority
          />
          <span className={styles.name}>SecuritasEtSalus</span>
        </Link>

        <nav className={styles.nav} aria-label="Navegación principal">
          <Link href="/courses" className={styles.navLink}>
            Cursos
          </Link>
          <Link href="/#como-funciona" className={styles.navLink}>
            Cómo funciona
          </Link>
          <Link href="/#contacto" className={styles.navLink}>
            Contacto
          </Link>
        </nav>

        <div className={styles.actions}>
          <Button href="/login" variant="ghost" size="sm">
            Iniciar sesión
          </Button>
          <Button href="/courses" variant="primary" size="sm">
            Ver cursos
          </Button>
        </div>
      </div>
    </header>
  );
}
