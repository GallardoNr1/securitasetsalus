import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { isBucketConfigured } from '@/lib/r2';
import { logoutAction } from '@/app/(auth)/actions';
import { Avatar } from '@/components/ui/Avatar';
import styles from './AppHeader.module.scss';

const ROLE_LABELS = {
  SUPER_ADMIN: 'Administrador',
  INSTRUCTOR: 'Instructor',
  STUDENT: 'Alumno',
} as const;

export async function AppHeader() {
  const session = await auth();
  const user = session?.user;

  // Solo consultamos avatarKey si R2 está configurado — si no, el endpoint
  // devolvería 503 y la <Image> quedaría rota. Mejor pasar null y usar
  // fallback de iniciales en ese caso.
  let avatarKey: string | null = null;
  if (user && isBucketConfigured('avatars')) {
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { avatarKey: true },
    });
    avatarKey = dbUser?.avatarKey ?? null;
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <Image
            src="/brand/logo-mark.png"
            alt=""
            width={32}
            height={32}
            className={styles.logo}
          />
          <span className={styles.name}>SecuritasEtSalus</span>
        </Link>

        {user && user.name ? (
          <div className={styles.userBlock}>
            <Link
              href="/profile"
              className={styles.profileLink}
              aria-label="Ir a mi perfil"
              title="Mi perfil"
            >
              <Avatar name={user.name} userId={user.id} avatarKey={avatarKey} size="md" />
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.name}</span>
                <span className={styles.userRole}>
                  {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role}
                </span>
              </div>
            </Link>
            <form action={logoutAction}>
              <button type="submit" className={styles.logoutButton}>
                Cerrar sesión
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}
