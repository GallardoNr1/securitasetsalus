import type { ReactNode } from 'react';
import styles from '@/design-system/components/Badge.module.scss';

type DiplomaBadgeStatus = 'active' | 'revoked';
type EnrollmentBadgeStatus = 'confirmed' | 'pending' | 'cancelled' | 'failed';
type BadgeStatus = DiplomaBadgeStatus | EnrollmentBadgeStatus;
type BadgeTone = 'primary' | 'accent';

type BadgeProps = {
  children?: ReactNode;
  status?: BadgeStatus;
  tone?: BadgeTone;
  showDot?: boolean;
  className?: string;
};

const statusLabels: Record<BadgeStatus, string> = {
  active: 'Vigente',
  revoked: 'Revocado',
  confirmed: 'Inscrito',
  pending: 'Pendiente de pago',
  cancelled: 'Cancelado',
  failed: 'No aprobado',
};

export function Badge({ children, status, tone, showDot = true, className }: BadgeProps) {
  const variantClass = status ? styles[status] : tone ? styles[tone] : '';
  const classes = [styles.badge, variantClass, className].filter(Boolean).join(' ');
  const content = children ?? (status ? statusLabels[status] : null);

  return (
    <span className={classes}>
      {showDot && status ? <span className={styles.dot} aria-hidden /> : null}
      {content}
    </span>
  );
}
