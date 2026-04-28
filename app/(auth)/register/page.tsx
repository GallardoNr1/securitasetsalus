import type { Metadata } from 'next';
import { RegisterForm } from './RegisterForm';

export const metadata: Metadata = {
  title: 'Crear cuenta',
  description: 'Crea tu cuenta de alumno en SecuritasEtSalus.',
  robots: { index: false, follow: true },
};

export default function RegisterPage() {
  return <RegisterForm />;
}
