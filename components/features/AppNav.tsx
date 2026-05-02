'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import styles from './AppNav.module.scss';

type Role = 'STUDENT' | 'INSTRUCTOR' | 'SUPER_ADMIN';

type NavItem = { href: Route; label: string; matchPrefixes: string[] };

/**
 * Items de navegación por rol. Si en el futuro se añaden o quitan
 * páginas, modificar SOLO este mapa — el componente se adapta.
 *
 * El campo `matchPrefixes` controla cuándo se considera el item activo:
 * cualquier pathname que empiece con uno de esos strings ilumina el item.
 */
const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  SUPER_ADMIN: [
    { href: '/admin', label: 'Panel', matchPrefixes: ['/admin'] },
    { href: '/admin/users', label: 'Usuarios', matchPrefixes: ['/admin/users'] },
    { href: '/admin/courses', label: 'Cursos', matchPrefixes: ['/admin/courses'] },
    { href: '/admin/payments', label: 'Pagos', matchPrefixes: ['/admin/payments'] },
  ],
  INSTRUCTOR: [
    { href: '/instructor', label: 'Panel', matchPrefixes: ['/instructor'] },
    { href: '/instructor/courses', label: 'Mis cursos', matchPrefixes: ['/instructor/courses'] },
  ],
  STUDENT: [
    { href: '/dashboard', label: 'Mi panel', matchPrefixes: ['/dashboard'] },
    { href: '/my-courses', label: 'Mis cursos', matchPrefixes: ['/my-courses'] },
    { href: '/my-diplomas', label: 'Mis diplomas', matchPrefixes: ['/my-diplomas'] },
    { href: '/billing', label: 'Mis pagos', matchPrefixes: ['/billing'] },
  ],
};

/**
 * Heurística para decidir cuál item está activo: el item con el
 * matchPrefix más LARGO que coincide gana. Evita que `/admin` se
 * mantenga activo cuando estás en `/admin/users` (porque éste último
 * tiene prefix más específico).
 */
function pickActive(items: NavItem[], pathname: string): NavItem | null {
  let best: NavItem | null = null;
  let bestLen = 0;
  for (const item of items) {
    for (const p of item.matchPrefixes) {
      if (pathname === p || pathname.startsWith(`${p}/`)) {
        if (p.length > bestLen) {
          best = item;
          bestLen = p.length;
        }
      }
    }
  }
  return best;
}

export function AppNav({ role }: { role: Role }) {
  const pathname = usePathname() ?? '/';
  const items = NAV_BY_ROLE[role];
  const active = pickActive(items, pathname);

  return (
    <nav className={styles.nav} aria-label="Navegación principal">
      {items.map((item) => {
        const isActive = active?.href === item.href;
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
  );
}
