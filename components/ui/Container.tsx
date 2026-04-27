import type { ComponentProps } from 'react';
import styles from './Container.module.scss';

type ContainerProps = ComponentProps<'div'> & {
  size?: 'sm' | 'md' | 'lg';
  as?: 'div' | 'section' | 'header' | 'footer' | 'main' | 'nav';
};

export function Container({
  size = 'lg',
  as: Tag = 'div',
  className,
  children,
  ...rest
}: ContainerProps) {
  const classes = [styles.container, styles[size], className].filter(Boolean).join(' ');
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
