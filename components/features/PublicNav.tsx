'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import styles from './PublicNav.module.scss';

type Item = { href: Route; label: string };

const ITEMS: Item[] = [
  { href: '/', label: 'Inicio' },
  { href: '/courses', label: 'Cursos' },
  { href: '/contact', label: 'Contacto' },
];

/**
 * Nav central pill para los headers públicos (FloatingHeader + SiteHeader).
 * Solo links a páginas reales — sin anclas — para que el active state sea
 * predecible vía pathname.
 */
export function PublicNav() {
  const pathname = usePathname() ?? '/';

  return (
    <nav className={styles.nav} aria-label="Navegación principal">
      {ITEMS.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
