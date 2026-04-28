import type { ReactNode } from 'react';
import styles from '@/design-system/components/Tag.module.scss';

type TagTone = 'neutral' | 'brand' | 'accent';

type TagProps = {
  tone?: TagTone;
  children: ReactNode;
  className?: string;
};

export function Tag({ tone = 'neutral', children, className }: TagProps) {
  const classes = [styles.tag, styles[tone], className].filter(Boolean).join(' ');
  return <span className={classes}>{children}</span>;
}
