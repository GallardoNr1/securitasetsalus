import Link from 'next/link';
import Image from 'next/image';
import styles from './FloatingHeader.module.scss';

/**
 * Header flotante con efecto glass — para la landing.
 *
 * Se posiciona en `top: 20px` con `position: sticky`, fondo translúcido
 * con backdrop-filter, y borde sutil. El nav está dentro de un pill
 * gris claro, con el ítem activo en verde de marca. El CTA principal
 * a la derecha (Inscribirme) en negro.
 *
 * Diseño del rediseño v3 (handoff de claude.ai). Para páginas que no son
 * landing usar `SiteHeader` clásico — el FloatingHeader necesita un Hero
 * con gradiente debajo para que el glass funcione visualmente.
 */
export function FloatingHeader() {
  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
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

        <nav className={styles.nav} aria-label="Navegación principal">
          <Link href="/courses" className={`${styles.navLink} ${styles.navLinkActive}`}>
            Cursos
          </Link>
          <Link href="/#como-funciona" className={styles.navLink}>
            Cómo funciona
          </Link>
          <Link href="/verify" className={styles.navLink}>
            Diplomas
          </Link>
          <Link href="/#sedes" className={styles.navLink}>
            Sedes
          </Link>
          <Link href="/#contacto" className={styles.navLink}>
            Contacto
          </Link>
        </nav>

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
          <Link href="/courses" className={styles.cta}>
            Inscribirme
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
        </div>
      </header>
    </div>
  );
}
