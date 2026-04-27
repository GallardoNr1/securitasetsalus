import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import styles from '@/design-system/components/Button.module.scss';

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

type SharedProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = SharedProps &
  Omit<ComponentProps<'button'>, keyof SharedProps> & { href?: undefined };

type ButtonAsLink = SharedProps &
  Omit<ComponentProps<typeof Link>, keyof SharedProps | 'href'> & {
    href: ComponentProps<typeof Link>['href'];
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function buildClassName(opts: {
  variant: ButtonVariant;
  size: ButtonSize;
  loading: boolean;
  fullWidth: boolean;
  iconOnly: boolean;
  className?: string;
}) {
  return [
    styles.button,
    styles[opts.size],
    styles[opts.variant],
    opts.loading && styles.loading,
    opts.fullWidth && styles.fullWidth,
    opts.iconOnly && styles.iconOnly,
    opts.className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    iconOnly = false,
    className,
    children,
  } = props;

  const classes = buildClassName({ variant, size, loading, fullWidth, iconOnly, className });

  if (props.href !== undefined) {
    const {
      href,
      variant: _v,
      size: _s,
      loading: _l,
      fullWidth: _f,
      iconOnly: _i,
      className: _c,
      children: _ch,
      ...anchorProps
    } = props;
    return (
      <Link href={href} className={classes} {...anchorProps}>
        {children}
      </Link>
    );
  }

  const {
    variant: _v,
    size: _s,
    loading: _l,
    fullWidth: _f,
    iconOnly: _i,
    className: _c,
    children: _ch,
    href: _h,
    type = 'button',
    disabled,
    ...buttonProps
  } = props;

  return (
    <button type={type} className={classes} disabled={loading || disabled} {...buttonProps}>
      {children}
    </button>
  );
}
