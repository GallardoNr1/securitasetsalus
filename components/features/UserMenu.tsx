'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { logoutAction } from '@/app/(auth)/actions';
import styles from './UserMenu.module.scss';

type Role = 'STUDENT' | 'INSTRUCTOR' | 'SUPER_ADMIN';

type Props = {
  user: {
    id: string;
    name: string;
    role: Role;
  };
  avatarKey: string | null;
};

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Administrador',
  INSTRUCTOR: 'Instructor',
  STUDENT: 'Alumno',
};

type MenuItem = { href: Route; label: string };

// Solo items relacionados con la cuenta del USUARIO. La navegación del
// sitio (Panel, Cursos, Mis diplomas, etc.) vive en AppNav central — aquí
// no se duplica para evitar dos sitios donde decidir lo mismo.
const ACCOUNT_ITEMS: MenuItem[] = [{ href: '/profile', label: 'Mi perfil' }];

export function UserMenu({ user, avatarKey }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Cerrar al cambiar de ruta (Link no dispara onClick fiable en typed routes).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Cerrar al hacer click fuera.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Cerrar con Escape.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const items = ACCOUNT_ITEMS;

  return (
    <div ref={containerRef} className={styles.container}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Abrir menú de usuario"
      >
        <Avatar name={user.name} userId={user.id} avatarKey={avatarKey} size="md" />
        <span className={styles.userInfo}>
          <span className={styles.userName}>{user.name}</span>
          <span className={styles.userRole}>{ROLE_LABELS[user.role]}</span>
        </span>
        <span className={styles.chevron} aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownName}>{user.name}</span>
            <span className={styles.dropdownRole}>{ROLE_LABELS[user.role]}</span>
          </div>
          <div className={styles.divider} />
          <ul className={styles.menuList}>
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className={styles.divider} />
          <form action={logoutAction} className={styles.logoutForm}>
            <button type="submit" className={styles.logoutItem} role="menuitem">
              Cerrar sesión
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
