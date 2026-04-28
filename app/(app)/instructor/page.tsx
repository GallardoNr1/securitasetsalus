import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { DashboardStub } from '@/components/features/DashboardStub';

export const metadata: Metadata = {
  title: 'Panel del instructor',
};

export default async function InstructorDashboardPage() {
  const session = await auth();
  const firstName = session?.user.name?.split(' ')[0] ?? 'instructor';

  return (
    <DashboardStub
      greeting={`Bienvenido, ${firstName}`}
      subtitle="Panel de instructor. Aquí gestionarás los cursos asignados, marcarás asistencia por sesión y registrarás las evaluaciones."
      cards={[
        {
          phase: 'Fase 3',
          title: 'Cursos asignados',
          description:
            'Listado de cursos que tienes que impartir, con sus fechas, alumnos inscritos y sede.',
        },
        {
          phase: 'Fase 5',
          title: 'Asistencia',
          description:
            'Marca asistencia por sesión. Al final del curso, esta información determina si se emite el diploma.',
        },
        {
          phase: 'Fase 5',
          title: 'Evaluaciones',
          description:
            'Registra la nota final del examen y la evaluación cualitativa de cada alumno (requisito SENCE).',
        },
      ]}
    />
  );
}
