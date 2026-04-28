import type { ComponentProps, ReactNode } from 'react';
import styles from '@/design-system/components/FilterBar.module.scss';

type FilterBarProps = ComponentProps<'form'> & {
  children: ReactNode;
};

export function FilterBar({ className, children, ...rest }: FilterBarProps) {
  return (
    <form className={[styles.bar, className].filter(Boolean).join(' ')} method="get" {...rest}>
      {children}
    </form>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}

FilterBar.Actions = Actions;
