import Image from 'next/image';
import styles from '@/design-system/components/Avatar.module.scss';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type Props = {
  /** Nombre del usuario — se usa para iniciales y aria-label. */
  name: string;
  /** ID del usuario — solo se usa si hay avatarKey, para llamar al endpoint. */
  userId?: string;
  /** Si null/undefined o vacío, se renderiza el fallback de iniciales. */
  avatarKey?: string | null;
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
 * Avatar circular con doble modo: foto subida (si existe `avatarKey` y se
 * pasa `userId`) o fallback de iniciales generadas a partir del `name`.
 *
 * La foto se carga vía endpoint propio `/api/users/[id]/avatar` que
 * devuelve un 302 a una URL firmada de R2 — no exponemos la key directa
 * al cliente. Si R2 no está configurado, el endpoint devuelve 503 y el
 * caller debería pasar `avatarKey={null}` para mostrar iniciales.
 */
export function Avatar({ name, userId, avatarKey, size = 'md', className }: Props) {
  const px = sizePx[size];
  const cls = [styles.avatar, styles[size], className].filter(Boolean).join(' ');

  if (avatarKey && userId) {
    return (
      <span className={cls} style={{ width: px, height: px }}>
        <Image
          src={`/api/users/${userId}/avatar`}
          alt={name}
          width={px}
          height={px}
          className={styles.image}
          // Evita que Next revalide la URL firmada al cambiar de DPR —
          // usamos siempre la misma resolución.
          unoptimized
        />
      </span>
    );
  }

  return (
    <span className={cls} style={{ width: px, height: px }} aria-label={name} role="img">
      <span className={styles.initials} aria-hidden>
        {initialsFor(name)}
      </span>
    </span>
  );
}
