import Link from 'next/link';
import type { Route } from 'next';
import styles from '@/design-system/components/Pagination.module.scss';

type PaginationProps = {
  page: number;
  pageCount: number;
  total: number;
  itemLabel: { singular: string; plural: string };
  /** Función que devuelve la ruta completa para una página dada. */
  hrefFor: (page: number) => Route;
};

export function Pagination({ page, pageCount, total, itemLabel, hrefFor }: PaginationProps) {
  if (pageCount <= 1) return null;

  const label = total === 1 ? itemLabel.singular : itemLabel.plural;

  return (
    <nav className={styles.nav} aria-label="Paginación">
      <span className={styles.info}>
        Página {page} de {pageCount} · {total} {label}
      </span>
      <div className={styles.actions}>
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} className={styles.link}>
            ← Anterior
          </Link>
        ) : (
          <span className={styles.linkDisabled}>← Anterior</span>
        )}
        {page < pageCount ? (
          <Link href={hrefFor(page + 1)} className={styles.link}>
            Siguiente →
          </Link>
        ) : (
          <span className={styles.linkDisabled}>Siguiente →</span>
        )}
      </div>
    </nav>
  );
}
