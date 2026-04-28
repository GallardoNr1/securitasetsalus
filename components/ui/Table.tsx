import type { ComponentProps, ReactNode } from 'react';
import styles from '@/design-system/components/Table.module.scss';

type TableProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Tabla con wrapper scrollable para móvil. Componer con Table.Head, Table.Body,
 * Table.Row, Table.HeaderCell, Table.Cell.
 */
export function Table({ children, className }: TableProps) {
  return (
    <div className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      <table className={styles.table}>{children}</table>
    </div>
  );
}

function Head({ children }: { children: ReactNode }) {
  return (
    <thead className={styles.head}>
      <tr>{children}</tr>
    </thead>
  );
}

function Body({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

type RowProps = ComponentProps<'tr'> & {
  hoverable?: boolean;
};

function Row({ hoverable = true, className, children, ...rest }: RowProps) {
  return (
    <tr
      className={[hoverable ? styles.row : styles.rowFlat, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </tr>
  );
}

type HeaderCellProps = ComponentProps<'th'> & {
  align?: 'left' | 'right';
};

function HeaderCell({ align = 'left', className, children, ...rest }: HeaderCellProps) {
  return (
    <th
      className={[styles.headerCell, align === 'right' && styles.headerCellRight, className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </th>
  );
}

type CellProps = ComponentProps<'td'> & {
  muted?: boolean;
  align?: 'left' | 'right';
};

function Cell({ muted, align = 'left', className, children, ...rest }: CellProps) {
  return (
    <td
      className={[
        styles.cell,
        muted && styles.cellMuted,
        align === 'right' && styles.cellRight,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </td>
  );
}

type EmptyProps = {
  children: ReactNode;
};

function Empty({ children }: EmptyProps) {
  return <div className={styles.empty}>{children}</div>;
}

Table.Head = Head;
Table.Body = Body;
Table.Row = Row;
Table.HeaderCell = HeaderCell;
Table.Cell = Cell;
Table.Empty = Empty;
