import styles from '@/design-system/components/Avatar.module.scss';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type Props = {
  /** Nombre del usuario — se usa para iniciales y aria-label. */
  name: string;
  /** Tamaño visual del avatar. Por defecto 'md' (40px). */
  size?: Size;
  /** Clase extra para sobrescribir layout en sitios concretos. */
  className?: string;
};

const sizePx: Record<Size, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 64,
  xl: 128,
};

function initialsFor(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('') || 'S'
  );
}

/**
 * Avatar circular con iniciales generadas a partir del nombre.
 *
 * En esta fase solo soporta iniciales — la foto subida (con `avatarKey` y
 * endpoint `/api/users/[id]/avatar` que devuelva 302 a URL firmada de R2)
 * se añade cuando exista el flujo de upload de foto de perfil.
 */
export function Avatar({ name, size = 'md', className }: Props) {
  const px = sizePx[size];
  const cls = [styles.avatar, styles[size], className].filter(Boolean).join(' ');

  return (
    <span className={cls} style={{ width: px, height: px }} aria-label={name} role="img">
      <span className={styles.initials} aria-hidden>
        {initialsFor(name)}
      </span>
    </span>
  );
}
