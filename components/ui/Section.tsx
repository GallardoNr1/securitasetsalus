import type { ComponentProps, ReactNode } from 'react';
import styles from './Section.module.scss';

type SectionProps = ComponentProps<'section'> & {
  tone?: 'page' | 'surface' | 'subtle' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
};

export function Section({
  tone = 'page',
  size = 'md',
  className,
  children,
  ...rest
}: SectionProps) {
  const classes = [styles.section, styles[tone], styles[size], className].filter(Boolean).join(' ');
  return (
    <section className={classes} {...rest}>
      {children}
    </section>
  );
}
