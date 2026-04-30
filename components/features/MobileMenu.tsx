'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/(auth)/actions';
import styles from './MobileMenu.module.scss';

type Role = 'STUDENT' | 'INSTRUCTOR' | 'SUPER_ADMIN';

type MenuItem = { href: Route; label: string };

type Props = {
  /**
   * Si hay sesión, además de los items mostramos el bloque de usuario
   * arriba (avatar + nombre + email) y el botón Cerrar sesión abajo.
   */
  user?: {
    name: string;
    email: string;
    role: Role;
  } | null;
};

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Administrador',
  INSTRUCTOR: 'Instructor',
  STUDENT: 'Alumno',
};

const ITEMS_BY_ROLE: Record<Role, MenuItem[]> = {
  SUPER_ADMIN: [
    { href: '/admin', label: 'Panel admin' },
    { href: '/admin/users', label: 'Usuarios' },
    { href: '/admin/courses', label: 'Cursos' },
    { href: '/profile', label: 'Mi perfil' },
  ],
  INSTRUCTOR: [
    { href: '/instructor', label: 'Panel instructor' },
    { href: '/instructor/courses', label: 'Mis cursos' },
    { href: '/profile', label: 'Mi perfil' },
  ],
  STUDENT: [
    { href: '/dashboard', label: 'Mi panel' },
    { href: '/my-courses', label: 'Mis cursos' },
    { href: '/my-diplomas', label: 'Mis diplomas' },
    { href: '/profile', label: 'Mi perfil' },
  ],
};

const PUBLIC_ITEMS: MenuItem[] = [
  { href: '/courses', label: 'Catálogo de cursos' },
  { href: '/verify', label: 'Verificar diploma' },
];

const PUBLIC_AUTH_ITEMS: MenuItem[] = [
  { href: '/login', label: 'Iniciar sesión' },
  { href: '/register', label: 'Crear cuenta' },
];

export function MobileMenu({ user }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? '/';

  // Cerrar al cambiar de ruta.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Cerrar con Escape + bloquear scroll del body cuando está abierto.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open]);

  const items = user ? ITEMS_BY_ROLE[user.role] : [...PUBLIC_AUTH_ITEMS, ...PUBLIC_ITEMS];

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
      >
        <svg
          viewBox="0 0 24 24"
          width={20}
          height={20}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <line x1={3} y1={6} x2={21} y2={6} />
          <line x1={3} y1={12} x2={21} y2={12} />
          <line x1={3} y1={18} x2={21} y2={18} />
        </svg>
      </button>

      {open ? (
        <div className={styles.drawer} role="dialog" aria-modal="true" aria-label="Menú">
          <header className={styles.header}>
            <Link href="/" className={styles.brand} onClick={() => setOpen(false)}>
              <Image
                src="/brand/logo-mark.png"
                alt=""
                width={28}
                height={28}
                className={styles.logo}
              />
              <span className={styles.brandName}>SES</span>
            </Link>
            <button
              type="button"
              className={styles.close}
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
            >
              ×
            </button>
          </header>

          {user ? (
            <div className={styles.userBlock}>
              <div className={styles.userEyebrow}>SESIÓN INICIADA</div>
              <div className={styles.userRow}>
                <div className={styles.userAvatar}>{getInitials(user.name)}</div>
                <div>
                  <div className={styles.userName}>{user.name}</div>
                  <div className={styles.userEmail}>{user.email}</div>
                  <div className={styles.userRole}>{ROLE_LABELS[user.role]}</div>
                </div>
              </div>
            </div>
          ) : null}

          <nav className={styles.nav}>
            {items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {user ? (
            <form action={logoutAction} className={styles.logoutForm}>
              <button type="submit" className={styles.logoutItem}>
                Cerrar sesión
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function getInitials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('') || 'U'
  );
}
