import Link from 'next/link';
import Image from 'next/image';
import { MobileMenu } from './MobileMenu';
import { PublicNav } from './PublicNav';
import styles from './SiteHeader.module.scss';

/**
 * Header sólido sticky para todas las páginas públicas que NO son la
 * landing. La landing usa `FloatingHeader` (glass sobre el Hero); este
 * usa el mismo lenguaje visual (wordmark Fraunces con 'Et' italic,
 * acciones en píldora) pero sin el efecto glass ni margen negativo —
 * funciona sobre cualquier fondo.
 *
 * Nav central con links a páginas reales (Inicio / Cursos / Contacto) —
 * sin anclas a la landing, para que el active state sea predecible.
 */

export function SiteHeader() {
  return (
    <header className={styles.wrapper}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="Inicio — SecuritasEtSalus">
          <Image
            src="/brand/logo-mark.png"
            alt=""
            width={34}
            height={34}
            className={styles.logo}
            priority
          />
          <span className={styles.brandName}>
            Securitas<span className={styles.brandItalic}>Et</span>Salus
          </span>
        </Link>

        <PublicNav />

        <div className={styles.actions}>
          <Link href="/verify" className={styles.verifyLink}>
            <svg
              viewBox="0 0 24 24"
              width={14}
              height={14}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <path d="M14 14h3v3h-3zM20 14v3M14 20h3" />
            </svg>
            Verificar
          </Link>
          <Link href="/login" className={styles.cta}>
            Iniciar sesión
            <svg
              viewBox="0 0 24 24"
              width={14}
              height={14}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
          <MobileMenu user={null} />
        </div>
      </div>
    </header>
  );
}
