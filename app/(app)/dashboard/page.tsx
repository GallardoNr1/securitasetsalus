import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { DashboardStub } from '@/components/features/DashboardStub';

export const metadata: Metadata = {
  title: 'Mi panel',
};

export default async function StudentDashboardPage() {
  const session = await auth();
  const firstName = session?.user.name?.split(' ')[0] ?? 'alumno';

  return (
    <DashboardStub
      greeting={`Hola, ${firstName}`}
      subtitle="Tu panel de alumno. Por ahora puedes explorar el catálogo de cursos. Cuando completes uno, aparecerán aquí tus diplomas."
      cards={[
        {
          phase: 'Fase 4',
          title: 'Mis cursos',
          description:
            'Cuando te inscribas a un curso aparecerá aquí con sus fechas, sede y estado de la inscripción.',
          cta: (
            <Button href="/cursos" variant="primary" size="md">
              Ver catálogo
            </Button>
          ),
        },
        {
          phase: 'Fase 5',
          title: 'Mis diplomas',
          description:
            'Aquí descargarás los PDF de los diplomas que vayas obteniendo, con su código de verificación.',
        },
        {
          phase: 'Fase 4',
          title: 'Pagos',
          description:
            'Historial de pagos e inscripciones, con descarga de comprobantes y datos de franquicia SENCE cuando aplique.',
        },
      ]}
    />
  );
}
