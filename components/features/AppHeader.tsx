import Link from 'next/link';
import Image from 'next/image';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { isBucketConfigured } from '@/lib/r2-config';
import { AppNav } from './AppNav';
import { UserMenu } from './UserMenu';
import styles from './AppHeader.module.scss';

/**
 * Header de la zona logueada.
 *
 * Layout: logo+wordmark a la izquierda · nav central por rol · UserMenu
 * (avatar + dropdown) a la derecha. Comparte lenguaje visual con el
 * SiteHeader y el FloatingHeader (Fraunces wordmark con 'Et' italic en
 * verde marca, pill nav, sticky), pero con un nav distinto: aquí los
 * items dependen del rol del usuario (ver AppNav).
 */
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
    <header className={styles.wrapper}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} aria-label="Inicio — SecuritasEtSalus">
          <Image
            src="/brand/logo-mark.png"
            alt=""
            width={34}
            height={34}
            className={styles.logo}
            priority
          />
          <span className={styles.brandName}>
            Securitas<span className={styles.brandItalic}>Et</span>Salus
          </span>
        </Link>

        {user ? <AppNav role={user.role} /> : <span aria-hidden />}

        {user && user.name ? (
          <UserMenu
            user={{ id: user.id, name: user.name, role: user.role }}
            avatarKey={avatarKey}
          />
        ) : (
          <span aria-hidden />
        )}
      </div>
    </header>
  );
}
