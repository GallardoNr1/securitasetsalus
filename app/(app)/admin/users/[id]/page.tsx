import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserById } from '@/lib/queries/users';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { SUPPORTED_REGIONS, type SupportedRegion } from '@/lib/regions';
import { formatDate } from '@/lib/format';
import { UserForm } from '../UserForm';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Editar usuario · Admin',
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const { id } = await params;
  const user = await getUserById(id);
  if (!user) notFound();

  const region: SupportedRegion =
    user.region && (SUPPORTED_REGIONS as readonly string[]).includes(user.region)
      ? (user.region as SupportedRegion)
      : 'CL';

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Panel admin', href: '/admin' },
          { label: 'Usuarios', href: '/admin/users' },
          { label: user.name },
        ]}
      />

      <header className={styles.header}>
        <Avatar name={user.name} userId={user.id} avatarKey={user.avatarKey} size="lg" />
        <div>
          <span className={styles.eyebrow}>Usuario</span>
          <h1>{user.name}</h1>
          <p className={styles.email}>{user.email}</p>
          <div className={styles.badges}>
            {user.emailVerifiedAt ? (
              <Badge status="confirmed" showDot={false}>
                Email verificado
              </Badge>
            ) : (
              <Badge status="pending" showDot={false}>
                Sin verificar
              </Badge>
            )}
            <span className={styles.muted}>
              · Alta {formatDate(user.createdAt, 'short')}
            </span>
          </div>
        </div>
      </header>

      <UserForm
        mode="edit"
        userId={user.id}
        initial={{
          name: user.name,
          email: user.email,
          role: user.role,
          region,
          subdivision: user.subdivision,
          phone: user.phone,
          rut: user.rut,
        }}
      />
    </div>
  );
}
