'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import styles from './SiteHeader.module.scss';

/**
 * Header sólido sticky para todas las páginas públicas que NO son la
 * landing. La landing usa `FloatingHeader` (glass sobre el Hero); este
 * usa el mismo lenguaje visual (wordmark Fraunces con 'Et' italic, nav
 * en píldora con activo dinámico, CTAs en píldora negra) pero sin el
 * efecto glass ni margen negativo — funciona sobre cualquier fondo.
 *
 * Es client component porque usa `usePathname()` para marcar el item
 * activo del nav. La sticky position no requiere JS.
 */

const NAV_ITEMS: Array<{ href: Route; label: string; matchPrefixes: string[] }> = [
  { href: '/courses', label: 'Cursos', matchPrefixes: ['/courses'] },
  { href: '/#como-funciona' as Route, label: 'Cómo funciona', matchPrefixes: [] },
  { href: '/#contacto' as Route, label: 'Contacto', matchPrefixes: [] },
];

export function SiteHeader() {
  const pathname = usePathname() ?? '/';

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

        <nav className={styles.nav} aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => {
            const isActive = item.matchPrefixes.some((p) => pathname.startsWith(p));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
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
        </div>
      </div>
    </header>
  );
}
