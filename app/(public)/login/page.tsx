import type { Metadata } from 'next';
import { ComingSoon } from '@/components/features/ComingSoon';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <ComingSoon
      title="Inicio de sesión disponible muy pronto"
      phase="Fase 2"
      description="Estamos cableando la autenticación con Credentials y Magic Link. Mientras tanto, puedes explorar el catálogo de cursos."
    />
  );
}
