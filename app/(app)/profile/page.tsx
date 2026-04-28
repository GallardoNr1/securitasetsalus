import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { isBucketConfigured } from '@/lib/r2';
import { SUPPORTED_REGIONS, type SupportedRegion } from '@/lib/regions';
import { AvatarUploader } from './AvatarUploader';
import { ProfileForm } from './ProfileForm';
import styles from './profile.module.scss';

export const metadata: Metadata = {
  title: 'Mi perfil',
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      region: true,
      subdivision: true,
      phone: true,
      rut: true,
      avatarKey: true,
    },
  });
  if (!user) redirect('/login');

  const region: SupportedRegion =
    user.region && (SUPPORTED_REGIONS as readonly string[]).includes(user.region)
      ? (user.region as SupportedRegion)
      : 'CL';

  const avatarsConfigured = isBucketConfigured('avatars');

  return (
    <div className={styles.page}>
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2>Foto de perfil</h2>
          <p>
            {avatarsConfigured
              ? 'Sube una foto cuadrada para que aparezca en la cabecera y, en el futuro, en tu perfil público.'
              : 'El almacenamiento de avatares aún no está configurado. La opción se activa en cuanto el admin rellene las variables R2_*.'}
          </p>
        </header>

        {avatarsConfigured ? (
          <AvatarUploader userId={user.id} name={user.name} avatarKey={user.avatarKey} />
        ) : (
          <p className={styles.hint}>
            Mientras tanto, tu avatar muestra las iniciales generadas a partir de tu nombre.
          </p>
        )}
      </section>

      <ProfileForm
        initial={{
          name: user.name,
          email: user.email,
          region,
          subdivision: user.subdivision,
          phone: user.phone,
          rut: user.rut,
        }}
      />
    </div>
  );
}
