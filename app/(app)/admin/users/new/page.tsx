import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
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
      <header className={styles.header}>
        <Link href="/admin/users" className={styles.back}>
          ← Volver al listado
        </Link>
        <span className={styles.eyebrow}>Administración</span>
        <h1>Crear usuario</h1>
        <p>
          Crea un instructor manualmente para que pueda iniciar sesión y gestionar cursos.
          Los usuarios creados desde aquí quedan pre-verificados — no necesitan confirmar el
          email.
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
