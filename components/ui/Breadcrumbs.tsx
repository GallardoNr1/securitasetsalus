import Link from 'next/link';
import type { Route } from 'next';
import styles from '@/design-system/components/Breadcrumbs.module.scss';

export type BreadcrumbItem = {
  label: string;
  /** Si se omite, el item se renderiza como "actual" (no clickable). */
  href?: Route;
};

type Props = {
  items: BreadcrumbItem[];
  /** Etiqueta accesible. Default: "Migas de pan". */
  ariaLabel?: string;
  className?: string;
};

/**
 * Breadcrumbs de navegación.
 *
 * Convención: el último item siempre representa la página actual y va
 * sin `href`. Los anteriores son links a las páginas padre. Se renderiza
 * dentro de un `<nav>` con `aria-label` para lectores de pantalla.
 *
 * @example
 * <Breadcrumbs items={[
 *   { label: 'Mis cursos', href: '/my-courses' },
 *   { label: 'Aperturas Básicas' }, // actual, sin href
 * ]} />
 */
export function Breadcrumbs({ items, ariaLabel = 'Migas de pan', className }: Props) {
  if (items.length === 0) return null;

  const classes = [styles.breadcrumbs, className].filter(Boolean).join(' ');

  return (
    <nav aria-label={ariaLabel}>
      <ol className={classes}>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className={styles.item}>
              {item.href && !isLast ? (
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              ) : (
                <span className={styles.current} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
