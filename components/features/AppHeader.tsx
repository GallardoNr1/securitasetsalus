import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/auth';
import { logoutAction } from '@/app/(auth)/actions';
import styles from './AppHeader.module.scss';

const ROLE_LABELS = {
  SUPER_ADMIN: 'Administrador',
  INSTRUCTOR: 'Instructor',
  STUDENT: 'Alumno',
} as const;

export async function AppHeader() {
  const session = await auth();
  const user = session?.user;

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

        {user ? (
          <div className={styles.userBlock}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userRole}>
                {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role}
              </span>
            </div>
            <Link href="/profile" className={styles.profileLink}>
              Mi perfil
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
