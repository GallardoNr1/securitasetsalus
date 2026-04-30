import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { UserForm } from '../UserForm';
import styles from './page.module.scss';

export const metadata: Metadata = {
  title: 'Crear usuario · Admin',
  robots: { index: false, follow: false },
};

export default async function NewUserPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Panel admin', href: '/admin' },
          { label: 'Usuarios', href: '/admin/users' },
          { label: 'Nuevo' },
        ]}
      />
      <header className={styles.header}>
        <span className={styles.eyebrow}>Administración</span>
        <h1>Crear usuario</h1>
        <p>
          Crea un instructor manualmente para que pueda iniciar sesión y gestionar cursos.
          Los usuarios creados desde aquí quedan pre-verificados — no necesitan confirmar el
          email. Una vez creado, podrá editar sus datos personales desde su perfil; tú solo
          podrás cambiarle el rol.
        </p>
      </header>

      <UserForm
        mode="create"
        initial={{
          name: '',
          email: '',
          role: 'INSTRUCTOR',
          region: 'CL',
          subdivision: null,
          phone: null,
          rut: null,
        }}
      />
    </div>
  );
}
