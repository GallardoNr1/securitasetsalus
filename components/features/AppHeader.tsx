import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { isBucketConfigured } from '@/lib/r2-config';
import { UserMenu } from './UserMenu';
import styles from './AppHeader.module.scss';

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
          <UserMenu
            user={{ id: user.id, name: user.name, role: user.role }}
            avatarKey={avatarKey}
          />
        ) : null}
      </div>
    </header>
  );
}
