import type { Metadata } from 'next';
import { ComingSoon } from '@/components/features/ComingSoon';

export const metadata: Metadata = {
  title: 'Crear cuenta',
  robots: { index: false, follow: true },
};

export default function RegisterPage() {
  return (
    <ComingSoon
      title="Registro disponible muy pronto"
      phase="Fase 2"
      description="El registro con verificación de correo se activa en la siguiente fase. Si quieres reservar plaza en algún curso, escríbenos a contacto@ses.agsint.cl."
    />
  );
}
