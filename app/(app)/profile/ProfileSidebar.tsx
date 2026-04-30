'use client';

import { useEffect, useState } from 'react';
import styles from './profile.module.scss';

type Item = {
  id: string;
  label: string;
  description?: string;
};

const ITEMS: Item[] = [
  { id: 'datos', label: 'Datos personales', description: 'Nombre, foto, contacto' },
  { id: 'seguridad', label: 'Cuenta y seguridad', description: 'Contraseña, sesiones' },
  { id: 'notificaciones', label: 'Notificaciones', description: 'Email y alertas' },
  { id: 'pagos', label: 'Métodos de pago', description: 'Stripe, facturas' },
  { id: 'peligro', label: 'Eliminar cuenta', description: 'Acción irreversible' },
];

/**
 * Sidebar de navegación para /profile.
 *
 * - Anchor links a las secciones de la misma página (id="…").
 * - Active state vía hash de la URL — actualizado en `hashchange` y al
 *   click. No usamos IntersectionObserver porque las secciones tienen
 *   alturas dispares y daría saltos confusos al hacer scroll manual.
 * - El último item ("Eliminar cuenta") se renderiza con tono danger
 *   para anticipar visualmente que es destructivo.
 */
export function ProfileSidebar() {
  const [activeId, setActiveId] = useState<string>('datos');

  useEffect(() => {
    function read() {
      const hash = window.location.hash.replace('#', '');
      if (hash) setActiveId(hash);
    }
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  function handleClick(id: string) {
    setActiveId(id);
  }

  return (
    <nav className={styles.sidebar} aria-label="Secciones del perfil">
      <span className={styles.sidebarEyebrow}>Mi cuenta</span>
      <ul className={styles.sidebarList}>
        {ITEMS.map((item) => {
          const isActive = activeId === item.id;
          const isDanger = item.id === 'peligro';
          const cls = [
            styles.sidebarItem,
            isActive ? styles.sidebarItemActive : '',
            isDanger ? styles.sidebarItemDanger : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <li key={item.id}>
              <a href={`#${item.id}`} className={cls} onClick={() => handleClick(item.id)}>
                <span className={styles.sidebarItemLabel}>{item.label}</span>
                {item.description ? (
                  <span className={styles.sidebarItemHint}>{item.description}</span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
