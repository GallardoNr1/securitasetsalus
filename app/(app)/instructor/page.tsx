import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

/**
 * Redirige al instructor directamente a su listado de cursos asignados.
 * El "panel" como tal sigue siendo /instructor/courses.
 */
export default async function InstructorIndexPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'SUPER_ADMIN') {
    redirect('/');
  }
  redirect('/instructor/courses');
}
