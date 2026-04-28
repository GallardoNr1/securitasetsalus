import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { DashboardStub } from '@/components/features/DashboardStub';

export const metadata: Metadata = {
  title: 'Panel de administración',
};

export default async function AdminDashboardPage() {
  const session = await auth();
  const firstName = session?.user.name?.split(' ')[0] ?? 'administrador';

  return (
    <DashboardStub
      greeting={`Hola, ${firstName}`}
      subtitle="Panel de administración. Desde aquí gestionarás cursos, instructores, alumnos, inscripciones, pagos y diplomas."
      cards={[
        {
          phase: 'Fase 3',
          title: 'Cursos',
          description:
            'Crear cursos con sus sesiones, asignar instructor, abrirlos al catálogo o cerrarlos.',
        },
        {
          phase: 'Fase 3',
          title: 'Usuarios',
          description:
            'Crear instructores manualmente (con email pre-verificado) y gestionar alumnos existentes.',
        },
        {
          phase: 'Fase 4',
          title: 'Inscripciones y pagos',
          description:
            'Listado de todas las inscripciones con su estado, pagos y reembolsos. Filtros por curso, fecha y SENCE.',
        },
        {
          phase: 'Fase 5',
          title: 'Diplomas',
          description:
            'Listado completo de diplomas emitidos con búsqueda por código. Revocación manual con motivo.',
        },
      ]}
    />
  );
}
