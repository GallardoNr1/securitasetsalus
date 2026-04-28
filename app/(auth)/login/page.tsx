import type { Metadata } from 'next';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
  description: 'Inicia sesión en tu cuenta de SecuritasEtSalus.',
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return <LoginForm />;
}
