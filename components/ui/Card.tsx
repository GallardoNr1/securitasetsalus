import type { ComponentProps, ReactNode } from 'react';
import styles from '@/design-system/components/Card.module.scss';

type CardVariant = 'default' | 'elevated' | 'flat' | 'diplomaActive' | 'featured';
type CardPadding = false | 'sm' | 'md' | 'lg';

type CardProps = ComponentProps<'div'> & {
  variant?: CardVariant;
  padded?: CardPadding;
  interactive?: boolean;
};

const paddingClass: Record<Exclude<CardPadding, false>, string | undefined> = {
  sm: styles.paddedSm,
  md: styles.padded,
  lg: styles.paddedLg,
};

export function Card({
  variant = 'default',
  padded = false,
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  const classes = [
    styles.card,
    variant !== 'default' && styles[variant],
    padded && paddingClass[padded],
    interactive && styles.interactive,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

type SlotProps = { children: ReactNode; className?: string };

function CardHeader({ children, className }: SlotProps) {
  return <div className={[styles.header, className].filter(Boolean).join(' ')}>{children}</div>;
}

function CardBody({ children, className }: SlotProps) {
  return <div className={[styles.body, className].filter(Boolean).join(' ')}>{children}</div>;
}

function CardFooter({ children, className }: SlotProps) {
  return <div className={[styles.footer, className].filter(Boolean).join(' ')}>{children}</div>;
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
