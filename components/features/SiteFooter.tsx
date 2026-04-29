import Link from 'next/link';
import Image from 'next/image';
import styles from './SiteFooter.module.scss';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer} id="contacto">
      <div className={styles.inner}>
        <div className={styles.brandColumn}>
          <Link href="/" className={styles.brand} aria-label="Inicio">
            <Image
              src="/brand/logo-seal.png"
              alt=""
              width={64}
              height={64}
              className={styles.seal}
            />
            <div>
              <p className={styles.brandName}>SecuritasEtSalus</p>
              <p className={styles.brandTagline}>Escuela de cerrajería profesional</p>
            </div>
          </Link>
          <p className={styles.brandCopy}>
            OTEC en proceso de acreditación SENCE. Formación rigurosa para profesionales de la
            cerrajería y la seguridad en Chile.
          </p>
        </div>

        <nav className={styles.navColumn} aria-label="Navegación del sitio">
          <h3>Sitio</h3>
          <Link href="/courses">Catálogo de cursos</Link>
          <Link href="/#como-funciona">Cómo funciona</Link>
          <Link href="/login">Iniciar sesión</Link>
          <Link href="/register">Crear cuenta</Link>
        </nav>

        <nav className={styles.navColumn} aria-label="Enlaces legales">
          <h3>Legal</h3>
          <Link href="/legal/terms">Términos y condiciones</Link>
          <Link href="/legal/privacy">Política de privacidad</Link>
          <Link href="/verify">Verificar diploma</Link>
        </nav>

        <div className={styles.contactColumn}>
          <h3>Contacto</h3>
          <p>
            <a href="mailto:contacto@ses.agsint.cl">contacto@ses.agsint.cl</a>
          </p>
          <p className={styles.address}>Santiago, Chile</p>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>© {year} SecuritasEtSalus. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
